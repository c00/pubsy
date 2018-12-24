import * as commander from 'commander';
import * as yaml from 'js-yaml';

import { EchoTask } from '../tasks/EchoTask';
import { Task } from './Task';
import { existsSync, readFileSync } from 'fs';
import { NgBuildTask } from '../tasks/NgBuildTask';
import { CopyTask } from '../tasks/CopyTask';

export class Pubsy {
  private taskList = {
    ngBuild: NgBuildTask,
    echo: EchoTask,
    copy: CopyTask,
  };
  private tasks: Task[] = [];
  private config: any;

  constructor() {

  }

  public registerTask(name, type) {
    this.taskList[name] = type;
  }

  public run() {

    commander
      .version('0.1.0')
      .option('-c --config <path>', 'Path to pubsy config file. Defaults to pubsy.yml')
      .command('build')
      .action(() => {
        this.loadConfig();
        this.loadTasks();
        this.runTasks();
      });

    commander.command('hi [message]')
      .action((message) => {
        this.tasks.push(new EchoTask({ message }));
        this.runTasks();
      });

    commander.parse(process.argv);
  }

  private loadConfig() {
    const configFile = commander.config || 'pubsy.yml';
    console.debug("Using configuration file: " + configFile);

    if (!existsSync(configFile)) {
      console.error("Configuration file not found:" + configFile);
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

  private loadTasks() {
    for (let t of this.config.tasks) {
      if (t.enabled === false) continue;

      const task = new this.taskList[t.name](t.params);
      task.description = t.description;
      this.tasks.push(task);
    }
  }

  private async runTasks() {
    for (let t of this.tasks) {
      try {
        console.log(`### TASK: ${t.description} ###`);
        await t.run();
      } catch (ex) {
        console.error(`Error while running ${t.name}: ${t.description}`)
        console.dir(t);
        throw ex;
      }
      
    }
    console.log("Tasks complete");
  }
}