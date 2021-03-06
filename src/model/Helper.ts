import * as glob from 'glob';
import * as path from 'path';

import { FileInfo } from './FileInfo';
import { Environment } from './Environment';

export class Helper {

  public static replaceEnvironmentVariables(value: string, environment: Environment): string {
    for (let k in environment) {
      if (!environment.hasOwnProperty(k)) continue;
      if (typeof environment[k] !== 'string') continue;

      const placeholder = `%${k}%`;
      value = Helper.replaceAll(value, placeholder, environment[k]);
    }  

    return value;
  }

  public static replaceAll(subject: string, find: string, replace: string): string {
    return subject.split(find).join(replace);
  }

  public static interpolateString(subject: string, values?: any): string {
    if (!values) return subject;

    let result: string = subject;

    for (let k in values) {
      if (!values.hasOwnProperty(k)) continue;
      if (typeof values[k] !== 'string') continue;

      const placeholder = `%${k}%`;
      result = Helper.replaceAll(result, placeholder, values[k]);
    }

    return result;
    
  }

  public static trimTrailingSlash(s: string): string {
    let i = 0;
    while (s.substring(s.length - 1) === '/') {
      s = s.substring(0, s.length - 1);

      if (i++ > 100) break;
    }

    return s;
  }

  public static async glob(include: string | string[], exclude: string | string[]): Promise<FileInfo[]> {

    const files = await Helper.getPaths(include);
    const excluded = await Helper.getPaths(exclude);

    const result: FileInfo[] = files
      .filter(f => excluded.indexOf(f) === -1)
      .map(f => {
        return {
          relative: f,
          resolved: path.resolve(f),
          basename: path.basename(f)
        }
      });

      return result;
  }

  private static async getPaths(pattern: string | string[]) {
    if (!pattern) return [];
    if (typeof pattern === 'string') pattern = [pattern];

    let files = [];
    for (let s of pattern) {
      const batch = await this.globPath(s);
      files.push.apply(files, batch);
    }

    return files;
  }

  private static globPath(input: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      glob(input, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  public static joinPaths(root: string, add: string): string {
    if (root.substring(root.length - 1) !== '/') root += "/"

    return root + add;
  }
}