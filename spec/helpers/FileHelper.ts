import { readdirSync, statSync, createReadStream } from "fs";
import { rm } from "shelljs";
import * as crypto from 'crypto';
import { resolve } from "path";
import { SshManager } from '../../src/model/SshManager';
import { Environment } from "../../src/model/Environment";

export class FileHelper {
  public static async cleanRemote(ssh: SshManager, env: Environment) {
    if (await ssh.exists(env.deployPath)) await ssh.exec('rm', ['-rf', env.deployPath]);
  }

  public countFilesAndFolders(path: string, recursive?: boolean, depth?: number): number {
    if (!depth) depth = 0;
    depth++;
    if (depth > 100) {
      throw "Going 100 deep? Probably we messed up.";
    }

    const files = readdirSync(path);
    if (!recursive) return files.length;

    let count = files.length;
    for (let f of files) {
      const fullPath = this.joinPaths(path, f);
      const info = statSync(fullPath);
      //Recursively count.
      if (info.isDirectory()) count += this.countFilesAndFolders(fullPath, recursive, depth);
    }

    return count;
  }

  public countFiles(path: string, recursive?: boolean, depth?: number): number {
    if (!depth) depth = 0;
    depth++;
    if (depth > 100) {
      throw "Going 100 deep? Probably we messed up.";
    }

    const files = readdirSync(path);
    if (!recursive) return files.length;

    let count = 0;
    for (let f of files) {
      const fullPath = this.joinPaths(path, f);
      const info = statSync(fullPath);
      //Recursively count.
      if (info.isDirectory()) {
        count += this.countFiles(fullPath, recursive, depth);
      } else if (info.isFile()) {
        count++;
      }
    }

    return count;
  }

  public joinPaths(root: string, add: string): string {
    if (root.substring(root.length - 1) !== '/') root += "/"

    return root + add;
  }

  public rimraf(path: string) {
    rm('-rf', path);
  }

  public static async getSha1sum(file: string) {
    return new Promise((resolve, reject) => {
      // the file you want to get the hash    
      const fd = createReadStream(file);
      const hash = crypto.createHash('sha1');
      hash.setEncoding('hex');

      fd.on('end', () => {
        hash.end();
        const value = hash.read();
        resolve(String(value));
      });

      // read all file and pipe it (write it) to the hash object
      fd.pipe(hash);
    });
  }

}