import { Environment } from './Environment';

export interface iTask {
  name: string;
  description?: string;
  params?: any;
  environments?: Environment[];
  run(): Promise<any>;
}

export abstract class Task implements iTask {
  protected defaultParams: any = {};
  name: string;
  description?: string;

  constructor(
    public environment?: Environment, 
    public params?: any
  ) {
    //Set parameters
    if (!this.params) this.params = {};
    this.params = { ...this.defaultParams, ...this.params };
  }

  abstract run(): Promise<any>;
}