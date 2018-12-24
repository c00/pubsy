import { copyFileSync, existsSync, mkdirSync } from 'fs';
import * as glob from 'glob';
import * as shelljs from 'shelljs';
import { basename, dirname } from 'path';

import { Task } from '../model/Task';


export class CopyTask implements Task {
  name = 'ngBuild';

  private defaultParams: Partial<CopyTaskParams> = { preservePath: true }
  private _files: string[] = [];
  private _resolve;
  private _reject;

  constructor(public params: CopyTaskParams) {
    this.checkParams();
    
    this.params = { ...this.defaultParams, ...this.params };
  }

  private checkParams() {
    if (!this.params.source || !this.params.dest) {
      throw "I need a source and dest for this task (CopyTask)";
    }

    const illegalStart = ['.', '/'];
    const sources = (typeof this.params.source === 'string') ? [this.params.source] : this.params.source;
    for (let s of sources) {
      if (illegalStart.indexOf(s.substring(0, 1)) > -1) {
        throw "Sources cannot start with '/', './' or '../'. Use cwd to change the working directory.";
      }
    }
  }

  public run(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;

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
    this._resolve();
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

  private copy() {
    for (let f of this._files) {
      //Calculate destination directory
      const dest = this.getDest(f, this.params.dest);

      //Make dir if necessary
      const wd = shelljs.pwd() + "/";
      const destPath = dirname(dest);
      if (!existsSync(destPath)) shelljs.mkdir('-p', wd + destPath);

      //Copy files
      copyFileSync(f, dest);
      
    }
    console.log(this._files.length + " files copied.");
  }

  private getDest(source: string, destPath: string) {
    if (destPath.substring(destPath.length - 1) !== '/') destPath += '/';

    if (!this.params.preservePath) return destPath + basename(source);

    return destPath + source;
  }
}

export interface CopyTaskParams {
  source: string | string[];
  exclude?: string | string[];
  dest: string;
  preservePath?: boolean;
  cwd?: string;
}