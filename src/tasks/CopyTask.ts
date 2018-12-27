import { copyFileSync, existsSync, lstatSync } from 'fs';
import * as glob from 'glob';
import { basename, dirname, resolve } from 'path';
import * as shelljs from 'shelljs';

import { Task } from '../model/Task';


export class CopyTask extends Task {
  name = 'copy';

  protected defaultParams: Partial<CopyTaskParams> = { dest: '' }
  private _files: FileInfo[] = [];
  public params: CopyTaskParams;
  private originalWorkingDir: string;

  private checkParams(): null | string {
    if (!this.params.source || !this.params.dest) {
      return "I need a source and dest for this task (CopyTask)";
    }

    const illegalStart = ['.', '/'];
    const sources = (typeof this.params.source === 'string') ? [this.params.source] : this.params.source;
    for (let s of sources) {
      if (illegalStart.indexOf(s.substring(0, 1)) > -1) {
        /* We need relative paths to be able to work out what the destination file structure should be. */
        return "Sources cannot start with '/', './' or '../'. Use cwd to change the working directory.";
      }
    }

    return null;
  }

  protected setDefaults() {
    super.setDefaults();
    this.originalWorkingDir = shelljs.pwd();
  }

  public async run() {
    this.setDefaults();

    //Prepend the buildPath
    if (this.environment.buildPath) this.params.dest = this.environment.buildPath + this.params.dest;

    //Check Parameters
    const result = this.checkParams();
    if (result) throw result;

    //Change working directory for source files
    if (this.params.cwdSource) shelljs.cd(this.params.cwdSource);

    //Glob the source files.
    const files = await this.getPaths(this.params.source);
    const excluded = await this.getPaths(this.params.exclude);

    this._files = files
      .filter(f => excluded.indexOf(f) === -1)
      .map(f => {
        return {
          relative: f,
          resolved: resolve(f),
          basename: basename(f)
        }
      });

    //Change working directory for Destination
    shelljs.cd(this.originalWorkingDir);

    //Copy
    this.copy();

  }

  private copy() {
    for (let f of this._files) {
      //Calculate destination directory
      const dest = this.getDest(f.relative, this.params.dest);

      //Make dir if necessary
      const wd = shelljs.pwd() + "/";
      const destPath = dirname(dest);
      if (!existsSync(destPath)) shelljs.mkdir('-p', wd + destPath);

      //Copy files
      if (lstatSync(f.resolved).isFile()) copyFileSync(f.resolved, dest);

      //console.debug(`Copy: ${f.resolved} --> ${dest}`);
      
    }

    console.log(this._files.length + " files copied.");
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

  private getDest(source: string, destPath: string) {

    if (destPath.substring(destPath.length - 1) !== '/') destPath += '/';

    if (this.params.flatten) return destPath + basename(source);

    return destPath + source;
  }
}

export interface CopyTaskParams {
  source: string | string[];
  exclude?: string | string[];
  dest: string;
  flatten?: boolean;
  cwdSource?: string;
}

export interface FileInfo {
  relative: string;
  resolved: string;
  basename: string;
}