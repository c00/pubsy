import "jasmine";
import { FileHelper } from './helpers/FileHelper';

describe("Replace function", () => {
  const fh = new FileHelper();

  it('should count files recursively', () => {
    const actual = fh.countFiles('test/assets/', true);
    expect(actual).toBe(10);
  });
});