const Parser = require('rss-parser');
const parser = new Parser();

async function fetchData() {
  const crawlData = await getCrawlData();
  const feed = await parser.parseURL('https://www.reddit.com/.rss');
  console.log(crawlData);
  console.log(feed.title);
  feed.items.forEach(item => {
    console.log(item.title + ':' + item.link);
  });
}

fetchData();
