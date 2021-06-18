(function () {
  'use strict';

  const gulp = require('gulp');
  const fs = require('fs');

  require("@jswork/next");
  require('@jswork/next-absolute-package');
  require('@jswork/next-get-key');

  //import
  fs.readdirSync('./build').map(function (file) {
    require('./build/' + file);
  });

  gulp.task('default', gulp.series(['clean', 'docs']));
})();
