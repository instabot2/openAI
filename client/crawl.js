function getCrawlData(feedData) {
  // do something with the feed data
  console.log(feedData);
}

// RSS feed URL
const rssUrl = 'https://news.google.com/rss';

// Fetch the RSS feed
fetch(rssUrl)
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
    // Pass the RSS feed data to the getCrawlData function
    getCrawlData(feedData);
  })
  .catch(error => {
    console.error('Error fetching RSS feed:', error);
  });

// Export the getCrawlData function
module.exports = { getCrawlData };
