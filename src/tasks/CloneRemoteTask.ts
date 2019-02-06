import { Task } from '../model/Task';
import { Helper } from '../model/Helper';
import * as path from 'path';

export class CloneRemoteTask extends Task {
  name = 'cloneRemote';

  protected defaultParams: Partial<CloneRemoteTaskParams> = { dest: '' };
  public params: CloneRemoteTaskParams;

  protected setDefaults() {
    super.setDefaults();
    this.params.dest = path.join(this.environment.deployPath, this.params.dest);
  }

  public async run() {
    this.setDefaults();
    Helper.replaceEnvironmentVariables(this.params.dest, this.environment);
    const result = this.checkParams();
    if (result) throw result;

    const exists = await this.environment.remote.exists(this.params.dest);
    if (!exists) await this.environment.remote.mkdir(this.params.dest);

    return this.environment.remote.clone(this.params.repo, this.params.dest);
  }

  private checkParams() {
    if (!this.params.repo) {
      return "Repo cannot be empty.";
    }
    if (!this.params.dest) {
      return "Destination cannot be empty.";
    }
  }

}

export interface CloneRemoteTaskParams {
  repo: string;
  dest?: string;
}