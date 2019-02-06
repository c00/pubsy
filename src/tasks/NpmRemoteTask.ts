import { Helper } from '../model/Helper';
import { Task } from '../model/Task';
import { Log } from '../model/Log';

export class NpmRemoteTask extends Task {
  name = 'npmRemote';

  protected defaultParams: NpmRemoteTaskParams = { bin: 'npm', params: ['install', '--production'] };
  public params: NpmRemoteTaskParams;

  protected setDefaults() {
    super.setDefaults();
    //Prepend the deployPath (and buildId) if no cwd is set.
    if (this.environment.deployPath && !this.params.cwd) {
      let path = this.environment.deployPath;
      if (this.environment.buildId) path = Helper.joinPaths(path, this.environment.buildId);
      this.params.cwd = path;
    }

    if (typeof this.params.params === 'string') this.params.params = [this.params.params];
  }

  private checkParams(): null | string {
    if (!this.params.params) return "No npm parameters."

    return null;
  }

  public async run(): Promise<any> {
    this.setDefaults();

    const result = this.checkParams();
    if (result) throw result;

    //Do the command
    const output = await this.environment.remote.exec(this.params.bin, this.params.params, { cwd: this.params.cwd, options: { pty: true } });
    Log.info(output);
  }

}

export interface NpmRemoteTaskParams {
  params?: string[];
  cwd?: string;
  bin?: string;
}