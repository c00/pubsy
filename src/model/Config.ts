import { Task } from "./Task";
import { Environment } from './Environment';

export interface Config {
  tasks: Task[];
  environments: Environment[];
  
}