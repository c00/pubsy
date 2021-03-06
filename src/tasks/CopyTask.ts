import { copyFileSync, existsSync, lstatSync } from 'fs';
import { basename, dirname } from 'path';
import * as shelljs from 'shelljs';

import { FileInfo } from '../model/FileInfo';
import { Helper } from '../model/Helper';
import { Log } from '../model/Log';
import { Task } from '../model/Task';


export class CopyTask extends Task {
  name = 'copy';

  protected defaultParams: Partial<CopyTaskParams> = { dest: '', prependBuildPathToDest: true }
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

    //Prepend the buildPath
    if (this.environment.buildPath && this.params.prependBuildPathToDest) this.params.dest = this.environment.buildPath + this.params.dest;
  }

  public async run() {
    this.setDefaults();

    //Check Parameters
    const result = this.checkParams();
    if (result) throw result;

    //Change working directory for source files
    if (this.params.cwdSource) shelljs.cd(this.params.cwdSource);

    //Glob the source files.
    this._files = await Helper.glob(this.params.source, this.params.exclude);

    Log.debug("Params: ", this.params);

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
      if (!existsSync(destPath)) shelljs.mkdir('-p', destPath);

      //Copy files
      if (lstatSync(f.resolved).isFile()) copyFileSync(f.resolved, dest);

      Log.extraDebug(`  Copy: ${f.resolved} --> ${dest}`); 
    }

    Log.info("  " + this._files.length + " files copied.");
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
  prependBuildPathToDest?: boolean;
}