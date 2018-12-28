import 'jasmine';

import { existsSync } from 'fs';
import { mkdir } from 'shelljs';

import { NgBuildTask, NgBuildTaskParams } from '../../src/tasks/NgBuildTask';
import { FileHelper } from '../helpers/FileHelper';
import * as shelljs from 'shelljs';

const defaultParams: NgBuildTaskParams = {
  base: '/',
  dest: 'test/.build/ng/',
  cwd: '/home/coo/dev/www/log-viewer-2/log-viewer-2-front/'
};
const fh = new FileHelper();

describe("Build an angular project", () => {
  const current = shelljs.pwd();
  const dir = defaultParams.dest;
  //Make the dir in case it doesn't exist.
  if (!existsSync(dir)) mkdir(dir);

  it("Builds an angular project.", async (done) => {
    fh.rimraf(dir + "*");
    expect(fh.countFilesAndFolders(dir, true)).toBe(0);

    const t = new NgBuildTask(null, defaultParams);
    await t.run();

    expect(existsSync(defaultParams.dest)).toBe(true);

    //Switch back to the original dir, just in case.
    shelljs.cd(current);

    done();
  });

});

