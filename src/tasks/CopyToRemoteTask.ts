import { dirname } from 'path';
import * as shelljs from 'shelljs';

import { FileInfo } from '../model/FileInfo';
import { Helper } from '../model/Helper';
import { Log } from '../model/Log';
import { Task } from '../model/Task';


export class CopyToRemoteTask extends Task {
  name = 'copyToRemote';

  protected defaultParams: Partial<CopyToRemoteTaskParams> = { dest: '' }
  private _files: FileInfo[] = [];
  public params: CopyToRemoteTaskParams;

  protected setDefaults() {
    super.setDefaults();

    //Prepend the buildPath
    if (this.environment.deployPath) this.params.dest = this.environment.deployPath + this.params.dest;
  }

  private checkParams(): null | string {
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

  public async run(): Promise<any> {
    this.setDefaults();

    Log.debug("  Destination: " + this.params.dest);
    const result = this.checkParams();

    if (result) throw result;

    //Change working directory
    if (this.params.cwd) shelljs.cd(this.params.cwd);

    //Glob the source files.
    this._files = await Helper.glob(this.params.source, this.params.exclude);

    await this.copy();
  }

  private async copy() {
    for (let f of this._files) {
      //Get destination directory
      const dest = this.getDest(f.relative, this.params.dest);

      //Make dir if necessary
      const destPath = dirname(dest);
      await this.environment.remote.mkdir(destPath);

      //Copy files
      await this.environment.remote.putFile(f.relative, dest);
    }
    Log.info("  " + this._files.length + " files copied.");
  }

  private getDest(source: string, destPath: string) {
    if (destPath.substring(destPath.length - 1) !== '/') destPath += '/';

    return destPath + source;
  }
}

export interface CopyToRemoteTaskParams {
  source: string | string[];
  exclude?: string | string[];
  dest?: string;
  cwd?: string;
}