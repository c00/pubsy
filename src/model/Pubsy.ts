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
import { UnzipTask } from '../tasks/UnzipTask';
import { ZipTask } from '../tasks/ZipTask';
import { Config } from './Config';
import { Environment } from './Environment';
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
  };

  private config: Config;
  private environments: Environment[] = [];

  public registerTask(name: string, type) {
    this.taskList[name] = type;
  }

  public run() {
    commander
      .version('0.1.0')
      .option('-c --config <name>', 'Name or Path to pubsy config file. Names are matched on pubsy-[name].yml. Defaults to pubsy.yml')
      .option('-e --environment <name>', 'Environment name. If no environments are defined, ignore this option.')
      .command('build')
      .action(() => {
        this.loadConfig();
        this.loadEnvironments();
        this.runTasks();
      });

    commander.command('run <label>')
      .action((label: string) => {
        this.loadConfig();
        this.loadEnvironments();
        this.runTask(label);
      });

    commander.command('rollback [amountOrBuildId]')
      .action((amountOrBuildId: string) => {
        this.loadConfig();
        this.loadEnvironments();
        this.rollback(amountOrBuildId)        
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
      console.error("Configuration file not found. Looked for: " + names);
      process.exit(1);
    }

    try {
      this.config = yaml.safeLoad(readFileSync(configFile, 'utf8'));
    } catch (ex) {
      console.error("Error loading config file: " + configFile);
      console.error(ex);
      process.exit(1);
    }

    console.debug("Using configuration file: " + configFile);
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
      console.error("No environment chosen. Set a default Environment, or use the --environment flag");
      process.exit(1);
    }
  }

  private loadTasks(e: Environment) {
    //Setup remote
    e.remote = new SshManager(e);

    for (let t of this.config.tasks) {
      if (t.enabled === false) continue;

      if (!this.taskList[t.name]) {
        console.error("Unknown task " + t.name);
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
      console.log("Running task set on environment: " + e.name);

      for (let t of e.taskList) {
        //Reset working directory
        shelljs.cd(wd);

        try {
          console.log(`### TASK: ${t.description} ###`);
          await t.run();
        } catch (ex) {
          console.error(`Error while running ${t.name}: ${t.description}`)
          console.dir(t);
          throw ex;
        }

      }
      e.remote.dispose();
    }

    console.log("Pubsy done!");
  }

  private async runTask(label: string) {
    for (let e of this.environments) {
      console.log(`Running tasks with label '${label}' on environment: ${e.name}`);

      for (let t of e.taskList) {
        if (t.label !== label) continue;

        try {
          console.log(`### TASK: ${t.description} ###`);
          await t.run();
        } catch (ex) {
          console.error(`Error while running ${t.name}: ${t.description}`)
          console.dir(t);
          throw ex;
        }

      }

      e.remote.dispose();
    }

    console.log("Pubsy done!");
    process.exit(0);
  }

  private async rollback(amountOrBuildId?) {
    if (!amountOrBuildId) amountOrBuildId = 1;

    let params: RollbackRemoteTaskOptions = {};
    if (isNaN(amountOrBuildId) ){
      params.buildId = amountOrBuildId;
    } else {
      params.amount = amountOrBuildId;
    }

    for (let e of this.environments) {
      const task = new RollbackRemoteTask(e, params);
      try {
        console.log("Handling environment " + e.name);
        await task.run();
      } catch (error) {
        console.warn('Rollback failed for environment ' + e.name);
      }
    
      e.remote.dispose();
    }
    
  }
}