const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const markdownIt = require('markdown-it');

const mdOptions = {
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
};

const pathToInt = path => {
  const ints = path.match(/\d+/g);
  const folderValue = parseInt(ints.shift(), 10);
  const fileValue = parseInt(ints.shift(), 10);
  const pathInt = fileValue + folderValue * 1000;

  return pathInt;
};

module.exports = eleventyConfig => {
  eleventyConfig.addCollection('slides', collection => {
    return collection
      .getAll()
      .filter(({ inputPath }) => {
        return inputPath.match(/^\.\/src\/slides/) !== null
      })
      .sort((a, b) => {
        return pathToInt(a.inputPath) < pathToInt(b.inputPath) ? -1 : 1;
      });
  });

  eleventyConfig.addFilter('data_attrs', attrs => {
    if (!attrs) return;

    if (typeof attrs !== 'object') return;

    if (Object.keys(attrs).length < 1) return;

    const keys = [];

    Object.keys(attrs).map(key => {
      if (key.indexOf('data-') === 0) {
        keys.push(`${key}="${attrs[key]}"`);
      }
    });

    if (keys.length < 1) return;

    return keys.join(' ');
  });

  eleventyConfig.setLibrary('md', markdownIt(mdOptions));
    // .use(markdownItHighlightJS));

  eleventyConfig.addPlugin(syntaxHighlight, {
    templateFormats: ['md', 'html']
  });

  eleventyConfig.addPassthroughCopy({
    './node_modules/reveal.js/dist/': 'reveal',
  });
  eleventyConfig.addPassthroughCopy('src/images');
  eleventyConfig.addPassthroughCopy('src/webfonts');

  eleventyConfig.addWatchTarget('./src/_includes/theme/**/*.scss');

  return {
    templateFormats: [
      'liquid',
      'md',
      'html',
      '11ty.js'
    ],
    dir: {
      input: './src'
    }
  };
};
