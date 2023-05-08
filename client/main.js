import { fetchRSSFeed } from './rss.js';

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

async function fetchAndRenderRSSFeed(searchQuery) {
  alert(`Searching for "${searchQuery}" on MSN News RSS feed...`);

  const feedUrl = `https://www.msn.com/en-us/news/rss?q=${encodeURIComponent(searchQuery)}`;

  try {
    const feed = await fetchRSSFeed(feedUrl);
    renderRSSFeed(feed);
  } catch (error) {
    console.error(`Failed to fetch or parse RSS feed: ${error}`);
  }
}
