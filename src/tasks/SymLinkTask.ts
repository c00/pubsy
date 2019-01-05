import * as fs from 'fs';
import * as shelljs from 'shelljs';

import { Helper } from '../model/Helper';
import { Task } from '../model/Task';


export class SymlinkTask extends Task {
  name = 'symlink';

  protected defaultParams: SymlinkTaskParams = { source: '', dest: '' };
  public params: SymlinkTaskParams;

  public async run() {
    this.setDefaults();
    this.replaceEnvironmentVariables();
    const result = this.checkParams();
    if (result) throw result;

    const currentWd = shelljs.pwd();
    if (this.params.cwd) shelljs.cd(this.params.cwd);
    if (fs.existsSync(this.params.dest)) shelljs.rm(this.params.dest);
    fs.symlinkSync(this.params.source, this.params.dest)
    if (this.params.cwd) shelljs.cd(currentWd);
  }

  protected setDefaults() {
    super.setDefaults();
    this.params.dest = Helper.trimTrailingSlash(this.params.dest);
    this.params.source = Helper.trimTrailingSlash(this.params.source);
  }

  private replaceEnvironmentVariables() {

    for (let k in this.environment) {
      if (!this.environment.hasOwnProperty(k)) continue;
      if (typeof this.environment[k] !== 'string') continue;

      const placeholder = `%${k}%`;
      this.params.dest = Helper.replaceAll(this.params.dest, placeholder, this.environment[k]);
      this.params.source = Helper.replaceAll(this.params.source, placeholder, this.environment[k]);
    }
    
  }

  private checkParams() {
    if (!this.params.source) {
      return "Source cannot be empty.";
    }
    if (!this.params.dest) {
      return "Destination cannot be empty.";
    }
  }

}

export interface SymlinkTaskParams {
  source: string;
  dest: string;
  cwd?: string;
}