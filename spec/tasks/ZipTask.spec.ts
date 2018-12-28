import 'jasmine';

import { existsSync } from 'fs';
import { mkdir } from 'shelljs';

import { CopyTaskParams } from '../../src/tasks/CopyTask';
import { ZipTask, ZipTaskParams } from '../../src/tasks/ZipTask';
import { FileHelper } from '../helpers/FileHelper';
import { dirname } from 'path';
import { Environment } from '../../src/model/Environment';

const defaultParams: CopyTaskParams = {
  source: 'test/assets/**/*',
  dest: 'test/.build/files.zip'
};
const fh = new FileHelper();

describe("Zip functions", () => {
  const dir = dirname(defaultParams.dest) + "/";
  //Make the dir in case it doesn't exist.
  if (!existsSync(dir)) mkdir(dir);

  it("Zips all the things", async (done) => {
    fh.rimraf(dir + "*");
    expect(fh.countFilesAndFolders(dir, true)).toBe(0);

    const t = new ZipTask(null, defaultParams);
    await t.run();

    expect(existsSync(defaultParams.dest)).toBe(true);

    done();
  });

  it("Zips none of things", async (done) => {
    fh.rimraf(dir + "*");
    expect(fh.countFilesAndFolders(dir, true)).toBe(0);
    const params = { ...defaultParams, source: null };
    const t = new ZipTask(null, params);

    let error;
    try {
      await t.run();
    } catch (e) {
      error = e;
    }
    expect(error).toBe("I need a source and dest for this task (ZipTask)");

    done();
  });

  it("Tries to save the zip without the zip extension", async (done) => {
    fh.rimraf(dir + "*");
    expect(fh.countFilesAndFolders(dir, true)).toBe(0);
    const params = { ...defaultParams, dest: 'test/.build/fileswithoutzipattheend' };
    const t = new ZipTask(null, params);

    let error;
    try {
      await t.run();
    } catch (e) {
      error = e;
    }
    expect(error).toBe("Destination must end in '.zip'");

    done();
  });

  it("Tries to save the zip in a non-existent folder", async (done) => {
    fh.rimraf(dir + "*");
    expect(fh.countFilesAndFolders(dir, true)).toBe(0);
    const params: ZipTaskParams = { ...defaultParams, createDestFolder: false, dest: 'test/.build/notafolder/files.zip' };
    const t = new ZipTask(null, params);

    let error;
    try {
      await t.run();
    } catch (e) {
      error = e;
    }
    expect(error).toBe("Zip destination folder doesn't exist.");

    done();
  });

  it("creates the dest folder", async (done) => {
    fh.rimraf(dir + "*");
    expect(fh.countFilesAndFolders(dir, true)).toBe(0);
    const params: ZipTaskParams = { ...defaultParams, dest: 'files.zip' };
    const env: Environment = { name: 'test', buildPath: 'test/.build/'}
    const t = new ZipTask(env, params);

    await t.run();
    expect(existsSync(env.buildPath + params.dest)).toBe(true);


    done();
  });

});

