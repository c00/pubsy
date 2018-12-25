import { copyFileSync, existsSync, lstatSync } from 'fs';
import * as glob from 'glob';
import { basename, dirname } from 'path';
import * as shelljs from 'shelljs';

import { Task } from '../model/Task';


export class RmTask extends Task {
  name = 'rm';

  public params: RmTaskParams;

  private checkParams(): null|string {
    if (!this.params.targets) {
      return "I need a target for this task (RmTask)";
    }

    const illegalStart = ['.', '/'];
    const sources = (typeof this.params.targets === 'string') ? [this.params.targets] : this.params.targets;
    for (let s of sources) {
      if (illegalStart.indexOf(s.substring(0, 1)) > -1) {
        return "Targets cannot start with '/', './' or '../'. You can only delete stuff within the working directory.";
      }
    }

    return null;
  }

  public run(): Promise<any> {
    this.setDefaults();    

    return new Promise((resolve, reject) => {

      const result = this.checkParams();      

      if (result) reject(result);

      try{
        shelljs.rm('-rf', this.params.targets)
      } catch (e) {
        reject(e);
      }
      
      resolve();
    });
  }
}

export interface RmTaskParams {
  targets: string|string[];
}