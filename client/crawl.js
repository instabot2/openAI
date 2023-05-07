const request = require('request');
const cheerio = require('cheerio');

// Function to crawl data with a time limit
async function crawlData(prompt, page, timeout) {
  try {
    const searchDomain = 'msn.com';
    const url = `https://www.bing.com/search?q=${prompt}&first=${(page-1)*10}`;
    const html = await new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
    const $ = cheerio.load(html);
    const searchResults = [];
    $('li.b_algo').each((i, el) => {
      let result = {};
      result.link = $(el).find('h2 a').attr('href');
      result.title = $(el).find('h2').text().trim();
      result.description = $(el).find('p').text().trim();
      searchResults.push(result);
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
module.exports = { getCrawlData };
