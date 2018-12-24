export class Helper {
  public static replaceAll(subject: string, find: string, replace: string){
    return subject.split(find).join(replace);
  }
}