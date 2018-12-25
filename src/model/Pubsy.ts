import * as commander from 'commander';
import { existsSync, readFileSync } from 'fs';
import * as yaml from 'js-yaml';

import { CopyTask } from '../tasks/CopyTask';
import { EchoTask } from '../tasks/EchoTask';
import { NgBuildTask } from '../tasks/NgBuildTask';
import { Environment } from './Environment';
import { Config } from './Config';
import { resolve } from 'path';

export class Pubsy {
  private taskList = {
    ngBuild: NgBuildTask,
    echo: EchoTask,
    copy: CopyTask,
  };

  private config: Config;
  private environments: Environment[] = [];

  public registerTask(name: string, type) {
    this.taskList[name] = type;
  }

  public run() {
    commander
      .version('0.1.0')
      .option('-c --config <path>', 'Path to pubsy config file. Defaults to pubsy.yml')
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

    commander.parse(process.argv);
  }

  private loadConfig() {
    const configFile = commander.config || 'pubsy.yml';
    console.debug("Using configuration file: " + configFile);

    if (!existsSync(configFile)) {
      console.error("Configuration file not found: " + resolve(configFile));
      process.exit(1);
    }

    try {
      this.config = yaml.safeLoad(readFileSync(configFile, 'utf8'));
    } catch (ex) {
      console.error("Error loading config file: " + configFile);
      console.error(ex);
      process.exit(1);
    }
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
    for (let t of this.config.tasks) {
      if (t.enabled === false) continue;

      const task = new this.taskList[t.name](e, t.params);
      task.description = t.description;
      task.label = t.label;
      e.taskList.push(task);
    }
  }

  private async runTasks() {
    for (let e of this.environments) {
      console.log("Running task set on environment: " + e.name);

      for (let t of e.taskList) {
        try {
          console.log(`### TASK: ${t.description} ###`);
          await t.run();
        } catch (ex) {
          console.error(`Error while running ${t.name}: ${t.description}`)
          console.dir(t);
          throw ex;
        }

      }
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
    }

    console.log("Pubsy done!");
  }
}