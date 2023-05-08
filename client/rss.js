// Import the rss-parser library
import Parser from 'rss-parser';

// Define a function to fetch and parse an RSS feed
export async function fetchRSSFeed(url) {
  // Initialize a new instance of the Parser class
  const parser = new Parser();

  try {
    // Use the parser to fetch and parse the RSS feed
    const feed = await parser.parseURL(url);

    // Extract the relevant data from each item in the feed
    const items = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      description: item.contentSnippet || item.description || '',
      pubDate: item.pubDate,
    }));

    // Return the parsed data
    return {
      title: feed.title,
      description: feed.description,
      items,
    };
  } catch (error) {
    console.error(`Failed to fetch or parse RSS feed at ${url}: ${error}`);
    return null;
  }
}
