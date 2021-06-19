#!/usr/bin/env node
const { Command } = require('commander');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const chalk = require('chalk');
const globby = require('globby');
const Listr = require('listr');

// next packages:
require('@jswork/next');
require('@jswork/next-absolute-package');
require('@jswork/next-safe-assign');
require('@jswork/next-filesize');
require('@jswork/next-sum');

const { version } = nx.absolutePackage();
const program = new Command();
const defaults = require(`${process.env.HOME}/.aric/.imagemin-cli.json`);
const OVERRIDE_OPTIONS = { input: ['*.{jpg,png}'], destination: '.' };
const DEFAULT_STAT = { items: [], rate: 0 };

program.version(version);
program
  .option('-i, --input <list>', 'Your input globs.', (v) => v.split(','))
  .option('-d, --destination <string>', 'Your output dir.')
  .option('-o, --override', 'Use the same input/output override the original file(DANGER).')
  .option('-l, --log', 'Show logger.')
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
      this.config.override && nx.mix(this.config, OVERRIDE_OPTIONS);
      this.files = globby.sync(this.config.input);
      this.originals = this.files.map(nx.filesize);
    },
    async start() {
      const { input, destination } = this.config;
      const tasks = new Listr([
        {
          title: 'step1: compressing...',
          task: (ctx) => {
            return imagemin(input, {
              destination: destination,
              plugins: [
                imageminJpegtran(),
                imageminPngquant({
                  quality: [0.6, 0.8]
                })
              ]
            }).then((res) => (ctx.min = res));
          }
        },
        {
          title: 'step2: stating...',
          task: (ctx) => {
            const res = this.stat(ctx.min);
            ctx.stat = res;
          }
        }
      ]);

      const ctx = await tasks.run();
      this.config.log && console.log(ctx.stat);
      console.log(chalk.green('🚗 minify success.'));
    },
    stat(inResponse) {
      if (!inResponse.length) return DEFAULT_STAT;
      const items = inResponse.map((item, index) => {
        const { sourcePath, destinationPath } = item;
        const res2 = nx.filesize(item.destinationPath);
        return {
          sourcePath,
          destinationPath,
          srcSize: this.originals[index].size,
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
