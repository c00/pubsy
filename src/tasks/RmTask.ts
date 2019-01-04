import * as shelljs from 'shelljs';

import { Task } from '../model/Task';

export class RmTask extends Task {
  name = 'rm';

  protected defaultParams: Partial<RmTaskParams> = { useBuildPath: true }

  public params: RmTaskParams;

  private checkParams(): null | string {
    if (!this.params.targets) {
      return "I need a target for this task (RmTask)";
    }

    const illegalStart = ['.', '/'];
    const sources = (typeof this.params.targets === 'string') ? [this.params.targets] : this.params.targets;
    for (let s of sources) {
      if (illegalStart.indexOf(s.substring(0, 1)) > -1) {
        return "Targets cannot start with '/', './' or '../'. You can only delete stuff within the working directory.";
      }
    }

    if (this.params.useBuildPath && !this.environment.buildPath) {
      return "No build path is configured. Either configure a buildPath in the environment, or set 'useBuildPath' to false for this task.";
    }

    return null;
  }

  public async run() {
    this.setDefaults();

    const result = this.checkParams();
    if (result) throw result;

    if (typeof this.params.targets === 'string') this.params.targets = [this.params.targets];
    
    for (let t of this.params.targets) {
      if (this.params.useBuildPath && this.environment.buildPath) t = this.environment.buildPath + t;
      shelljs.rm('-rf', t);
    }

  }
}

export interface RmTaskParams {
  targets: string | string[];
  useBuildPath?: boolean;
}