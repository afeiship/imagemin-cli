#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'module';
// import sharp from 'sharp';
import { globby } from 'globby';

const __dirname = new URL('../', import.meta.url).pathname;
const require = createRequire(__dirname);
const pkg = require('./package.json');
const program = new Command();

program.version(pkg.version);
program
  .option('-f, --force', 'force to create')
  .option('-i, --input', 'your input globs')
  .option('-o, --output', 'your output dir')
  .option('-s, --scale', 'scale of image(1-100)')
  .option('-q, --quality', 'quality of image(1-100)')
  .option('-t, --target-format', 'target format of image')
  .option('-v, --verbose', 'show verbose log')
  .parse(process.argv);

/**
 * @help: imagemin-cli -h
 * @description: imagemin-cli -f
 */

class CliApp {
  constructor() {
    this.args = program.args;
    this.opts = program.opts();
  }

  log(...args) {
    const { verbose } = this.opts;
    if (verbose) console.log('📗', ...args);
  }

  run() {
    console.log(this.args);
    // this.log('run cli: ', __dirname, this.args, this.opts, pkg.version);
  }
}

new CliApp().run();
