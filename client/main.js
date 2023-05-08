// Import the fetchRSSFeed function from rss.js
import { fetchRSSFeed } from './rss.js';

// Define a function to render the RSS feed data in the DOM
function renderRSSFeed(feed) {
  // Get a reference to the container element in the DOM
  const container = document.querySelector('.rss-container');

  // Clear any existing content in the container
  container.innerHTML = '';

  // Create a new element to display the feed title
  const titleEl = document.createElement('h2');
  titleEl.textContent = feed.title;
  container.appendChild(titleEl);

  // Create a new element to display the feed description
  const descriptionEl = document.createElement('p');
  descriptionEl.textContent = feed.description;
  container.appendChild(descriptionEl);

  // Create a new element to display each feed item
  feed.items.forEach(item => {
    const itemEl = document.createElement('div');

    const titleLinkEl = document.createElement('a');
    titleLinkEl.textContent = item.title;
    titleLinkEl.href = item.link;
    titleLinkEl.target = '_blank';
    itemEl.appendChild(titleLinkEl);

    const pubDateEl = document.createElement('p');
    pubDateEl.textContent = item.pubDate;
    itemEl.appendChild(pubDateEl);

    const descriptionEl = document.createElement('p');
    descriptionEl.textContent = item.description;
    itemEl.appendChild(descriptionEl);

    container.appendChild(itemEl);
  });
}

// Prompt the user for a search query
const searchQuery = data.get('prompt');
alert(`Searching for "${searchQuery}" on MSN News RSS feed...`);

// Define the URL of the RSS feed to fetch
const feedUrl = `https://www.msn.com/en-us/news/rss?q=${encodeURIComponent(searchQuery)}`;

// Fetch and parse the RSS feed using the fetchRSSFeed function
fetchRSSFeed(feedUrl)
  .then(feed => {
    // Render the parsed feed data in the DOM
    renderRSSFeed(feed);
  })
  .catch(error => {
    console.error(`Failed to fetch or parse RSS feed: ${error}`);
  });
