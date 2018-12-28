import SSH = require('node-ssh');
import { basename } from 'path';
import * as username from 'username';

import { Environment } from './Environment';
import { Log } from './Log';

export class SshManager {
  private connected = false;
  private ssh: SSH;

  constructor(private env: Environment) {

  }

  private replaceHomeFolder(string?: string): string {
    if (!string) string = '~/.ssh/id_rsa';
    const homeFolder = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    return string.replace('~', homeFolder);
  }

  private connect(): Promise<any> {
    if (this.connected) return Promise.resolve();

    if (!this.env.isRemote || !this.env.host) Promise.reject("Environments isn't remote or host is missing");

    Log.debug("Connecting to remote...");
    
    this.ssh = new SSH();
    let config = {
      host: this.env.host,
      username: this.env.user || username.sync(),
      privateKey: this.replaceHomeFolder(this.env.key) || this.replaceHomeFolder()
    };

    return this.ssh.connect(config)
    .then( () => {
      this.connected = true;
    });
       
  }

  public putFile(local: string, remote: string): Promise<any> {
    Log.debug("Putting file: " + basename(remote), local, remote);
    return this.connect()
    .then(() => this.ssh.putFile(local, remote) );
  }

  public exec(command: string, params?: string[], options?: any): Promise<string> {
    if (!params) params = [];
    Log.debug(`Exec: ${command} ${params.join(' ')}`)
    return this.connect()
    .then(() => this.ssh.exec(command, params, options) );
  }

  public mkdir(path: string): Promise<any> {
    return this.connect()
    .then(() => this.exec('mkdir', ['-p', path]));
  }

  public unzip(file: string, dest: string, removeFileAfter?: boolean): Promise<any> {
    //todo check if unzip is supported
    return this.connect()
    .then(() => this.exec('unzip', ['-o', file, '-d', dest]))
    .then(() => {
      if (removeFileAfter) return this.exec('rm', [file]);
    })
    .catch((err) => {
      Log.error(err);
      process.exit(1);
    });
  }

  public symlink(source: string, dest: string) {
    return this.connect()
    .then(() => this.exec('ln', ['-nsf', source, dest]))
  }

  public dispose() {
    if (this.ssh) {
      Log.debug("Disconnecting from remote.");
      this.ssh.dispose();
    }
  }
}