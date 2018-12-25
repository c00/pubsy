import { Task } from '../model/Task';

export class RollbackRemoteTask extends Task {
  name = 'rollbackRemote';
  protected defaultParams: RollbackRemoteTaskOptions = {
    amount: 1
  };

  params: RollbackRemoteTaskOptions;

  public async run() {
    this.setDefaults();

    // Get all deployments
    const result = await this.environment.remote.exec('ls', [this.environment.deployPath]);
    const list = result.split('\n').filter(s => s.startsWith('build-')).sort();

    const current = await this.environment.remote.exec('readlink', [this.environment.deployPath + 'current']);
    let target: string;

    if (this.params.buildId) {
      console.log(`Rolling back from ${current} to ${this.params.buildId}`);
      //check if that exists.
      if (list.indexOf(this.params.buildId) === -1) {
        throw `BuildId ${this.params.buildId} doesn't exist. Canceling rollback.`
      }
      target = this.params.buildId;
    } else {
      console.log(`Rolling back ${this.params.amount} deployments.`)
      const currentIndex = list.indexOf(current);
      if (this.params.amount > currentIndex) {
        throw `Can't rollback ${this.params.amount} times. We only have ${currentIndex} earlier deployments available. Canceling rollback.`;
      }
      target = list[currentIndex - this.params.amount];
    }

    await this.environment.remote.symlink(target, this.environment.deployPath + 'current');
    console.log(`Rolled back from ${current} to ${target}`)
    
  }

}

export interface RollbackRemoteTaskOptions {
  buildId?: string;
  amount?: number;
}