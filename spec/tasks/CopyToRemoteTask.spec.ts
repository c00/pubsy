import 'jasmine';

import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import * as moment from 'moment';

import { Config } from '../../src/model/Config';
import { CopyToRemoteTask, CopyToRemoteTaskParams } from '../../src/tasks/CopyToRemoteTask';
import { FileHelper } from '../helpers/FileHelper';
import { SshManager } from '../../src/model/SshManager';

const defaultParams: CopyToRemoteTaskParams = {
  source: '**/*',
  cwdSource: 'test/assets'
};
const fh = new FileHelper();
//Setup remote env
const config: Config = yaml.safeLoad(readFileSync('pubsy-remote-test.yml', 'utf8'));
const env = config.environments[0];
//This ensures misconfiguration doesn't result in deletion of stuff.
env.deployPath += moment().format('YYYY-MM-DD') + "/";
env.remote = new SshManager(env);

describe("Copy to remote tests", () => {

  let originalTimeout: number;
  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  /* todo add more tests...  */
  it("Copy all files", async (done) => {
    await FileHelper.cleanRemote(env.remote, env);

    const params: CopyToRemoteTaskParams = { ...defaultParams };

    //Run stuff
    const t = new CopyToRemoteTask(env, params);
    await t.run();

    done();
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

});

