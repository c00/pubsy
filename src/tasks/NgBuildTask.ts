import { execSync } from 'child_process';
import * as path from 'path';
import * as shelljs from 'shelljs';

import { Log } from '../model/Log';
import { Task } from '../model/Task';
import { existsSync } from 'fs';

export class NgBuildTask extends Task {
  name = 'ngBuild';
  protected defaultParams: NgBuildTaskParams = {
    base: '/',
    dest: ''
  };
  params: NgBuildTaskParams;

  public async run() {
    this.setDefaults();

    //Prepend the buildPath
    if (this.environment.buildPath) this.params.dest = this.environment.buildPath + this.params.dest;
    this.params.dest = path.resolve(this.params.dest);

    if (this.params.cwd) {
      if (!existsSync(this.params.cwd)) throw "Angular project path doesn't exist: " + this.params.cwd;
      Log.debug("  Switching to " + this.params.cwd)
      shelljs.cd(this.params.cwd);
    }

    const ngConfig = this.params.configuration ? `--configuration="${this.params.configuration}"` : '';

    const cmd = `npx ng build --output-path "${this.params.dest}" --base-href "${this.params.base}" ${ngConfig} --prod`;
    Log.debug("  Running: " + cmd);

    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (err) {
      console.log("execSybc failed", err);
      throw err;
    }

  } 
}

export interface NgBuildTaskParams {
  base?: string;
  dest?: string;
  cwd?: string;
  configuration?: string
}