import 'jasmine';

import * as yaml from 'js-yaml';
import * as moment from 'moment';

import { Config } from '../../src/model/Config';
import { SshManager } from '../../src/model/SshManager';
import { CloneRemoteTaskParams, CloneRemoteTask } from '../../src/tasks/CloneRemoteTask';
import { FileHelper } from '../helpers/FileHelper';
import { readFileSync } from 'fs';

const defaultParams: CloneRemoteTaskParams = {
  repo: 'git@github.com:c00/pubsy.git',
};
const fh = new FileHelper();
//Setup remote env
const config: Config = yaml.safeLoad(readFileSync('pubsy-remote-test.yml', 'utf8'));
const env = config.environments[0];
//This ensures misconfiguration doesn't result in deletion of stuff.
env.deployPath += moment().format('YYYY-MM-DD') + "/";
env.remote = new SshManager(env);

describe("Clone remote task", () => {
  let originalTimeout: number;
  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });

  it("git clone remotely.", async (done) => {
    await FileHelper.cleanRemote(env.remote, env);

    const t = new CloneRemoteTask(env, defaultParams);

    await t.run();

    done();
  });

  it("has an invalid repo.", async (done) => {
    await FileHelper.cleanRemote(env.remote, env);

    const t = new CloneRemoteTask(env, { ...defaultParams, repo: 'git@github.com:c00/not-a-repo.git' });
    try {
      await t.run();
    } catch (err) {
      console.log("ERROR", err);
      debugger;
    }


    done();
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
});

