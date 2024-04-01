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
const defPer = [100, 100];
const parseNums = (n) => n.split(',').map(parseFloat);

program.version(pkg.version);
program
  .addOption(new Option('-i, --input <string>', 'your input globs').default('*.*'))
  .addOption(new Option('-o, --output <string>', 'your output dir').default('dist'))
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
    const { input, format, quality, width, height, scale } = this.opts;
    const files = globbySync(input);
    this.ensureDir();
    files.forEach((file) => {
      const isSupportFormat = SUPPORT_FORMATS.includes(format);
      const ext = path.extname(file).slice(1);
      const fmt = isSupportFormat ? format : ext;
      const outputFile = path.join(this.opts.output, path.basename(file)).replace(/\.\w+$/, `.${fmt}`);
      const img = sharp(file);
      const resizeOpts = { fit: 'inside', withoutEnlargement: true };
      img.metadata().then((metadata) => {
        const { width: w, height: h } = metadata;
        const [wP, hP] = scale;
        const wp = wP || 100;
        const hp = hP || wP || 100;
        const _width = parseInt(width || w * (wp / 100));
        const _height = parseInt(height || h * (hp / 100));

        img
          .resize(_width, _height, resizeOpts)
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
