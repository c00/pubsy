import { Task } from '../model/Task';
import { Helper } from '../model/Helper';

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
        console.log(Helper.interpolateString(m, this.environment));
      }
    } else {
      console.log(Helper.interpolateString(this.params.message, this.environment));
    }
    
  }

  
}

export interface EchoTaskOptions {
  message?: string;
  messages?: string[];
}