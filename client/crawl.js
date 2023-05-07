const Parser = require('rss-parser');
const parser = new Parser();

// Define the getCrawlData function
function getCrawlData(feedData, userInput) {
  // do something with the feed data and user input
  console.log(`Search results for "${userInput}":`, feedData);
}

(async () => {
  try {
    // Get today's date
    const today = new Date();
    const date = today.getDate();
    const month = today.getMonth() + 1; // January is 0
    const year = today.getFullYear();
    const formattedDate = `${year}-${month}-${date}`;

    // RSS feed URL
    const rssUrl = 'https://news.google.com/rss';

    // Get user input from the data object
    const userInput = `market news ${formattedDate}`;

    // Log the URL to the console
    console.log(`Fetching RSS feed from ${rssUrl}?q=${userInput}`);

    // Parse the RSS feed
    const feed = await parser.parseURL(`${rssUrl}?q=${userInput}`);

    // Pass the RSS feed data and user input to the getCrawlData function
    getCrawlData(feed, userInput);
  } catch (err) {
    console.error('There was an error fetching or parsing the RSS feed:', err);
  }
})();
