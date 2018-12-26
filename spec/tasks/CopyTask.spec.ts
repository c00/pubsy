import "jasmine";
import { CopyTaskParams, CopyTask } from '../../src/tasks/CopyTask';
import { FileHelper } from '../helpers/FileHelper';

const defaultParams: CopyTaskParams = {
  source: 'test/assets/**/*',
  dest: 'test/.build/'
};
const fh = new FileHelper();

describe("Copy functions", () => {
  /* 
  Test all params
  source: string | string[];
  exclude?: string | string[];
  dest: string;
  flatten?: boolean;
  cwd?: string;

  test directory creation
  test errors
  Test environment buildPath
   */

  it("Copy all files", async (done) => {
    fh.rimraf(defaultParams.dest + "*");
    expect(fh.countFiles(defaultParams.dest, true)).toBe(0);

    const t = new CopyTask(null, defaultParams);
    await t.run();

    expect(fh.countFiles(defaultParams.dest, true)).toBe(12);

    done();

  });

});

