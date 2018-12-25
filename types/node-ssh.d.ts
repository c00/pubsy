export = index;

declare class index {
  connection: any;
  connect(givenConfig: any): any;
  dispose(): void;
  exec(_x4: any, ...args: any[]): any;
  execCommand(_x7: any, ...args: any[]): any;
  getFile(_x9: any, _x10: any, ...args: any[]): any;
  mkdir(_x: any, ...args: any[]): any;
  putDirectory(_x20: any, _x21: any, ...args: any[]): any;
  putFile(_x13: any, _x14: any, ...args: any[]): any;
  putFiles(_x17: any, ...args: any[]): any;
  requestSFTP(...args: any[]): any;
  requestShell(...args: any[]): any;
}
