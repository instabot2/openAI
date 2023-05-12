import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from ChatGPT AI!',
  });
});

app.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      throw new Error('Missing prompt field');
    }

    const response = await openai.createCompletion({
      model: 'gpt-3.5-turbo',
      prompt: prompt,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    const botResponse = response.data.choices[0].text;

    res.status(200).send({ bot: botResponse });
  } catch (error) {
    console.error(error);

    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        res.status(401).send({ error: 'Unauthorized' });
      } else if (status === 404) {
        res.status(404).send({ error: 'Not found' });
      } else {
        res.status(status).send({ error: data });
      }
    } else {
      res.status(500).send({ error: error.message || 'Something went wrong' });
    }
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ error: err.message || 'Something went wrong' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
