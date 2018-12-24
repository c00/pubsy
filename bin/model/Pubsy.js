"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const NgBuildTask_1 = require("../tasks/NgBuildTask");
const EchoTask_1 = require("../tasks/EchoTask");
class Pubsy {
    constructor() {
        this.tasks = [];
    }
    run() {
        const program = require('commander');
        program
            .version('0.1.0')
            .command('build')
            .action(() => {
            console.log("Building...");
            this.tasks.push(new NgBuildTask_1.NgBuildTask({ base: '/log-viewer/' }));
        });
        program.command('hi [message]')
            .action((message) => {
            this.tasks.push(new EchoTask_1.EchoTask({ message }));
            this.runTasks();
        });
        program.parse(process.argv);
    }
    runTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let t of this.tasks) {
                yield t.run();
            }
            console.log("Tasks complete");
        });
    }
}
exports.Pubsy = Pubsy;
