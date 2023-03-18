import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { OpenAI } from 'openai';

dotenv.config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from ChatGPT AI, Server is running successfully.'
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await openai.complete({
      engine: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0,
      maxTokens: 3000,
      topP: 1,
      frequencyPenalty: 0.5,
      presencePenalty: 0,
      stop: "\n"
    });

    res.status(200).send({
      bot: response.choices[0].text
    });

  } catch (error) {
    console.error(error);

    if (error instanceof TypeError && error.message === "Failed to fetch") {
      res.status(500).send("Failed to fetch resource. Please check your network connection and try again.");
    } else {
      res.status(500).send(error || 'Something went wrong');
    }
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`ChatGPT server started on http://localhost:${PORT}`));
