const today = new Date();
const date = today.getDate();
const month = today.getMonth() + 1; // January is 0
const year = today.getFullYear();
const formattedDate = `${month}/${date}/${year}`;
console.log(formattedDate);
//alert(`Today's date is ${formattedDate}`);


// RSS feed URL
const rssUrl = 'https://news.google.com/rss';

// Get user input from the data object
//const userInput = data.get('prompt');
const userInput = `market news ${formattedDate}`;

// Log the URL to the console
console.log(`Fetching RSS feed from ${rssUrl}?q=${userInput}`);

// Fetch the RSS feed
fetch(`${rssUrl}?q=${userInput}`)
  .then(response => response.text())
  .then(data => {
    // Parse the RSS feed data
    const parser = new DOMParser();
    const xml = parser.parseFromString(data, 'application/xml');
    const items = xml.querySelectorAll('item');
    const feedData = {
      title: xml.querySelector('title').textContent,
      description: xml.querySelector('description').textContent,
      link: xml.querySelector('link').textContent,
      items: [],
    };
    // Extract data for each item in the RSS feed
    items.forEach(item => {
      const itemData = {
        title: item.querySelector('title').textContent,
        link: item.querySelector('link').textContent,
        description: item.querySelector('description').textContent,
        pubDate: item.querySelector('pubDate').textContent,
      };
      feedData.items.push(itemData);
    });
    // Pass the RSS feed data and user input to the getCrawlData function
    getCrawlData(feedData, userInput);
  })
  .catch(error => {
    console.error('There was an error fetching the RSS feed. Please try again later.', error);
    alert(`Error fetching RSS feed: ${error}`);
  });

// Define the getCrawlData function
function getCrawlData(feedData, userInput) {
  // do something with the feed data and user input
  console.log(`Search results for "${userInput}":`, feedData);
}

// Export the getCrawlData function
module.exports = { getCrawlData };
