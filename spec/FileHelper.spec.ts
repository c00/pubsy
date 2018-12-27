import "jasmine";
import { FileHelper } from './helpers/FileHelper';

describe("Replace function", () => {
  const fh = new FileHelper();

  it('should count files recursively', () => {
    expect(fh.countFiles('test/assets/', true)).toBe(9);
    expect(fh.countFilesAndFolders('test/assets/', true)).toBe(10);
  });
});