import * as commander from 'commander';
import { existsSync, readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { resolve } from 'path';
import * as shelljs from 'shelljs';

import { CopyTask } from '../tasks/CopyTask';
import { CopyToRemoteTask } from '../tasks/CopyToRemoteTask';
import { DeployRemoteTask } from '../tasks/DeployRemoteTask';
import { EchoTask } from '../tasks/EchoTask';
import { NgBuildTask } from '../tasks/NgBuildTask';
import { RmTask } from '../tasks/RmTask';
import { RollbackRemoteTask, RollbackRemoteTaskOptions } from '../tasks/RollbackRemoteTask';
import { SymlinkRemoteTask } from '../tasks/SymlinkRemoteTask';
import { UnzipTask } from '../tasks/UnzipTask';
import { ZipTask } from '../tasks/ZipTask';
import { Config } from './Config';
import { Environment } from './Environment';
import { Log } from './Log';
import { SshManager } from './SshManager';

export class Pubsy {
  private taskList = {
    ngBuild: NgBuildTask,
    echo: EchoTask,
    copy: CopyTask,
    rm: RmTask,
    zip: ZipTask,
    copyToRemote: CopyToRemoteTask,
    unzipRemote: UnzipTask,
    deployRemote: DeployRemoteTask,
    rollbackRemote: RollbackRemoteTask,
    symlinkRemote: SymlinkRemoteTask,
  };

  private yamlFile: string;
  private config: Config;
  private environments: Environment[] = [];

  public registerTask(name: string, type) {
    this.taskList[name] = type;
  }

  private logSummary(firstLine: string) {
    Log.success(`\n${firstLine}`);
    Log.success(`  on Environment ${this.environments[0].name}`);
    Log.success(`  using ${this.yamlFile}`);
    Log.debug("Full path: " + resolve(this.yamlFile));
    Log.success("");
  }

  public run() {
    commander
      .version('0.1.0')
      .option('-c --config <name>', 'Name or Path to pubsy config file. Names are matched on pubsy-[name].yml. Defaults to pubsy.yml')
      .option('-e --environment <name>', 'Environment name. If no environments are defined, ignore this option.')
      .option('-v --verbose', 'More output than usual.');

    commander.on('option:verbose', () => {
      if (commander.verbose) Log.verbosity = Log.level.EXTRA_DEBUG;
    });

    commander.command('build')
      .action(() => {
        this.loadConfig();
        this.loadEnvironments();
        this.logSummary('Running build')
        this.runTasks();
      });

    commander.command('run <label>')
      .action((label: string) => {
        this.loadConfig();
        this.loadEnvironments();
        this.logSummary(`Running tasks with label ${label}`);
        this.runTask(label);
      });

    commander.command('rollback [amountOrBuildId]')
      .action((amountOrBuildId: string) => {
        this.loadConfig();
        this.loadEnvironments();
        this.logSummary(`Rolling back deployment`);
        this.rollback(amountOrBuildId);
      });

    // error on unknown commands
    commander.on('command:*', () => {
      Log.warning('Invalid command: %s\nSee --help for a list of available commands.', commander.args.join(' '));
      process.exit(1);
    });

    commander.parse(process.argv);
  }

  private loadConfig() {
    let configFile = commander.config || 'pubsy.yml';

    let notFoundFiles = [];
    //Try matching on path first.
    if (!existsSync(configFile)) {
      notFoundFiles.push(configFile);

      //switch to name
      configFile = `pubsy-${configFile}.yml`;
    }

    if (!existsSync(configFile)) {
      notFoundFiles.push(configFile);
      let names = notFoundFiles.map((f) => resolve(f)).join(', ');
      Log.error("Configuration file not found. Looked for: " + names);
      process.exit(1);
    }

    try {
      this.config = yaml.safeLoad(readFileSync(configFile, 'utf8'));
    } catch (ex) {
      Log.error("Error loading config file: " + configFile);
      Log.error(ex);
      process.exit(1);
    }

    this.yamlFile = configFile;
  }

  private loadEnvironments() {
    //If no environments are defined, we just create a default one and use that
    //If at least 1 env is defined
    //   And we have a -e, we use that one.
    //   And we don't have  a -e, we use the default one.
    //   If there's not default and no -e, we error.
    if (!this.config.environments) {
      this.config.environments = [{ name: 'default', default: true }];
    }

    let defaultEnv: Environment;
    let selectedEnv: Environment;

    for (let e of this.config.environments) {
      e.taskList = [];
      if (e.default && !defaultEnv) defaultEnv = e;
      if (e.name === commander.environment && !selectedEnv) selectedEnv = e;
    }

    if (selectedEnv) {
      this.loadTasks(selectedEnv);
      this.environments.push(selectedEnv);
    } else if (defaultEnv) {
      this.loadTasks(defaultEnv);
      this.environments.push(defaultEnv);
    } else {
      Log.error("No environment chosen. Set a default Environment, or use the --environment flag");
      process.exit(1);
    }
  }

  private loadTasks(e: Environment) {
    //Setup remote
    e.remote = new SshManager(e);

    for (let t of this.config.tasks) {
      if (t.enabled === false) continue;

      if (!this.taskList[t.name]) {
        Log.error("Unknown task " + t.name);
        process.exit(1);
      }
      const task = new this.taskList[t.name](e, t.params);
      task.description = t.description;
      task.label = t.label;
      e.taskList.push(task);
    }
  }

  private async runTasks() {
    const wd = resolve(shelljs.pwd() + "");

    for (let e of this.environments) {

      for (let t of e.taskList) {
        //Reset working directory
        shelljs.cd(wd);

        try {
          Log.info(`### TASK: ${t.description} ###`);
          await t.run();
        } catch (ex) {
          Log.error(`Error while running ${t.name}: ${t.description}`)
          Log.error(t);
          throw ex;
        }

      }
      e.remote.dispose();
    }

    Log.success("Pubsy done!");
  }

  private async runTask(label: string) {
    for (let e of this.environments) {

      for (let t of e.taskList) {
        if (t.label !== label) continue;

        try {
          Log.info(`### TASK: ${t.description} ###`);
          await t.run();
        } catch (ex) {
          Log.error(`Error while running ${t.name}: ${t.description}`)
          Log.error(t);
          throw ex;
        }

      }

      e.remote.dispose();
    }

    Log.success("Pubsy done!");
    process.exit(0);
  }

  private async rollback(amountOrBuildId?) {
    if (!amountOrBuildId) amountOrBuildId = 1;

    let params: RollbackRemoteTaskOptions = {};
    if (isNaN(amountOrBuildId)) {
      params.buildId = amountOrBuildId;
    } else {
      params.amount = amountOrBuildId;
    }

    for (let e of this.environments) {
      const task = new RollbackRemoteTask(e, params);
      try {
        Log.info("Handling environment " + e.name);
        await task.run();
      } catch (error) {
        Log.warning('Rollback failed for environment ' + e.name);
      }

      e.remote.dispose();
    }

  }
}