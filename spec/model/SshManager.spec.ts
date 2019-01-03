import 'jasmine';

import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';

import { Config } from '../../src/model/Config';
import { SshManager } from '../../src/model/SshManager';
import { FileHelper } from '../helpers/FileHelper';
import { CopyTaskParams } from '../../src/tasks/CopyTask';
import { ZipTask } from '../../src/tasks/ZipTask';
import * as moment from 'moment';

describe("SSH Manager tests", () => {
  //Setup remote env
  const config: Config = yaml.safeLoad(readFileSync('pubsy-remote-test.yml', 'utf8'));
  const env = config.environments[0];
  //This ensures misconfiguration doesn't result in deletion of stuff.
  env.deployPath += moment().format('YYYY-MM-DD') + "/"; 
  const ssh = new SshManager(config.environments[0]);

  it("Should connect successfully", async (done) => {
    const pwd = await ssh.exec('pwd');
    expect(pwd).toContain('/home/');
    done();
  });

  it("Should not connect successfully", async (done) => {
    const sshWrong = new SshManager(config.environments[1]);
    try {
      await sshWrong.exec('pwd');
      throw "That shouldn't work.";
    } catch (err) {
      expect(err.level).toBe('client-authentication');
      done();
    }
  });

  it("checks working dirs", async (done) => {
    const changedDir = await ssh.exec('cd /var/log/ && pwd');
    //Here we expect it to be /var/log because we concat 2 commands.
    expect(changedDir).toBe("/var/log");

    //But every loose command is reset to the starting position.
    expect(await ssh.exec('pwd')).toContain("/home/");
    done();
  });

  it("checks command and params", async (done) => {
    const jude = await ssh.exec('cd /var/log/ && echo', ['Hey jude']);
    //Here we expect it to be /var/log because we concat 2 commands.
    expect(jude).toBe("Hey jude");

    const nope = await ssh.exec('cd', ['/var/log/', '&&', 'echo', 'Hey jude']);
    //Here it will just be an empty string, as it can't fit together commands like that.
    expect(nope).toBe('');

    const jude2 = await ssh.exec('cd /var/log/ && echo Hey jude && echo "Don\'t make it bad"');
    //Multiple outputs will be concatenated.
    expect(jude2).toBe("Hey jude\nDon\'t make it bad");

    done();
  });

  it("tests if files exist", async (done) => {
    expect(await ssh.exists('.')).toBe(true);
    expect(await ssh.exists('a-random-file-that-doesnt-exist')).toBe(false);
    done();
  });

  it("tests if commands are supported", async (done) => {
    expect(await ssh.supports('sha1sum')).toBe(true);
    expect(await ssh.supports('sudo')).toBe(true);
    expect(await ssh.supports('git')).toBe(true);
    expect(await ssh.supports('notacommand')).toBe(false);
    done();
  });

  it("Puts a file on the server", async (done) => {
    const filename = "cat_72.jpg";

    //Clean test env
    await FileHelper.cleanRemote(ssh, env);

    expect(await ssh.exists(env.deployPath + filename)).toBe(false);

    await ssh.putFile(env.buildPath + filename, env.deployPath + filename);

    //Test if file exists remotely
    expect(await ssh.exists(env.deployPath + filename)).toBe(true);

    //tests if files are the same locally and remote
    const localSum = await FileHelper.getSha1sum(env.buildPath + filename);
    const remoteSum = await ssh.sha1sum(env.deployPath + filename);

    expect(localSum).toBe(remoteSum);

    done();
  });

  it("Makes some directories", async (done) => {
    const testDirs = 'some/folders/underneath';

    //Clean test env
    await FileHelper.cleanRemote(ssh, env);

    expect(await ssh.exists(env.deployPath + testDirs)).toBe(false);
    await ssh.mkdir(env.deployPath + testDirs);

    //Test if file exists remotely
    expect(await ssh.exists(env.deployPath + testDirs)).toBe(true);
    done();
  });

  it("unzips remotely", async (done) => {
    //Clean test env
    await FileHelper.cleanRemote(ssh, env);

    const params: CopyTaskParams = {
      source: 'test/assets/**/*',
      dest: 'test/.build/files.zip'
    };

    //Zip files
    const t = new ZipTask(null, params);
    await t.run();

    //Put zip file
    const remoteZip = env.deployPath + "zip/files.zip";
    await ssh.putFile(params.dest, remoteZip);
    expect(await ssh.exists(remoteZip)).toBe(true);

    //unzip
    await ssh.unzip(remoteZip, env.deployPath + "extracted/");

    //Extracted files exist?
    const ls = await ssh.exec('ls', [env.deployPath + "extracted/test/assets"]);
    const list = ls.split("\n");
    expect(list.length).toBe(9);

    //zip file still remains?
    expect(await ssh.exists(remoteZip)).toBe(true);

    done();
  });

});