import 'jasmine';

import { existsSync } from 'fs';
import { rm } from 'shelljs';

import { SymlinkTask, SymlinkTaskParams } from '../../src/tasks/SymLinkTask';
import { FileHelper } from '../helpers/FileHelper';

const defaultParams: SymlinkTaskParams = {
  source: '../assets',
  dest: 'test/.build/asses'
};
const fh = new FileHelper();

describe("Symlink functions", () => {
  it("test basic functions.", async (done) => {
    // Delete the link if it already exists.
    if (existsSync(defaultParams.dest)) rm(defaultParams.dest);

    expect(existsSync(defaultParams.dest)).toBe(false);

    const t = new SymlinkTask(null, defaultParams);
    await t.run();

    expect(existsSync(defaultParams.dest)).toBe(true);

    done();
  });

});

