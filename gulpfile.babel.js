import { dest, series, src, task, watch } from 'gulp'
import yargs from 'yargs'
import del from 'del'
import fm from 'front-matter'
import { readdirSync, readFileSync, statSync } from 'fs'
import glob from 'glob'
import { join, basename, extname } from 'path'
import webpack from 'webpack-stream'
import gulpif from 'gulp-if'
import imagemin from 'gulp-imagemin'
import standard from 'gulp-standard'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import rename from 'gulp-rename'
import replace from 'gulp-replace'
import sass from 'gulp-sass'
import sassLint from 'gulp-sass-lint'
import postcss from 'gulp-postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import sorter from 'css-declaration-sorter'
import typeset from 'typeset'

let browserSync = require('browser-sync').create()
let { reload } = browserSync
let md = require('markdown-it')({
  html: true
})

const revealDefaults = {
  title: 'A Reveal.js Slide Deck',
  description: 'Slides made with Reveal.js'
}

import config from './.reveal.config'

let {
  title,
  description,
  colophonImage,
  colophonAlt,
  colophonURL,
  colophonShortURL
} = {
  ...revealDefaults,
  ...require('./package.json'),
  ...config
}

let { exec } = require('child_process')

/**
 * Set up prod/dev tasks
 */
const PROD = !(yargs.argv.dev)

/**
 * Set up file paths
 */
const _srcDir = `./src`
const _distDir = `./docs`
const _devDir = `./dev`
const _buildDir = PROD ? _distDir : _devDir

/**
 * Error notification settings
 */
const errorAlert = err => {
  let _notifyOpts = {
    title: 'Gulp <%= error.name %>: <%= error.plugin %>',
    message: '<%= error.stack %>',
    sound: 'Basso'
  }
  notify.onError(_notifyOpts)(err)
}

/**
 * Clean the dist/dev directories
 */
task('clean', () => del(_buildDir))

/**
 * Lints the gulpfile for errors
 */
task('lint:gulpfile', () => {
  return src('gulpfile.*')
    .pipe(standard())
    .pipe(standard.reporter('default'))
    .on('error', errorAlert)
})

/**
 * Lints the source js files for errors
 */
task('lint:js', () => {
  let _src = [
    `${_srcDir}/js/**/*.js`,
    '!**/libs/**/*.js'
  ]

  return src(_src)
    .pipe(standard())
    .pipe(standard.reporter('default'))
    .on('error', errorAlert)
})

/**
 * Lint the Sass
 */
task('lint:sass', () => {
  return src(`${_srcDir}/scss/**/*.scss`)
    .pipe(sassLint({
      'merge-default-rules': true
    }))
    .pipe(sassLint.format())
})

/**
 * Lints all the js files for errors
 */
task('lint', series('lint:gulpfile', 'lint:js', 'lint:sass', cb => cb()))

/*
 * Fixes standardJS errors in Gulpfile
 */
task('standard:gulpfile', () => exec('standard --fix gulpfile.*'))

/*
 * Fixes standardJS errors in JS files
 */
task('standard:js', () => exec(`standard --fix ${_srcDir}/js/**/*.js`))

/**
 * Fixes all the JS files with standardJS
 */
task('standard', series('standard:gulpfile', 'standard:js', cb => cb()))

/**
 * Concatenates, minifies and renames the source JS files for dist/dev
 */
task('scripts', () => {
  return src(`${_srcDir}/js/index.js`)
    .pipe(plumber({ errorHandler: errorAlert }))
    .pipe(webpack({
      entry: `${_srcDir}/js/index.js`,
      output: {
        filename: `index.js`
      },
      mode: PROD ? 'production' : 'development',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true
              }
            }
          }
        ]
      },
      performance: {
        hints: false
     }
    }))
    .pipe(gulpif(PROD, rename({ suffix: '.min' })))
    .pipe(dest(_buildDir))
    .pipe(reload({ stream: true }))
    .on('error', errorAlert)
    .pipe(
      notify({
        message: `${PROD ? 'Prod' : 'Dev'} scripts have been transpiled${PROD ? ' and minified' : ''}`,
        onLast: true
      })
    )
})

/**
 * Compiles and compresses the source Sass files for dist/dev
 */
task('styles', () => {
  const _sassOpts = {
    outputStyle: 'expanded',
    sourceComments: !PROD,
    includePaths: ['./node_modules/reveal.js/']
  }

  const _postcssOpts = [
    sorter({ order: 'smacss' }),
    autoprefixer()
  ]

  if (PROD) _postcssOpts.push(cssnano())

  src(`./node_modules/reveal.js/`)
    .pipe(dest(_buildDir))

  return src(`${_srcDir}/scss/style.scss`)
    .pipe(plumber({ errorHandler: errorAlert }))
    .pipe(sass(_sassOpts))
    .pipe(gulpif(PROD, rename({ suffix: '.min' })))
    .pipe(postcss(_postcssOpts))
    .pipe(dest(_buildDir))
    .pipe(reload({ stream: true }))
    .on('error', errorAlert)
    .pipe(
      notify({
        message: `${PROD ? 'Prod' : 'Dev'} styles have been compiled${PROD ? ' and minified' : ''}`,
        onLast: true
      })
    )
})

const jsonToAttrs = json => {
  let attrs = []
  for (let k in json) {
    attrs.push(`${k}="${json[k]}"`)
  }
  return attrs.join(' ')
}

const sectionize = file => `<section data-filename="${file.fileName}" ${jsonToAttrs(file.attributes)}>${file.body}</section>`

const filename = file => basename(file, extname(file))

const fileContents = file => {
  const ext = extname(file)
  const contents = readFileSync(file).toString()
  let fileContents

  const { attributes, body } = fm(contents)

  fileContents = {
    fileName: filename(file),
    attributes: attributes,
    body: md.render(body)
  }

  return fileContents
}

const dirToContent = dir => {
  let content = ''
  let contents = readdirSync(dir).sort((a, b) => {
    return parseInt(filename(a)) < parseInt(filename(b)) ? -1 : 1
  })

  for (let c of contents) {
    c = join(dir, c)

    if (statSync(c).isFile()) {
      content += sectionize(fileContents(c))
    } else if (statSync(c).isDirectory()) {
      content += sectionize({body: dirToContent(c)})
    }
  }

  return typeset(content)
}

/**
 * Compiles slide files to index.html
 */
task('content', () => {
  let content = dirToContent(`${_srcDir}/content/`)

  return src('./index.html')
    .pipe(replace(/{{slides}}/, content))
    .pipe(replace(/{{title}}/gi, title))
    .pipe(replace(/{{description}}/gi, description))
    .pipe(replace(/{{colophonImage}}/, colophonImage))
    .pipe(replace(/{{colophonAlt}}/, colophonAlt))
    .pipe(replace(/{{colophonURL}}/, colophonURL))
    .pipe(replace(/{{colophonShortURL}}/, colophonShortURL))
    .pipe(replace(/<li>/gi, '<li class="fragment">'))
    .pipe(gulpif(PROD, replace(/style.css/, 'style.min.css')))
    .pipe(gulpif(PROD, replace(/index.js/, 'index.min.js')))
    .pipe(dest(_buildDir))
    .pipe(reload({ stream: true }))
})

/**
 * Copies font files to build dir
 */
task('fonts', () => src(`${_srcDir}/fonts/**/*`)
  .pipe(dest(`${_buildDir}/fonts`))
  .pipe(reload({ stream: true }))
)

/**
 * Copies image files to build dir
 */
task('images', () => src(`${_srcDir}/images/**/*`)
  .pipe(imagemin())
  .pipe(dest(`${_buildDir}/images`))
  .pipe(reload({ stream: true }))
)

/**
 * Builds for distribution (staging or production)
 */
task('build', series('clean', 'fonts', 'images', 'content', 'styles', 'scripts', cb => cb()))

/**
 * Builds assets and reloads the page when any php, html, img or dev files change
 */
task('watch', series('build', () => {
  browserSync.init({
    server: {
      baseDir: _buildDir
    },
    notify: true
  })

  watch(
    `${_srcDir}/images/**/*.{jpg,jpeg,png,svg}`,
    series('images')
  )
  watch(
    `${_srcDir}/scss/**/*`,
    series('styles')
  )
  watch(
    `${_srcDir}/js/**/*`,
    series('scripts')
  )
  watch(
    `${_srcDir}/content/**/*.{html,md,json}`,
    series('content')
  )
  watch(
    './index.html'
  ).on('change', reload)
}))

/**
 * Backup default task just triggers a build
 */
task('default', series('build', cb => cb()))
