export class Helper {
  public static replaceAll(subject: string, find: string, replace: string){
    return subject.split(find).join(replace);
  }

  public static TrimTrailingSlash(s: string): string {
    let i = 0;
    while (s.substring(s.length -1, 1) === '/'){
      s = s.substring(0, s.length -1);

      if (i++ > 100) break;
    }

    return s;
  }
}