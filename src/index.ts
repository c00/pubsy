#!/usr/bin/env node

import { NgBuildTask } from './tasks/NgBuildTask';
import { EchoTask } from './tasks/EchoTask';
import { Pubsy } from './model/Pubsy';


const pubsy = new Pubsy();
pubsy.run();