import { exec } from 'child_process';

import { Task } from '../model/Task';
import { Helper } from '../model/Helper';

export class NgBuildTask extends Task {
  name = 'ngBuild';
  protected defaultParams: NgBuildTaskOptions = {
    base: '/',
    output: '%outputBase%dist/'
  };
  params: NgBuildTaskOptions;

  public run() {
    return new Promise((resolve, reject) => {
      //Replace outputBase if it exists
      const output = Helper.replaceAll(this.params.output, '%outputBase%', this.environment.outputBase)
      
      exec(`ng build --output-path "${output}" --base-href ${this.params.base} --prod`, (err) => {
        if (err) reject(err);

        resolve();
      });
    });
  }
}

export interface NgBuildTaskOptions {
  base: string;
  output: string;
}