import { Task } from '../model/Task';

export class EchoTask implements Task {
  name = 'ngBuild';

  constructor(public params?: EchoTaskOptions) { 
    if (!this.params) this.params.message = "Good morning, planet!";
  }

  public run() {
    if (this.params.messages) {
      for (let m of this.params.messages){
        console.log(m);
      }
    } else {
      console.log(this.params.message);
    }

    return Promise.resolve();
  }

  
}

export interface EchoTaskOptions {
  message?: string;
  messages?: string[];
}