import * as moment from 'moment';
import * as shelljs from 'shelljs';

import { Log } from '../model/Log';
import { Task } from '../model/Task';
import { CopyToRemoteTask } from './CopyToRemoteTask';
import { SymlinkRemoteTask } from './SymlinkRemoteTask';
import { UnzipRemoteTask } from './UnzipTask';
import { ZipTask } from './ZipTask';
import { RmTask } from './RmTask';

export class DeployRemoteTask extends Task {
  name = 'deployRemote';
  protected defaultParams: DeployRemoteTaskOptions = {
    source: 'files.zip'
  };

  params: DeployRemoteTaskOptions;

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
    const zipName = 'build.zip';
    tasks.push(new ZipTask(this.environment, { ...this.params, dest: zipName }, "Compressing..."));
    tasks.push(new CopyToRemoteTask(this.environment, { source: zipName, cwdSource: this.environment.buildPath }, "Copying to remote..."));
    tasks.push(new UnzipRemoteTask(this.environment, { source: zipName, dest: buildId, removeAfter: true }, "Extracting..."));
    tasks.push(new SymlinkRemoteTask(this.environment, { source: buildId, dest: this.environment.deployPath + 'current' }, "Linking new build..."));
    tasks.push(new RmTask(this.environment, { targets: zipName }, "Removing local zip file..."));

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
    const result = await this.environment.remote.exec('ls', [this.environment.deployPath]);
    const list = result.split('\n').filter(s => s.startsWith('build-')).sort();

    if (list.length > amount) {
      Log.debug("Removing old deployments");
      const toRemove = list.length - amount;
      const folders = list.slice(0, toRemove);

      for (let f of folders) {
        Log.debug("Removing " + f);
        await this.environment.remote.exec('rm', ['-rf', this.environment.deployPath + f])
      }
    }
  }

}

export interface DeployRemoteTaskOptions {
  source: string | string[];
  exclude?: string | string[];
  cwd?: string;
}