'use strict';

var gulp = require('gulp'),
    livereload = require('gulp-livereload'),
    http = require('http'),
    st = require('st'),
    argv = require('yargs').argv;

var paths = {
  appPath: 'app',
  index:'index.html',
  simpleCanvas:'canvas.html'
};

gulp.task('reload-js', function(){
  gulp.src(paths.appPath + '/*.js')
    .pipe(livereload());
});

gulp.task('reload-index', function(){
  gulp.src(paths.index)
    .pipe(livereload());
});

gulp.task('reload-canvas', function(){
  gulp.src(paths.simpleCanvas)
    .pipe(livereload());
});

gulp.task('watch', ['server'], function() {
  livereload.listen();
  gulp.watch(paths.appPath + '/*.js', ['reload-js']);
  gulp.watch(paths.index, ['reload-index']);
});

gulp.task('watch-canvas', ['server'], function() {
  livereload.listen();
  gulp.watch(paths.simpleCanvas, ['reload-canvas']);
});

gulp.task('server', function(done) {
  var startPath = getStartPath();
  
  console.log("starting server with index: " + startPath);
  
  http.createServer(
    st({ path: __dirname, index: startPath, cache: false })
  ).listen(8080, done);
});

function getStartPath(){
  return paths[argv.startPath || 'index']; 
}