(function () {
  'use strict';

  const gulp = require('gulp');
  const exec = require('child_process').execSync;
  const pkg = nx.absolutePackage();
  const cmd = nx.getKey(pkg.bin, 'bin/index.js')
  const $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*', 'del', '@jswork/gulp-*']
  });

  const usage = exec(`${cmd} -h`).toString().trim();


  gulp.task('docs', function () {
    return gulp
      .src('docs/template.md')
      .pipe($.replace('__USAGE__', usage))
      .pipe(
        $.rename(function (path) {
          path.dirname = '..';
          path.basename = 'README';
          return path;
        })
      )
      .pipe(gulp.dest('dist'));
  });
})();
