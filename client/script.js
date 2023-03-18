const axios = require('axios').default;

const API_KEY = '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';
const prompt = 'Hello, my name is';
const model = 'text-davinci-002';

axios({
    method: 'post',
    url: 'https://api.openai.com/v1/completions',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    },
    data: {
        'model': model,
        'prompt': prompt,
        'temperature': 0.5,
        'max_tokens': 60,
        'top_p': 1,
        'frequency_penalty': 0,
        'presence_penalty': 0
    }
})
.then(response => {
    console.log(response.data.choices[0].text);
})
.catch(error => {
    console.log(error);
});

