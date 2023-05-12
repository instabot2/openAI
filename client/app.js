const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('4c7b3dd6ff024a2a878f173ef2391f2f');

newsapi.v2.topHeadlines({
  sources: 'bbc-news,the-verge',
  q: 'bitcoin',
  category: 'business',
  language: 'en',
  country: 'us'
}).then(response => {
  const articles = response.articles;

  // Create HTML string to render articles
  const articleHTML = articles.map(article => {
    return `
      <div>
        <h2>${article.title}</h2>
        <p>${article.description}</p>
        <a href="${article.url}">Read more</a>
      </div>
    `;
  }).join('');

  // Render articles to the news-container div
  const newsContainer = document.getElementById('news-container');
  newsContainer.innerHTML = articleHTML;
}).catch(error => {
  console.log(error);
});
