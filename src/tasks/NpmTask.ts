import { execSync } from 'child_process';
import * as shelljs from 'shelljs';

import { Task } from '../model/Task';

export class NpmTask extends Task {
  name = 'npm';

  protected defaultParams: Partial<NpmTaskParams> = { params: ['install'] }
  public params: NpmTaskParams;

  private checkParams(): null | string {
    return null;
  }

  protected setDefaults() {
    super.setDefaults();
    //Default to buildpath
    if (!this.params.cwd && this.environment.buildPath) this.params.cwd = this.environment.buildPath;

    if (typeof this.params.params === 'string') this.params.params = [this.params.params];
  }

  public async run() {
    this.setDefaults();

    const result = this.checkParams();
    if (result) throw result;

    //Change working directory
    const current = shelljs.pwd() + "";
    if (this.params.cwd) shelljs.cd(this.params.cwd);
    
    //Do npm task
    let cmd = 'npm';
    if (this.params.params) {
      cmd += ` ${this.params.params.join(' ')}`
    }
    execSync(cmd, { stdio: 'inherit' });

    if (this.params.cwd) shelljs.cd(current);
  }

}

export interface NpmTaskParams {
  params?: string[];
  cwd?: string;
}