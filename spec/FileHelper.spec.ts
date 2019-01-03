import "jasmine";
import { FileHelper } from './helpers/FileHelper';

describe("Replace function", () => {
  const fh = new FileHelper();

  it('should count files recursively', () => {
    expect(fh.countFiles('test/assets/', true)).toBe(9);
    expect(fh.countFilesAndFolders('test/assets/', true)).toBe(10);
  });

  it("tests local sha1sums", async (done) => {
    const filename = "test/assets/cat_72.jpg";
    const sha = await FileHelper.getSha1sum(filename);
    expect(sha).toBe("2e0e5b6522ee03af8be1a68da709fa972fd6121d");
    done();
  });

});