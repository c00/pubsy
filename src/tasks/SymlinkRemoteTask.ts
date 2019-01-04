import { Task } from '../model/Task';
import { Helper } from '../model/Helper';



export class SymlinkRemoteTask extends Task {
  name = 'symlinkRemote';

  protected defaultParams: SymlinkRemoteTaskParams = { source: '', dest: '' };
  public params: SymlinkRemoteTaskParams;

  public async run() {
    this.setDefaults();
    this.replaceEnvironmentVariables();
    const result = this.checkParams();
    if (result) throw result;

    return this.environment.remote.symlink(this.params.source, this.params.dest, this.params.cwd);
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

export interface SymlinkRemoteTaskParams {
  source: string;
  dest: string;
  cwd?: string;
}