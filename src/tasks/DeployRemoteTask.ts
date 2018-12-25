import { existsSync } from 'fs';
import * as moment from 'moment';
import { basename } from 'path';

import { Task } from '../model/Task';
import { CopyToRemoteTask } from './CopyToRemoteTask';
import { UnzipTask } from './UnzipTask';

export class DeployRemoteTask extends Task {
  name = 'deployRemote';
  protected defaultParams: DeployRemoteTaskOptions = {
    source: 'files.zip'
  };

  params: DeployRemoteTaskOptions;

  public async run() {
    this.setDefaults();

    const buildId = `build-${moment().format('YYYY-MM-DD')}-${+ moment()}`;

    if (!this.params.source) throw "No source zip file.";

    const source = this.environment.buildPath + this.params.source;
    if (!existsSync(source)) throw `File '${source}' doesn't exist`;
    
    const copy = new CopyToRemoteTask(this.environment, { source: this.params.source, cwd: this.environment.buildPath });
    const unzip = new UnzipTask(this.environment, {source: basename(this.params.source), dest: buildId, removeAfter: true });

    await copy.run();
    await unzip.run();
    await this.environment.remote.symlink(buildId, this.environment.deployPath + 'current');

    //Cleanup old environments
    await this.cleanOldDeployments();

    console.log(`Deployed ${buildId}!`);
  }

  private async cleanOldDeployments() {
    const amount = this.environment.keepDeployments || 10;

    //find out how many there are
    const result = await this.environment.remote.exec('ls', [this.environment.deployPath]);
    const list = result.split('\n').filter(s => s.startsWith('build-')).sort();

    if (list.length > amount) {
      console.debug("Removing old deployments");
      const toRemove = list.length - amount;
      const folders = list.slice(0, toRemove);

      for (let f of folders) {
        console.debug("Removing " + f);
        await this.environment.remote.exec('rm', ['-rf', this.environment.deployPath + f])
      }
    }
  }

}

export interface DeployRemoteTaskOptions {
  source: string;
}