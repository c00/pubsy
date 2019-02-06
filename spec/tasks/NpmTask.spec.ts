import 'jasmine';

import { NpmTask, NpmTaskParams } from '../../src/tasks/NpmTask';
import { FileHelper } from '../helpers/FileHelper';

const defaultParams: NpmTaskParams = {
  cwd: '/home/coo/dev/www/log-viewer-2/log-viewer-2-front/',
};
const fh = new FileHelper();

describe("npm command", () => {

  it("outputs the version", async (done) => {
    const params = {...defaultParams, params: '--version'}
    const t = new NpmTask(null, params);
    await t.run();

    done();
  });

});

