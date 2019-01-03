import 'jasmine';

import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import * as moment from 'moment';

import { Config } from '../../src/model/Config';
import { SshManager } from '../../src/model/SshManager';
import { CopyToRemoteTask, CopyToRemoteTaskParams } from '../../src/tasks/CopyToRemoteTask';
import { FileHelper } from '../helpers/FileHelper';

const defaultParams: CopyToRemoteTaskParams = {
  source: 'test/assets/**/*',
  cwd: 'test/assets'
};
const fh = new FileHelper();
//Setup remote env
const config: Config = yaml.safeLoad(readFileSync('pubsy-remote-test.yml', 'utf8'));
const env = config.environments[0];
env.remote = new SshManager(config.environments[0]);

//todo everything there
describe("Copy to remote tests", () => {
  
  it("Copy all files", async (done) => {
    throw new Error("Todo");
    debugger;
    //Create test dir remotely.
    const testDir = moment().format('YYYY-MM-DD-') + moment().unix();
    env.remote.mkdir(env.deployPath + "/" + testDir);
    const params: CopyToRemoteTaskParams = {...defaultParams, dest: testDir};
    
    //Run stuff
    const t = new CopyToRemoteTask(env, params);
    await t.run();

    done();
  });

});

