#!/usr/bin/env node

import { Command, Option } from 'commander';
import { createRequire } from 'module';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { globbySync } from 'globby';

const __dirname = new URL('../', import.meta.url).pathname;
const require = createRequire(__dirname);
const pkg = require('./package.json');
const program = new Command();
const SUPPORT_FORMATS = ['jpeg', 'png', 'webp', 'gif'];

program.version(pkg.version);
program
  .addOption(new Option('-i, --input <string>', 'your input globs').default('*.*'))
  .addOption(new Option('-o, --output <string>', 'your output dir').default('dist'))
  .addOption(new Option('-s, --scale <number>', 'scale of image(1-100)').default(100).argParser(parseFloat))
  .addOption(new Option('-q, --quality <number>', 'quality of image(1-100)').default(80).argParser(parseFloat))
  .addOption(new Option('-f, --format <string>', 'format of image'))
  .addOption(new Option('-v, --verbose <boolean>', 'show verbose log').default(false))
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

  ensureDir() {
    const { output } = this.opts;
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output);
    }
  }

  run() {
    const { input, format, quality, wepb } = this.opts;
    const files = globbySync(input);
    this.ensureDir();
    files.forEach((file) => {
      const isSupportFormat = SUPPORT_FORMATS.includes(format);
      const ext = path.extname(file).slice(1);
      const fmt = isSupportFormat ? format : ext;
      const outputFile = path.join(this.opts.output, path.basename(file)).replace(/\.\w+$/, `.${fmt}`);
      sharp(file).toFormat(fmt, { quality }).toFile(outputFile);
    });
  }
}

new CliApp().run();
