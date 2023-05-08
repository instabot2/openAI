import Parser from 'rss-parser';
const parser = new Parser();

export async function getCrawlData() {
  try {
    const feed = await parser.parseURL('https://news.google.com/rss');
    return feed.items;
  } catch (err) {
    console.error(err);
    return [];
  }
}


