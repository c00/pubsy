import * as colors from 'colors';

export namespace Log {
  export const level = {
    ERROR: 10,
    WARNING: 20,
    SUCCESS: 29,
    INFO: 30,
    DEBUG: 40,
    EXTRA_DEBUG: 50,
  };

  const stringColors = {
    10: 'red',
    20: 'yellow',
    29: 'green',
    30: 'blue',
    40: 'cyan',
    50: 'cyan'
  };

  export let verbosity: number = level.INFO;

  export function error(...params: any): boolean {
    return log(level.ERROR, ...params);
  }
  export function warning(...params: any): boolean {
    return log(level.WARNING, ...params);
  }
  export function info(...params: any): boolean {
    return log(level.INFO, ...params);
  }
  export function success(...params: any): boolean {
    return log(level.SUCCESS, ...params);
  }
  export function debug(...params: any): boolean {
    return log(level.DEBUG, ...params);
  }
  export function extraDebug(...params: any): boolean {
    return log(level.EXTRA_DEBUG, ...params);
  }

  function log(level: number, ...params: any): boolean {
    if (level > verbosity) return false;

    let converted = [];

    const c = stringColors[level] || null;
    if (c) {
      debugger;
      for (let p of params) {
        converted.push((typeof p === 'string') ? colors[c](p) : p);
      }
    } else {
      converted = params;
    }
    
    console.log(...converted);
    return true;
  }


}

