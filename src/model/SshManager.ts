import { Environment } from './Environment';
import SSH = require('node-ssh');
import * as username from 'username';

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

    console.debug("Connecting to remote...");
    
    this.ssh = new SSH();
    let config = {
      host: this.env.host,
      username: this.env.user || username.sync(),
      privateKey: this.replaceHomeFolder(this.env.key) || this.replaceHomeFolder()
    };

    return this.ssh.connect(config)
    .then( () => this.connected = true );
       
  }

  public putFile(local: string, remote: string): Promise<any> {
    return this.connect()
    .then(() => this.ssh.putFile(local, remote) );
  }

  public exec(command: string, params?: string[], options?: any): Promise<string> {
    return this.connect()
    .then(() => this.ssh.exec(command, params, options) );
  }

  public mkdir(path: string): Promise<any> {
    return this.connect()
    .then(() => this.exec('mkdir', ['-p', path]));
  }

  public unzip(file: string, removeFileAfter?: boolean): Promise<any> {
    //todo check if unzip is supported
    return this.connect()
    .then(() => this.exec('unzip', [file]))
    .then(() => {
      if (removeFileAfter) return this.exec('rm', [file])
    });
  }

  public dispose() {
    console.debug("Disconnecting from remote.");
    if (this.ssh) this.ssh.dispose();
  }
}