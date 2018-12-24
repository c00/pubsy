import { Task } from './Task';
export interface Environment {
  name: string;
  outputBase?: string;
  isRemote?: boolean;
  hostName?: string;
  key?: string;
  taskList?: Task[];
  default?: boolean;
}