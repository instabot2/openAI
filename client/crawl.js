import axios from 'axios';
// Function to crawl data with a time limit
async function crawlData(prompt, page, timeout) {
  try {
    const searchDomain = 'google.com';
    const url = `http://index.commoncrawl.org/CC-MAIN-2023-index?url=*.${searchDomain}&output=json&page=${page}`;
    const response = await axios.get(url);
    const data = response.data.split('\n').slice(0, -1);
    const searchResults = await Promise.all(data.map(async (result) => {
      const resultObj = JSON.parse(result);
      const searchData = {
        title: resultObj.title,
        link: resultObj.link,
        description: resultObj.description,
      };
      // Perform additional processing or data retrieval for each search result
      // You can make additional async requests or perform computationally intensive tasks here
      return searchData;
    }));
    console.log('Search Results:', searchResults);
    window.alert(`Search Results:\n\n${JSON.stringify(searchResults, null, 2)}`); 
    return searchResults;
  } catch (error) {
    console.error('Error crawling data:', error);
    window.alert('An error occurred while crawling data.');
    return null; // Handle error cases appropriately
  }
}

// Call crawlData function
const prompt = data.get('prompt');
const page = 1;
const timeout = 5000; // Timeout in milliseconds (e.g., 5000 for 5 seconds)
const searchResultsPromise = crawlData(prompt, page, timeout);
const timeoutPromise = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('Timeout occurred while crawling data.');
  }, timeout);
});
try {
  const searchResults = await Promise.race([searchResultsPromise, timeoutPromise]);
  if (searchResults) {
    console.log('Search results:', searchResults);
    window.alert(`Search Results:\n\n${JSON.stringify(searchResults, null, 2)}`);
    // Handle the search results as needed
  } else {
    console.log('An error occurred or the crawl timed out.');
    window.alert('An error occurred or the crawl timed out.');
  }
} catch (error) {
  console.error('Error while crawling data:', error);
  window.alert('An error occurred while crawling data.');
}

