import 'jasmine';

import { existsSync } from 'fs';
import * as shelljs from 'shelljs';

import { Environment } from '../../src/model/Environment';
import { DeployLocalTask, DeployLocalTaskParams } from '../../src/tasks/DeployLocalTask';
import { FileHelper } from '../helpers/FileHelper';

const defaultParams: DeployLocalTaskParams = {
  source: '**/*',
  cwdSource: 'test/assets'
};
const env: Environment = { name: 'local', deployPath: 'test/.build/deployments/', keepDeployments: 3 }
const fh = new FileHelper();

describe("Deploy locally tests", () => {  

  it("deploys the files.", async (done) => {
    fh.rimraf(env.deployPath);
    
    const params: DeployLocalTaskParams = { ...defaultParams };
    let buildIds = [];

    //Deploy a few times.
    const times = 5;
    const expectedBuilds = times > env.keepDeployments ? env.keepDeployments : times;
    debugger;

    for (let i = 0; i < times; i++) {
      env.buildId = null;
      let t = new DeployLocalTask(env, params);
      await t.run();
      buildIds.push(env.buildId);

      //For different build ids, sleep a bit.
      await FileHelper.sleep(200);
      debugger;
    }

    //Test that 3 folders exist
    const result = shelljs.ls(env.deployPath);
    const folders = result.filter(s => s.startsWith('build'));
    expect(folders.length).toBe(expectedBuilds);

    //Test that current points to the last one
    const linkName = 'current';
    expect(existsSync(env.deployPath + linkName)).toBe(true);

    done(); 
  }); 

});

