import * as glob from 'glob';
import * as JSZip from 'jszip';
import * as shelljs from 'shelljs';

import { Task } from '../model/Task';
import { createWriteStream, readFileSync, lstatSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';



export class ZipTask extends Task {
  name = 'zip';

  protected defaultParams: Partial<ZipTaskParams> = { dest: 'files.zip', createDestFolder: true }
  private _files: string[] = [];
  private _resolve;
  public params: ZipTaskParams;

  private checkParams(): null | string {
    if (!this.params.source || !this.params.dest) {
      return "I need a source and dest for this task (ZipTask)";
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

  protected setDefaults() {
    super.setDefaults();
    //Default to buildpath
    if (!this.params.cwd && this.environment.buildPath) this.params.cwd = this.environment.buildPath;
  }

  public run(): Promise<any> {
    this.setDefaults();

    return new Promise((res, reject) => {
      this._resolve = res;

      //Prepend the buildPath
      if (this.environment.buildPath) this.params.dest = resolve(this.environment.buildPath + this.params.dest);

      const result = this.checkParams();

      if (result) reject(result);

      this.runAsync();
    });
  }

  private async runAsync() {
    //Change working directory
    if (this.params.cwd) shelljs.cd(this.params.cwd);

    const files = await this.getPaths(this.params.source);
    const excluded = await this.getPaths(this.params.exclude);

    this._files = files.filter(f => excluded.indexOf(f) === -1);

    this.zip();
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

  private zip() {
    let zip = new JSZip();

    for (let f of this._files) {
      if (lstatSync(f).isFile()) zip.file(f, readFileSync(f));
    }

    //Create folder if we need to.
    if (this.params.createDestFolder) {
      const dir = dirname(this.params.dest);
      if (!existsSync(dir)) shelljs.mkdir('-p', dir);
    }

    //Write out the zip file.
    zip
    .generateNodeStream({ compression: 'DEFLATE', type: 'nodebuffer', streamFiles: true })
    .pipe(createWriteStream(this.params.dest))
    .on('finish', () => {
      console.log(`${this.params.dest} created.`);
      this._resolve();
    });
  }
}

export interface ZipTaskParams {
  source: string | string[];
  exclude?: string | string[];
  createDestFolder?: boolean;
  dest: string;
  cwd?: string;
}