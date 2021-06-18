#!/usr/bin/env node
const { Command } = require('commander');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const chalk = require('chalk');

// next packages:
require('@jswork/next');
require('@jswork/next-absolute-package');
require('@jswork/next-safe-assign');
require('@jswork/next-filesize');
require('@jswork/next-sum');

const { version } = nx.absolutePackage();
const program = new Command();
const defaults = require(`${process.env.HOME}/.aric/.imagemin-cli.json`);

program.version(version);
program
  .option('-i, --input <list>', 'Your input globs.', (v) => v.split(','))
  .option('-d, --destination <string>', 'Your output dir.')
  .parse(process.argv);

nx.declare({
  statics: {
    init() {
      const app = new this();
      app.start();
    }
  },
  methods: {
    init() {
      this.config = nx.safeAssign(defaults, program.opts());
    },
    start() {
      const { input, destination } = this.config;
      imagemin(input, {
        destination: destination,
        plugins: [
          imageminJpegtran(),
          imageminPngquant({
            quality: [0.6, 0.8]
          })
        ]
      }).then((res) => {
        console.log(this.stat(res));
        console.log(chalk.green('🚗 minify success.'));
      });
    },
    stat: function (inResponse) {
      const items = inResponse.map((item) => {
        const { sourcePath, destinationPath } = item;
        const res1 = nx.filesize(item.sourcePath);
        const res2 = nx.filesize(item.destinationPath);
        return {
          sourcePath,
          destinationPath,
          srcSize: res1.size,
          dstSize: res2.size
        };
      });
      const srcSize = nx.sum(items, 'srcSize');
      const dstSize = nx.sum(items, 'dstSize');
      // todo: maybe a package.
      const rate = (100 * (srcSize - dstSize)) / srcSize;
      return { items, rate };
    }
  }
});
