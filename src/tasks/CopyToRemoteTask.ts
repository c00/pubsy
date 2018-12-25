import * as glob from 'glob';
import { dirname } from 'path';
import * as shelljs from 'shelljs';

import { Task } from '../model/Task';


export class CopyToRemoteTask extends Task {
  name = 'copyToRemote';

  protected defaultParams: Partial<CopyTaskParams> = { dest: '' }
  private _files: string[] = [];
  private _resolve;
  public params: CopyTaskParams;

  private checkParams(): null|string {
    if (!this.params.source || !this.params.dest) {
      return "I need a source and dest for this task (CopyToRemoteTask)";
    }

    //Check home folder
    if (this.params.dest.substring(0, 1) === '~') {
      return "Can't use ~ on remote destination";
    }

    const illegalStart = ['.', '/'];
    const sources = (typeof this.params.source === 'string') ? [this.params.source] : this.params.source;
    for (let s of sources) {
      if (illegalStart.indexOf(s.substring(0, 1)) > -1) {
        return "Sources cannot start with '/', './' or '../'. Use cwd to change the working directory.";
      }
    }

    return null;
  }

  public run(): Promise<any> {
    this.setDefaults();    

    return new Promise((resolve, reject) => {
      this._resolve = resolve;

      //Prepend the buildPath
      if (this.environment.deployPath) this.params.dest = this.environment.deployPath + this.params.dest;

      const result = this.checkParams();      

      if (result) return reject(result);

      this.runAsync();
    });
  }

  private async runAsync() {
    //Change working directory
    if (this.params.cwd) shelljs.cd(this.params.cwd);

    const files = await this.getPaths(this.params.source);
    const excluded = await this.getPaths(this.params.exclude);

    this._files = files.filter(f => excluded.indexOf(f) === -1);

    this.copy();
  }

  private async getPaths(pattern: string | string[]) {
    if (!pattern) return [];
    if (typeof pattern === 'string') pattern = [pattern];

    let files = [];
    for (let s of pattern) {
      const batch = await this.globPath(s);
      files.push.apply(files, batch);
    }

    return files;
  }

  private globPath(input: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      glob(input, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  private async copy() {
    for (let f of this._files) {
      //Get destination directory
      const dest = this.getDest(f, this.params.dest);

      //Make dir if necessary
      const destPath = dirname(dest);
      await this.environment.remote.mkdir(destPath);
      
      //Copy files
      await this.environment.remote.putFile(f, dest);      
    }
    console.log(this._files.length + " files copied.");
    this._resolve();
  }

  private getDest(source: string, destPath: string) {
    
    if (destPath.substring(destPath.length - 1) !== '/') destPath += '/';

    return destPath + source;
  }
}

export interface CopyTaskParams {
  source: string | string[];
  exclude?: string | string[];
  dest: string;
  cwd?: string;
}