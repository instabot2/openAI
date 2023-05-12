const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('4c7b3dd6ff024a2a878f173ef2391f2f');

async function getFeed(searchQuery) {
  const options = {
    q: searchQuery,
    sources: 'bbc-news,the-verge',
    category: 'business',
    language: 'en',
    country: 'us'
  };

  try {
    const response = await newsapi.v2.topHeadlines(options);
    console.log(response);
    return response.articles;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}
