import * as moment from 'moment';
import * as shelljs from 'shelljs';

import { Log } from '../model/Log';
import { Task } from '../model/Task';
import { CopyTask } from './CopyTask';
import { SymlinkTask } from './SymLinkTask';

export class DeployLocalTask extends Task {
  name = 'deployLocal';
  protected defaultParams: DeployLocalTaskParams = {
    source: '**/*'
  };

  params: DeployLocalTaskParams;

  public async run() {
    this.setDefaults();

    //Set the buildId if necessary.
    if (!this.environment.buildId) {
      this.environment.buildId = `build-${moment().format('YYYY-MM-DD')}-${+ moment()}`;
    }

    const buildId = this.environment.buildId;

    if (!this.params.source) throw "No source files.";

    const wd = shelljs.pwd();
    let tasks: Task[] = [];

    //Setup tasks
    tasks.push(new CopyTask(this.environment, { ...this.params, dest: this.environment.deployPath + buildId, prependBuildPathToDest: false }, "Copying..."));
    tasks.push(new SymlinkTask(this.environment, { source: buildId, dest: this.environment.deployPath + 'current' }, "Linking new build..."));
    
    for (let t of tasks) {
      Log.info("  " + t.description);
      shelljs.cd(wd);
      await t.run();
    }

    Log.info("  Cleaning up old deployments...");
    await this.cleanOldDeployments();

    Log.success(`  Deployed successfully! Id: ${buildId}!`);
  }

  private async cleanOldDeployments() {
    const amount = this.environment.keepDeployments || 10;

    //find out how many there are
    const result = shelljs.ls('ls', [this.environment.deployPath]);
    const list = result.filter(s => s.startsWith('build-')).sort();

    if (list.length > amount) {
      Log.debug("Removing old deployments");
      const toRemove = list.length - amount;
      const folders = list.slice(0, toRemove);

      for (let f of folders) {
        Log.debug("Removing " + f);
        await shelljs.rm('-rf', this.environment.deployPath + f)
      }
    }
  }

}

export interface DeployLocalTaskParams {
  source: string | string[];
  exclude?: string | string[];
  cwdSource?: string;
}