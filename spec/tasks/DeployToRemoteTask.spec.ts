import 'jasmine';

import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import * as moment from 'moment';

import { Config } from '../../src/model/Config';
import { SshManager } from '../../src/model/SshManager';
import { DeployRemoteTask, DeployRemoteTaskOptions } from '../../src/tasks/DeployRemoteTask';
import { FileHelper } from '../helpers/FileHelper';

const defaultParams: DeployRemoteTaskOptions = {
  source: '**/*',
  cwd: 'test/assets'
};

//Setup remote env
const config: Config = yaml.safeLoad(readFileSync('pubsy-remote-test.yml', 'utf8'));
const env = config.environments[0];
//This ensures misconfiguration doesn't result in deletion of stuff.
env.deployPath += moment().format('YYYY-MM-DD') + "/";
env.remote = new SshManager(env);

describe("Deploy to remote tests", () => {  
  let originalTimeout: number;
  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });

  it("deploys the files on the remote.", async (done) => {
    await FileHelper.cleanRemote(env.remote, env);

    const params: DeployRemoteTaskOptions = { ...defaultParams };
    let buildIds = [];

    //Deploy a few times.
    const times = 3;
    for (let i = 0; i < times; i++) {
      env.buildId = null;
      let t = new DeployRemoteTask(env, params);
      await t.run();
      buildIds.push(env.buildId);
    }

    //Test that 3 folders exist
    const result = await env.remote.exec("ls", [env.deployPath]);
    const folders = result.split("\n").filter(s => s.startsWith('build'));
    expect(folders.length).toBe(times);

    for (let j = 0; j < times; j++) {
      expect(buildIds[j]).toBe(folders[j]);
    }

    //Test that current points to the last one
    const linkName = 'current';
    expect(await env.remote.exists(env.deployPath + linkName)).toBe(true);
    expect(await env.remote.exec("readlink", [env.deployPath + linkName])).toBe(buildIds[buildIds.length - 1]);

    done(); 
  }); 

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

});

