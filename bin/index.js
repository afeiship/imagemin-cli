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
const SUPPORT_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'svg'];
const defPer = [100, 100];
const parseNums = (n) => n.split(',').map(parseFloat);

program.version(pkg.version);
program
  .addOption(new Option('-i, --input <string>', 'your input globs').default('*.*'))
  .addOption(new Option('-o, --output <string>', 'your output dir').default('dist'))
  .addOption(new Option('-m, --fit-mode <string>', 'fit mode of image').default('inside'))
  .addOption(new Option('-x, --width <number>', 'width of image').argParser(parseFloat))
  .addOption(new Option('-y, --height <number>', 'height of image').argParser(parseFloat))
  .addOption(new Option('-s, --scale <numbers...>', 'scale of image(1-100)').default(defPer).argParser(parseNums))
  .addOption(new Option('-q, --quality <number>', 'quality of image(1-100)').default(80).argParser(parseFloat))
  .addOption(new Option('-f, --format <string>', 'format of image'))
  .addOption(new Option('-v, --verbose', 'show verbose log').default(false))
  .parse(process.argv);

/**
 * @help: imagemin-cli -h
 * @description: imagemin-cli -f
 */

class CliApp {
  // ---- properties ----
  get resizeOpts() {
    const { fitMode } = this.opts;
    return {
      fit: fitMode,
      withoutEnlargement: true,
    };
  }

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

  getFormat(filename, format) {
    const ext = path.extname(filename).slice(1);
    const supported = SUPPORT_FORMATS.includes(format);
    return supported ? format : ext;
  }

  getResizeWh(metadata) {
    const { width, height, scale } = this.opts;
    const [wP, hP] = scale;
    const wp = wP || 100;
    const hp = hP || wP || 100;
    const _width = parseInt(width || metadata.width * (wp / 100));
    const _height = parseInt(height || metadata.height * (hp / 100));
    return { width: _width, height: _height };
  }

  run() {
    const { input, format, quality } = this.opts;
    const files = globbySync(input);
    this.ensureDir();
    files.forEach((file) => {
      const fmt = this.getFormat(file, format);
      const outputFile = path.join(this.opts.output, path.basename(file)).replace(/\.\w+$/, `.${fmt}`);
      const img = sharp(file);
      img.metadata().then((metadata) => {
        const wh = this.getResizeWh(metadata);
        img
          .resize(wh.width, wh.height, this.resizeOpts)
          .toFormat(fmt, { quality })
          .toFile(outputFile, (err) => {
            if (err) return console.error(err);
            this.log(`${file} -> ${outputFile}`);
          });
      });
    });
  }
}

new CliApp().run();
