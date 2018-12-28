import * as glob from 'glob';
import * as JSZip from 'jszip';
import * as shelljs from 'shelljs';

import { Task } from '../model/Task';
import { createWriteStream, readFileSync, lstatSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { Helper } from '../model/Helper';
import { FileInfo } from '../model/FileInfo';



export class ZipTask extends Task {
  name = 'zip';

  protected defaultParams: Partial<ZipTaskParams> = { dest: 'files.zip', createDestFolder: true }
  private _files: FileInfo[] = [];
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

    //Check end of destination to be.zip
    if (this.params.dest.substring(this.params.dest.length - 4) !== '.zip') return "Destination must end in '.zip'";

    //Check if the folder exists
    if (!this.params.createDestFolder && !existsSync(dirname(this.params.dest))) return "Zip destination folder doesn't exist.";

    return null;
  }

  protected setDefaults() {
    super.setDefaults();
    //Default to buildpath
    if (!this.params.cwd && this.environment.buildPath) this.params.cwd = this.environment.buildPath;
  }

  public async run() {
    this.setDefaults();

    //Prepend the buildPath
    if (this.environment.buildPath) this.params.dest = resolve(this.environment.buildPath + this.params.dest);

    const result = this.checkParams();
    if (result) throw result;

    //Change working directory
    const current = shelljs.pwd() + "";
    if (this.params.cwd) shelljs.cd(this.params.cwd);
    this._files = await Helper.glob(this.params.source, this.params.exclude);
    if (this.params.cwd) shelljs.cd(current);

    await this.zip();
  }

  private zip() {
    let zip = new JSZip();

    for (let f of this._files) {
      if (lstatSync(f.resolved).isFile()) zip.file(f.relative, readFileSync(f.resolved));
    }

    //Create folder if we need to.
    if (this.params.createDestFolder) {
      const dir = dirname(this.params.dest);
      if (!existsSync(dir)) shelljs.mkdir('-p', dir);
    }

    return new Promise((resolve, reject) => {
      //Write out the zip file.
      zip
        .generateNodeStream({ compression: 'DEFLATE', type: 'nodebuffer', streamFiles: true })
        .pipe(createWriteStream(this.params.dest))
        .on('finish', () => {
          console.log(`${this.params.dest} created.`);
          resolve();
        });
    });
  }
}

export interface ZipTaskParams {
  source: string | string[];
  exclude?: string | string[];
  createDestFolder?: boolean;
  dest?: string;
  cwd?: string;
}