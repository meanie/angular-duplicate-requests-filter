'use strict';

/**
 * Dependencies
 */
let fs = require('fs');
let gulp = require('gulp');
let babel = require('gulp-babel');
let concat = require('gulp-concat');
let uglify = require('gulp-uglify');
let rename = require('gulp-rename');
let filter = require('gulp-filter');
let wrapper = require('gulp-wrapper');
let sourcemaps = require('gulp-sourcemaps');
let ngAnnotate = require('gulp-ng-annotate');

/**
 * Package and configuration
 */
let pkg = require('./package.json');

/*****************************************************************************
 * Helpers
 ***/

/**
 * Get package JSON directly from file system
 */
function packageJson() {
  return (pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8')));
}

/**
 * Get package file name
 */
function packageFileName(filename, ext) {
  if (!ext) {
    ext = filename;
    filename = pkg.name.toLowerCase();
  }
  return filename + (ext || '');
}

/**
 * Generate angular wrapper for module files
 */
function angularWrapper() {
  return {
    header: '(function(window, angular, undefined) {\'use strict\';\n',
    footer: '\n})(window, window.angular);\n',
  };
}

/**
 * Generate banner wrapper for compiled files
 */
function bannerWrapper() {

  //Refresh package JSON
  packageJson();

  //Get date and author
  let today = new Date();
  let author = pkg.author.name + ' <' + pkg.author.email + '>';

  //Format banner
  let banner =
    '/**\n' +
    ' * ' + pkg.name +
    ' * ' + pkg.homepage + '\n' +
    ' *\n' +
    ' * Copyright (c) ' + today.getFullYear() + ' ' + author + '\n' +
    ' * License: MIT\n' +
    ' */\n';

  //Return wrapper
  return {
    header: banner,
    footer: '',
  };
}

/*****************************************************************************
 * Release task
 ***/

/**
 * Build release files
 */
function release() {
  let jsFilter = filter(['*.js'], {
    restore: true,
  });
  return gulp.src([
    'src/**/*.js',
  ])
    .pipe(wrapper(angularWrapper()))
    .pipe(sourcemaps.init())
      .pipe(babel({
        compact: false,
      }))
      .pipe(ngAnnotate({
        single_quotes: true,
      }))
      .pipe(concat(packageFileName('.js')))
      .pipe(wrapper(bannerWrapper()))
      .pipe(gulp.dest('release'))
      .pipe(rename(packageFileName('.min.js')))
      .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(jsFilter)
    .pipe(wrapper(bannerWrapper()))
    .pipe(jsFilter.restore)
    .pipe(gulp.dest('release'));
}

/**
 * Build a release version
 */
gulp.task('release', release);
gulp.task('default', release);
