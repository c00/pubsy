import "jasmine";
import { Helper } from '../../src/model/Helper';

describe("Replace function", () => {

  it("should change 'hello world' to 'hell0 w0rld", () => {
    expect(Helper.replaceAll('hello world', 'o', '0')).toBe('hell0 w0rld');
  });
  it("should change 'hello world' to 'hell wrld", () => {
    expect(Helper.replaceAll('hello world', 'o', '')).toBe('hell wrld');
  });
  it("should change nothing", () => {
    expect(Helper.replaceAll('hello world', 'lol', '0')).toBe('hello world');
  });

});

describe("Remove trailing slash", () => {
  it('should remove 1 trailing slash', () => {
    expect(Helper.trimTrailingSlash('/var/www/bla/')).toBe('/var/www/bla');
  });

  it('shoulddo nothing', () => {
    expect(Helper.trimTrailingSlash('/var/www/bla')).toBe('/var/www/bla');
  });

  it('should remove multiple trailing slashes', () => {
    expect(Helper.trimTrailingSlash('/var/www/bla////')).toBe('/var/www/bla');
  });
});