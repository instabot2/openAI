// rss.js
const Parser = require('rss-parser');
const parser = new Parser();

async function getFeed() {
  const feed = await parser.parseURL('https://www.msn.com/en-us/news/rss');
  return feed.items;
}

module.exports = getFeed;
