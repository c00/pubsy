export interface Task {
  name: string;
  description?: string;
  params?: any;
  run(): Promise<any>;
}