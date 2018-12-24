import { NgBuildTask } from '../tasks/NgBuildTask';
import { EchoTask } from '../tasks/EchoTask';
import { Task } from './Task';
export class Pubsy {

  private tasks: Task[] = [];

  constructor() {

  }

  public run() {
    const program = require('commander');

    program
      .version('0.1.0')
      .command('build')
      .action(() => {
        console.log("Building...");
        this.tasks.push(new NgBuildTask({ base: '/log-viewer/' }));
        
      });

    program.command('hi [message]')
      .action((message) => {
        this.tasks.push(new EchoTask({ message }));
        this.runTasks();
      });

    program.parse(process.argv);
  }

  private async runTasks() {
    for (let t of this.tasks) {
      await t.run();
    }
    console.log("Tasks complete");

  }
}