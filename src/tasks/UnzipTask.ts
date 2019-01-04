import { resolve } from 'path';

import { Task } from '../model/Task';



export class UnzipRemoteTask extends Task {
  name = 'unzipRemote';

  protected defaultParams: UnzipTaskParams = { source: 'files.zip', removeAfter: false, dest: '' };
  public params: UnzipTaskParams;

  public async run(): Promise<any> {
    this.setDefaults();

    //Prepend the deployPath
    if (this.environment.deployPath) {
      this.params.source = this.environment.deployPath + this.params.source;
      this.params.dest = this.environment.deployPath + this.params.dest;
    }

    //Create dir if it doesn't exist yet.
    await this.environment.remote.mkdir(this.params.dest)

    //Unzip
    await this.environment.remote.unzip(this.params.source, this.params.dest, this.params.removeAfter);
  }

}

export interface UnzipTaskParams {
  source: string;
  dest?: string;
  removeAfter?: boolean;
}