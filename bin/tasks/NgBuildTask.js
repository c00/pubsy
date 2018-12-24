"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
class NgBuildTask {
    constructor(params) {
        this.params = params;
        this.name = 'ngBuild';
        if (!this.params)
            this.params = {};
        this.params = Object.assign({}, this.params, params);
    }
    run() {
        console.log("Building Angular App...");
        return new Promise((resolve, reject) => {
            child_process_1.exec(`ng build --output-path "${this.params.output}" --base-href ${this.params.base} --prod`, (err) => {
                if (err)
                    reject(err);
                resolve();
            });
        });
    }
}
NgBuildTask.defaultParams = {
    base: '/',
    output: './dist/'
};
exports.NgBuildTask = NgBuildTask;
