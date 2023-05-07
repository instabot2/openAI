import axios from 'axios';

// Function to crawl data with a time limit
async function crawlData(prompt, page, timeout) {
  try {
    const searchDomain = 'msn.com';
    const url = `https://www.bing.com/search?q=${prompt}&first=${(page-1)*10}`;
    const response = await axios.get(url);
    const searchResults = response.data.match(/<h2><a href="(.*?)"/g).map((val) => {
      let result = {};
      let temp = val.split('"');
      result.link = temp[1];
      result.title = temp[2].substring(temp[2].indexOf('>') + 1, temp[2].lastIndexOf('<'));
      result.description = temp[3];
      return result;
    });
    console.log('Search Results:', searchResults);
    //window.alert(`Search Results:\n\n${JSON.stringify(searchResults, null, 2)}`);
    return searchResults;
  } catch (error) {
    console.error('Error crawling data:', error);
    if (error.response && error.response.status === 404) {
      window.alert('Page not found!');
    } else if (error.code === 'ECONNABORTED') {
      window.alert('Request timed out!');
    } else {
      //window.alert(`An error occurred while crawling data: ${error.message}`);
    }  
    return null; // Handle error cases appropriately
  }
}

// Define a function to get the search results
async function getCrawlData(prompt, timeout) {
  //window.alert(`Search Input:\n\n${JSON.stringify(prompt, null, 2)}`);
  const page = 1;
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
      //window.alert(`Search Results:\n\n${JSON.stringify(searchResults, null, 2)}`);
      // Handle the search results as needed
      return searchResults;
    } else {
      console.log('An error occurred or the crawl timed out.');
      //window.alert('An error occurred or the crawl timed out.');
      return null;
    }
  } catch (error) {
    console.error('Error while crawling data:', error);
    //window.alert('An error occurred while crawling data.');
    return null;
  }
}

// Export the getCrawlData function
export { getCrawlData };


//const url = `http://index.commoncrawl.org/CC-MAIN-2023-index?url=*.${searchDomain}&output=json&page=${page}`;

