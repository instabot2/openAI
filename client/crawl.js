import Parser from 'rss-parser';
const parser = new Parser();

export async function getCrawlData() {
  try {
    const feed = await parser.parseURL('https://news.google.com/rss');
    if (feed && feed.items) {
      return feed.items;
    } else {
      throw new Error('Invalid feed or missing items');
    }
  } catch (err) {
    console.error(`Error fetching crawl data: ${err}`);
    alert('An error occurred while fetching crawl data. Please try again later.');
    return [];
  }
}
