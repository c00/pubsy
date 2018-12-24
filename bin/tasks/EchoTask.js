"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EchoTask {
    constructor(params) {
        this.params = params;
        this.name = 'ngBuild';
        if (!this.params)
            this.params.message = "Good morning, planet!";
    }
    run() {
        if (this.params.messages) {
            for (let m of this.params.messages) {
                console.log(m);
            }
        }
        else {
            console.log(this.params.message);
        }
        return Promise.resolve();
    }
}
exports.EchoTask = EchoTask;
