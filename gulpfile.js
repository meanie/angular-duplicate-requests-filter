'use strict';

/**
 * Dependencies
 */
const fs = require('fs');
const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const filter = require('gulp-filter');
const wrapper = require('gulp-wrapper');
const sourcemaps = require('gulp-sourcemaps');
const ngAnnotate = require('gulp-ng-annotate');

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
    filename = pkg.name.replace('@meanie/', '');
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
  const today = new Date();
  const author = pkg.author.name + ' <' + pkg.author.email + '>';

  //Format banner
  const banner =
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
  const jsFilter = filter(['*.js'], {
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
