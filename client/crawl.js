const Parser = require('rss-parser');
const parser = new Parser();

(async () => {
  try {
    // Parse the RSS feed
    const feed = await parser.parseURL('https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml');

    // Log the title of the RSS feed
    console.log(`Title: ${feed.title}`);

    // Log the title and link of each item in the RSS feed
    feed.items.forEach(item => {
      console.log(`${item.title}: ${item.link}`);
    });
  } catch (err) {
    console.error('There was an error fetching or parsing the RSS feed:', err);
  }
})();
