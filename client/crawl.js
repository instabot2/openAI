const Parser = require('rss-parser');

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

// Fetch the RSS feed
const parser = new Parser();
parser.parseURL(`${rssUrl}?q=${userInput}`, (err, feed) => {
  if (err) {
    console.error('There was an error fetching the RSS feed. Please try again later.', err);
    alert(`Error fetching RSS feed: ${err}`);
  } else {
    // Pass the RSS feed data and user input to the getCrawlData function
    getCrawlData(feed, userInput);
  }
});

// Define the getCrawlData function
function getCrawlData(feedData, userInput) {
  // do something with the feed data and user input
  console.log(`Search results for "${userInput}":`, feedData);
}

// Export the getCrawlData function
module.exports = { getCrawlData };
