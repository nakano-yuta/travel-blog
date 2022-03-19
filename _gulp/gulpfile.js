//----------------------------------------------------------------------
//  モード
//----------------------------------------------------------------------

"use strict";

//----------------------------------------------------------------------
//  モジュール読み込み
//----------------------------------------------------------------------

const gulp = require("gulp"); // gulp本体
const del = require("del"); // ファイルとフォルダの削除
const sass = require("gulp-sass")(require("sass")); // DartSass
const postcss = require("gulp-postcss"); // autoprefixerなどを使うためのポストプロセッサー
const autoprefixer = require("autoprefixer"); // ベンダープレフィックスの自動付与
const cssSorter = require("css-declaration-sorter"); // プロパティ順をソート
const mmq = require("gulp-merge-media-queries"); // メディアクエリをまとめる
const browserSync = require("browser-sync"); // サーバー立ち上げ・ブラウザリロード
const cleanCss = require("gulp-clean-css"); // cssを圧縮
const uglify = require("gulp-uglify"); // JavaScriptを圧縮
const rename = require("gulp-rename"); // ファイル名の書き換え
const htmlBeautify = require("gulp-html-beautify"); // htmlの整形
const plumber = require("gulp-plumber"); // エラーによる停止を防ぐ
const notify = require("gulp-notify"); // エラー通知・デスクトップ通知を行う
const header = require("gulp-header"); // コンパイル後のファイルの先頭に任意の記述を挿入する
const replace = require("gulp-replace"); // 任意の文字列を置換することができる

//----------------------------------------------------------------------
//  ディレクトリ管理
//----------------------------------------------------------------------

const basePath = {
  src: "../_src",
  dest: "../_public"
}

const srcPath = {
  all: basePath.src + "/**/*",
  html: basePath.src + "/**/*.html",
  // php: basePath.src + "/**/*.php",
  scss: basePath.src + "/assets/scss/**/*.scss",
  css: basePath.src + "/assets/css/**/*.css",
  js: basePath.src + "/assets/js/**/*.js",
  img: basePath.src + "/assets/img/**/*",
  font: basePath.src + "/assets/font/**/*",
};

const destPath = {
  all: basePath.dest + "/**/*",
  base: basePath.dest + "/",
  css: basePath.dest + "/assets/css/",
  js: basePath.dest + "/assets/js/",
  img: basePath.dest + "/assets/img/",
  font: basePath.dest + "/assets/font/",
};

//----------------------------------------------------------------------
//  関数定義
//----------------------------------------------------------------------

// sass -> css へのコンパイル・圧縮
function compileSass() {
  return gulp
    .src(srcPath.scss)
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(sass())
    .pipe(postcss([autoprefixer(), cssSorter()]))
    .pipe(mmq())
    .pipe(replace(/@charset "UTF-8";/g, '')) // デフォルトで挿入される @carset の記述を削除
    .pipe(header('@charset "UTF-8";\n\n')) // 改めて @carset の記述を挿入
    .pipe(gulp.dest(destPath.css))
    .pipe(cleanCss())
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(gulp.dest(destPath.css));
}

// jsファイルの圧縮・コピー
function minJs() {
  return gulp
    .src(srcPath.js)
    .pipe(gulp.dest(destPath.js))
    .pipe(uglify())
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(gulp.dest(destPath.js));
}

// htmlファイルのフォーマット
function formatHTML() {
  return gulp
    .src(srcPath.html)
    .pipe(
      htmlBeautify({
        indent_size: 2,
        indent_with_tabs: true,
      })
    )
    .pipe(gulp.dest(destPath.base));
}

// 画像ファイルを _src -> _public にコピー
function copyImage() {
  return gulp.src(srcPath.img).pipe(gulp.dest(destPath.img));
}

// cssファイルを _src -> _public にコピー
function copyCss() {
  return gulp.src(srcPath.css).pipe(gulp.dest(destPath.css));
}

// fontフォルダを _src -> _public にコピー
function copyFont() {
  return gulp.src(srcPath.font).pipe(gulp.dest(destPath.font));
}

// サーバーの立ち上げ
function browserInit(done) {
  browserSync.init({
    server: {
      baseDir: destPath.base,
    },
    // proxy: ""
  });
  done();
}

// 立ち上げたサーバーのリロード
function browserReload(done) {
  browserSync.reload();
  done();
}

// _publicフォルダの中身を全て削除
function clean() {
  return del([destPath.all], { force: true });
}

function watch(done) {
  gulp.watch(srcPath.html, gulp.series(formatHTML, browserReload));
  gulp.watch(srcPath.scss, gulp.series(compileSass, browserReload));
  gulp.watch(srcPath.js, gulp.series(minJs, browserReload));
  gulp.watch(srcPath.img, gulp.series(copyImage, browserReload));
  gulp.watch(srcPath.font, gulp.series(copyFont, browserReload));
  // gulp.watch(srcPath.php, browserReload);
  done();
}

//----------------------------------------------------------------------
//  タスク定義
//----------------------------------------------------------------------

exports.default = gulp.series(
  clean,
  gulp.parallel(formatHTML, minJs, compileSass, copyImage, copyCss, copyFont),
  gulp.parallel(browserInit, watch)
);

exports.compile = compileSass;
exports.clean = clean;