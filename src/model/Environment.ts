import { Task } from './Task';
export interface Environment {
  name: string;
  buildPath?: string;
  deployPath?: string;
  isRemote?: boolean;
  hostName?: string;
  key?: string;
  taskList?: Task[];
  default?: boolean;
}