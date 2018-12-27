import { exec } from 'child_process';

import { Task } from '../model/Task';
import { Helper } from '../model/Helper';

export class NgBuildTask extends Task {
  name = 'ngBuild';
  protected defaultParams: NgBuildTaskOptions = {
    base: '/',
    output: ''
  };
  params: NgBuildTaskOptions;

  public run() {
    this.setDefaults();
    
    return new Promise((resolve, reject) => {
      //Prepend the buildPath
      if (this.environment.buildPath) this.params.output = this.environment.buildPath + this.params.output;
      
      exec(`ng build --output-path "${this.params.output}" --base-href ${this.params.base} --prod`, (err) => {
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