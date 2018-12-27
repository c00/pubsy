import { readdirSync, statSync } from "fs";
import { rm } from "shelljs";

export class FileHelper {
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
      if (info.isDirectory()){
        count += this.countFiles(fullPath, recursive, depth);
      } else if (info.isFile()) {
        count++;
      }
    }
  
    return count;
  }

  public joinPaths(root: string, add: string): string {
    if (root.substring(root.length - 1) !== '/') root += "/"

    return root+add;
  }

  public rimraf(path: string) {
    rm('-rf', path);
  }

}