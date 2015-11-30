'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var prefix = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');

// we'd need a slight delay to reload browsers
// connected to browser-sync after restarting nodemon
var BROWSER_SYNC_RELOAD_DELAY = 500;

gulp.task('nodemon', function (cb) {
  var called = false;
  return nodemon({

    // nodemon our expressjs server
    script: 'app.js',

    // watch core server file(s) that require server restart on change
    watch: [
      'app.js',
      'models/*.js',
      'routes/*.js',
      'lib/*.js'
    ]
  })
    .on('start', function onStart() {
      // ensure start only got called once
      if (!called) { cb(); }
      called = true;
    })
    .on('restart', function onRestart() {
      // reload connected browsers after a slight delay
      setTimeout(function reload() {
        browserSync.reload({
          stream: false
        });
      }, BROWSER_SYNC_RELOAD_DELAY);
    });
});

gulp.task('browser-sync', ['nodemon'], function () {

  // for more browser-sync config options: http://www.browsersync.io/docs/options/
  browserSync({

    // informs browser-sync to proxy our expressjs app which would run at the following location
    proxy: 'http://localhost:3000',

    // informs browser-sync to use the following port for the proxied app
    // notice that the default port is 3000, which would clash with our expressjs
    port: 4020,

    // open the proxied app in chrome
    browser: ['google-chrome']
  });
});

gulp.task('js',  function () {
  return gulp.src('assets/js/**/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('public/javascripts'));
});

gulp.task('sass', function () {
  return gulp.src('assets/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compact'}).on('error', sass.logError))
    .pipe(prefix({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/stylesheets'));
})

gulp.task('css', function() {
  return gulp.src('public/**/*.css')
    .pipe(browserSync.reload({ stream: true }));
})

gulp.task('bs-reload', function () {
  browserSync.reload();
});

gulp.task('default', ['browser-sync'], function () {
  gulp.watch('assets/scss/**/*.scss', ['sass']);
  gulp.watch('assets/js/**/*.js', ['js']);
  gulp.watch('public/**/*.js',   [browserSync.reload]);
  gulp.watch('public/**/*.css',  ['css']);
  gulp.watch('views/**/*.jade', ['bs-reload']);
});
