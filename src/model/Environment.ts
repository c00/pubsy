import { Task } from './Task';
import { SshManager } from './SshManager';
export interface Environment {
  name: string;
  buildPath?: string;
  buildId?: string;
  deployPath?: string;
  isRemote?: boolean;
  default?: boolean;
  keepDeployments?: number;

  //ssh stuff
  host?: string;
  user?: string;
  key?: string;
  remote?: SshManager;

  taskList?: Task[];
}