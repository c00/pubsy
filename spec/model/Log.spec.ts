import "jasmine";
import { Log } from '../../src/model/Log';

describe("Logging with colors", () => {
  Log.verbosity = Log.level.EXTRA_DEBUG;

  it("Should print 5 messages in different colors.", () => {
    expect(Log.extraDebug('An extra debug message')).toBe(true);
    expect(Log.debug('A debug message')).toBe(true);
    expect(Log.info('A debug message')).toBe(true);
    expect(Log.warning('A debug message')).toBe(true);
    expect(Log.error('A debug message')).toBe(true); 
  });

  it("Should print 3 messages in different colors.", () => {
    Log.verbosity = Log.level.INFO;
    expect(Log.extraDebug('An extra debug message')).toBe(false);
    expect(Log.debug('A debug message')).toBe(false);
    expect(Log.info('An info message')).toBe(true);
    expect(Log.warning('A warning message')).toBe(true);
    expect(Log.error('An error message')).toBe(true); 
  });

  it("Should like multiple params.", () => {
    Log.verbosity = Log.level.INFO;
    Log.info('An info message', { name: 'joe' }, 'another message');

    Log.info({ name: 'joe' }, 'Foo');
    
  });

});