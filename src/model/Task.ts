import { Environment } from './Environment';

export interface iTask {
  name: string;
  description?: string;
  params?: any;
  environments?: Environment[];
  enabled?: boolean;
  label?: string;
  run(): Promise<any>;
  
}

export abstract class Task implements iTask {
  protected defaultParams: any = {};
  name: string;
  label?: string;
  description?: string;
  enabled?: boolean;
  
  constructor(
    public environment?: Environment, 
    public params?: any
  ) {
    /* //Set parameters
    if (!this.params) this.params = {};
    this.params = { ...this.defaultParams, ...this.params }; */
  }

  abstract run(): Promise<any>;

  protected setDefaults() {
    if (!this.params) this.params = {};
    this.params = { ...this.defaultParams, ...this.params };
  }
}