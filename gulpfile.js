let preprocessor = 'sass', // Preprocessor (sass, less, styl); 'sass' also work with the Scss syntax in blocks/ folder.
		fileswatch   = 'html,htm,txt,json,md,woff2' // List of files extensions for watching & hard reload

const { src, dest, parallel, series, watch } = require('gulp');
const browserSync  = require('browser-sync').create();
const bssi         = require('browsersync-ssi');
const ssi          = require('ssi');
const webpack      = require('webpack-stream');
const sass         = require('gulp-sass');
const sassglob     = require('gulp-sass-glob');
const less         = require('gulp-less');
const lessglob     = require('gulp-less-glob');
const styl         = require('gulp-stylus');
const stylglob     = require('gulp-empty');
const cleancss     = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const rename       = require('gulp-rename');
const imagemin     = require('gulp-imagemin');
const newer        = require('gulp-newer');
const rsync        = require('gulp-rsync');
const del          = require('del');
const sourcemaps 	 = require('gulp-sourcemaps');
const notify 			 = require('gulp-notify');
const ttf2woff2 	 = require('gulp-ttf2woff2');
const fs 					 = require('fs');
const uglify 			 = require('gulp-uglify-es').default;
const gutil 			 = require('gulp-util');
const ftp          = require('vinyl-ftp');

function browsersync() {
	browserSync.init({
		server: {
			baseDir: 'app/',
			middleware: bssi({ baseDir: 'app/', ext: '.html' })
		},
		ghostMode: { clicks: false },
		notify: false,
		online: true,
		// tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
	})
}

const fonts = () => {
  return src('./app/fonts/src/**.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('./app/fonts/dist/'));
}

function scripts() {
	return src(['app/js/*.js', '!app/js/*.min.js'])
		.pipe(webpack({
			mode: 'de',
			performance: { hints: false },
			optimization: { minimize: false },
			module: {
				rules: [
					{
						test: /\.(js)$/,
						exclude: /(node_modules)/,
						loader: 'babel-loader',
						query: {
							presets: ['@babel/env'],
							plugins: ['babel-plugin-root-import']
						}
					}
				]
			}
		})).on('error', function handleError() {
			this.emit('end');
		})

    .pipe(sourcemaps.init())
		// .pipe(uglify({
		// 	// https://github.com/mishoo/UglifyJS#mangle-options
		// 	mangle: {
		// 			toplevel: false
		// 	},
		// 	// https://github.com/mishoo/UglifyJS#output-options
		// 	output: {
		// 			beautify: true,
		// 			comments: true,
		// 			preamble: "/* Licensing info */"
		// 	}
		// }).on("error", notify.onError()))
		// .pipe(uglify({
		// 	// https://github.com/mishoo/UglifyJS#mangle-options
		// 	mangle: {
		// 			toplevel: true
		// 	},
		// 	// https://github.com/mishoo/UglifyJS#output-options
		// 	output: {
		// 			beautify: false,
		// 			comments: false,
		// 			preamble: "/* Licensing info */"
		// 	}
		// }).on("error", notify.onError()))
		.pipe(rename('main.min.js'))
    .pipe(sourcemaps.write('.'))
		.pipe(dest('app/js'))
		.pipe(browserSync.stream());
}

function styles() {
	return src([`app/styles/${preprocessor}/*.*`, `!app/styles/${preprocessor}/_*.*`])
		.pipe(sourcemaps.init())
		.pipe(eval(`${preprocessor}glob`)())
		.pipe(eval(preprocessor)()).on("error", notify.onError())
		.pipe(autoprefixer({ overrideBrowserslist: ['last 5 versions'], grid: true, cascade: false }))
		.pipe(cleancss({ level: { 2: { specialComments: 0 } }, /* format: 'beautify' */ }))
		.pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.write('.'))
		.pipe(dest('app/css'))
		.pipe(browserSync.stream())
}

function images() {
	return src(['app/images/src/**/*'])
		.pipe(newer('app/images/dist'))
		.pipe(imagemin())
		.pipe(dest('app/images/dist'))
		.pipe(browserSync.stream())
}

function buildcopy() {
	return src([
		'{app/js,app/css}/*.min.*',
		'app/images/**/*.*',
		'!app/images/src/**/*',
		'!app/css/*.map',
		'!app/js/*.map',
		'app/fonts/**/*',
		'!app/fonts/src/*',
		'app/resources/**/*'
	], { base: 'app/' })
	.pipe(dest('dist'))
}

async function buildhtml() {
	let includes = new ssi('app/', 'dist/', '/**/*.html')
	includes.compile()
	del('dist/parts', { force: true })
	del('dist/fonts/src', { force: true })
}

function cleandist() {
	return del('dist/**/*', { force: true })
}

// deploy SFTP
function deploySftp() {
	return src('dist/')
		.pipe(rsync({
			root: 'dist/',
			hostname: 'username@yousite.com',
			destination: 'yousite/public_html/',
			include: [/* '*.htaccess' */], // Included files to deploy,
			exclude: [ '**/Thumbs.db', '**/*.DS_Store' ],
			recursive: true,
			archive: true,
			silent: false,
			compress: true
		}))
}

// deploy FTP
const deploy = () => {
  let conn = ftp.create({
    host: '',
    user: '',
    password: '',
    parallel: 10,
    log: gutil.log
  });

  let globs = [
		'dist/**'
  ];

  return src(globs, {
      // base: '.',
      buffer: false
    })
   .pipe(conn.newer('/public_html')) // only upload newer files
   .pipe(conn.dest('/public_html'));
}


function startwatch() {
	watch(`app/styles/${preprocessor}/**/*`, { usePolling: true }, styles)
	watch(['app/js/**/*.js', '!app/js/**/*.min.js'], { usePolling: true }, scripts)
	watch('app/images/src/**/*.{jpg,jpeg,png,webp,svg,gif}', { usePolling: true }, images)
	watch(`app/**/*.{${fileswatch}}`, { usePolling: true }).on('change', browserSync.reload)
}

exports.scripts = scripts;
exports.styles  = styles;
exports.images  = images;
exports.fonts   = fonts;
exports.deploy  = deploy;
exports.deploySftp = deploySftp;
exports.assets  = series(scripts, styles, images);
exports.build   = series(cleandist, scripts, styles, images, buildcopy, buildhtml);
exports.default = series(scripts, styles, images, parallel(browsersync, startwatch));
