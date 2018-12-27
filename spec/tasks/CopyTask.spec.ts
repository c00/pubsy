import "jasmine";
import { CopyTaskParams, CopyTask } from '../../src/tasks/CopyTask';
import { FileHelper } from '../helpers/FileHelper';
import { stat, existsSync } from "fs";
import { Environment } from '../../src/model/Environment';
import { mkdir } from "shelljs";

const defaultParams: CopyTaskParams = {
  source: 'test/assets/**/*',
  dest: 'test/.build/'
};
const fh = new FileHelper();

describe("Copy functions", () => {
  //Make the dir in case it doesn't exist.
  mkdir(defaultParams.dest);

  it("Copy all files", async (done) => {
    fh.rimraf(defaultParams.dest + "*");
    expect(fh.countFilesAndFolders(defaultParams.dest, true)).toBe(0);

    const t = new CopyTask(null, defaultParams);
    await t.run();

    expect(fh.countFilesAndFolders(defaultParams.dest, true)).toBe(12);
    expect(fh.countFiles(defaultParams.dest, true)).toBe(9);
    expect(existsSync(defaultParams.dest + "test")).toBe(true); //Subfolders should be created

    done();
  });

  it("copies 1 file", async (done) => {
    const params: CopyTaskParams = {...defaultParams, source: 'test/assets/file.txt' };

    fh.rimraf(params.dest + "*");
    expect(fh.countFilesAndFolders(params.dest, true)).toBe(0);
    
    const t = new CopyTask(null, params);
    await t.run();

    /* 3, because there's the 'test' and `.build` folder and then the file. */
    expect(fh.countFilesAndFolders(params.dest, true)).toBe(3);
    expect(fh.countFiles(defaultParams.dest, true)).toBe(1);

    done();
  });

  it("copies 3 files", async (done) => {
    const params: CopyTaskParams = {...defaultParams, source: ['test/assets/file.txt', 'test/assets/cat_72.jpg', 'test/assets/subfolder/b_0001.jpg'] };

    fh.rimraf(params.dest + "*");
    expect(fh.countFilesAndFolders(params.dest, true)).toBe(0);
    
    const t = new CopyTask(null, params);
    await t.run();

    expect(fh.countFiles(defaultParams.dest, true)).toBe(3);

    done();
  });

  it("copies everything but jpgs", async (done) => {
    const params: CopyTaskParams = {...defaultParams, exclude: '**/*.jpg' };

    fh.rimraf(params.dest + "*");
    expect(fh.countFilesAndFolders(params.dest, true)).toBe(0);
    
    const t = new CopyTask(null, params);
    await t.run();

    expect(fh.countFiles(defaultParams.dest, true)).toBe(3);

    done();
  });

  it("flattens the structure", async (done) => {
    const params: CopyTaskParams = {...defaultParams, flatten: true };

    fh.rimraf(params.dest + "*");
    expect(fh.countFilesAndFolders(params.dest, true)).toBe(0);
    
    const t = new CopyTask(null, params);
    await t.run();

    expect(fh.countFiles(defaultParams.dest, true)).toBe(9);
    expect(fh.countFilesAndFolders(defaultParams.dest, true)).toBe(9); //No subfolders

    done();
  });

  it("changes the working directory", async (done) => {
    const params: CopyTaskParams = {...defaultParams, cwdSource: 'test/assets', source: '**/*' };

    fh.rimraf(params.dest + "*");
    expect(fh.countFilesAndFolders(params.dest, true)).toBe(0);
    
    const t = new CopyTask(null, params);
    await t.run();

    expect(fh.countFiles(defaultParams.dest, true)).toBe(9);
    expect(fh.countFilesAndFolders(defaultParams.dest, true)).toBe(10); //1 subfolder

    
    expect(existsSync(params.dest + "test")).toBe(false);

    done();
  });

  it("uses the buildPath", async (done) => {
    const params: CopyTaskParams = { cwdSource: 'test/assets', source: '**/*', dest: '' };
    const env: Environment = { name: 'test', buildPath: 'test/.build/' } 

    fh.rimraf(env.buildPath + "*");
    expect(fh.countFilesAndFolders(env.buildPath, true)).toBe(0);
    
    const t = new CopyTask(env, params);
    await t.run();

    expect(fh.countFiles(env.buildPath, true)).toBe(9);
    expect(fh.countFilesAndFolders(env.buildPath, true)).toBe(10); //1 subfolder

    expect(existsSync(env.buildPath + "test")).toBe(false);

    done();
  });


  it("uses the buildPath AND dest", async (done) => {
    const params: CopyTaskParams = { cwdSource: 'test/assets', source: '**/*', dest: 'patrick/' };
    const env: Environment = { name: 'test', buildPath: 'test/.build/' } 

    fh.rimraf(env.buildPath + "*");
    expect(fh.countFilesAndFolders(env.buildPath, true)).toBe(0);
    
    const t = new CopyTask(env, params);
    await t.run();

    expect(fh.countFiles(env.buildPath, true)).toBe(9);
    expect(fh.countFilesAndFolders(env.buildPath, true)).toBe(11);

    expect(existsSync(env.buildPath + params.dest)).toBe(true);

    done();
  });

});

