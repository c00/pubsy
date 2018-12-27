import { Task } from '../model/Task';

export class EchoTask extends Task {
  name = 'echo';
  protected defaultParams = {
    message: 'Hello Planet!'
  };

  params: EchoTaskOptions;

  public async run() {
    this.setDefaults();
    
    if (this.params.messages) {
      for (let m of this.params.messages){
        console.log(m);
      }
    } else {
      console.log(this.params.message);
    }
    
  }

  
}

export interface EchoTaskOptions {
  message?: string;
  messages?: string[];
}