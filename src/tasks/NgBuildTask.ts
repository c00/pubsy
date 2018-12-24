import { Task } from '../model/Task';
import { execSync, exec } from 'child_process';

export class NgBuildTask implements Task {
  name = 'ngBuild';
  static defaultParams = {
    base: '/',
    output: './dist/'
  };

  constructor(public params?: any) {
    if (!this.params) this.params = {};
    this.params = { ...this.params, ...params };
  }

  public run() {
    console.log("Building Angular App...");

    return new Promise((resolve, reject) => {
      exec(`ng build --output-path "${this.params.output}" --base-href ${this.params.base} --prod`, (err) => {
        if (err) reject(err);

        resolve();
      });
    });
  }
}