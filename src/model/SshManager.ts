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

  //todo should this just be resolve?
  private replaceHomeFolder(string?: string): string {
    if (!string) string = '~/.ssh/id_rsa';
    if (string.substring(0, 1) !== '~') return string;

    const homeFolder = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    return string.replace('~', homeFolder);
  }

  private async connect() {
    if (this.connected) return Promise.resolve();

    if (!this.env.isRemote || !this.env.host) throw "Environments isn't remote or host is missing";

    Log.debug("  Connecting to remote...");

    const sshAuthSocket = process.env.SSH_AUTH_SOCK;
    this.ssh = new SSH();
    let config = {
      host: this.env.host,
      username: this.env.user || username.sync(),
      agent: undefined,
      privateKey: undefined,
    };

    if (this.env.key) {
      config.privateKey = this.replaceHomeFolder(this.env.key);
    } else {
      config.agent = sshAuthSocket;
    }

    //debug
    Log.debug("  SSH Socket: ", sshAuthSocket);

    //Log.debug(`  Using key: ${config.privateKey}`);
    await this.ssh.connect(config);
    this.connected = true;
  }

  public async putFile(local: string, remote: string): Promise<any> {
    Log.debug("  Putting file: " + basename(remote), local, remote);
    await this.connect();
    return this.ssh.putFile(local, remote);
  }

  public async exists(file: string): Promise<boolean> {
    try {
      await this.exec('ls', [file]);
      return true;
    } catch (err) {
      return false;
    }
  }

  public async supports(command: string): Promise<boolean> {
    try {
      const value = await this.exec('which', [command]);
      return (value.length > 0);
    } catch (err) {
      return false;
    }
  }

  public async sha1sum(file: string): Promise<string> {
    const result = await this.exec('sha1sum', [file]);

    return result.split(' ')[0];
  }

  public async exec(command: string, params?: string[], options?: any): Promise<string|any> {
    if (!params) params = [];
    Log.debug(`  Exec: ${command} ${params.join(' ')}`)
    await this.connect();

    return this.ssh.exec(command, params, options);
  }

  public async mkdir(path: string) {
    return this.exec('mkdir', ['-p', path]);
  }

  public async clone(repo: string, dest: string) {
    let err = [];
    let out = [];
    const options = {
      cwd: dest,
      stream: 'both',
      /* onStderr: ( (chunk: Buffer) => err.push(chunk.toString('utf-8')) ), */
      /* todo find some way to stream the output nicely. */
      /* onStdout: ( (chunk: Buffer) => console.log(chunk.toString('utf-8')) ),   */
      options: { pty: true } //pty stops it from erroring
    };

    const result = await this.exec(`git`, ['clone', repo], options);

    if (result.code === 0) return;

    throw new Error(result.stdout);
  }

  public async unzip(file: string, dest: string, removeFileAfter?: boolean) {
    await this.connect();

    if (!await this.supports('unzip')) throw new Error("Unzip command not supported on remote.");

    try {
      await this.exec('unzip', ['-o', file, '-d', dest]);
      if (removeFileAfter) return this.exec('rm', [file]);
    } catch (err) {
      Log.error(err);
      throw err;
    }
  }

  public async symlink(source: string, dest: string, cwd?: string) {
    await this.connect();

    if (cwd && !await this.exists(cwd)) throw new Error("Working dir doesn't exist: " + cwd);

    return this.exec('ln', ['-nsf', source, dest], { cwd });
  }

  public dispose() {
    if (this.ssh) {
      Log.debug("  Disconnecting from remote.");
      this.ssh.dispose();
    }
  }
}