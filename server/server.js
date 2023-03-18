const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI API with static API key
const openai = new OpenAI('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');

// Route for the homepage
app.get('/', (req, res) => {
  res.status(200).send({
    message: 'Hello from ChatGPT AI, server is running successfully.',
  });
});

// Route for generating response to user prompt
app.post('/', async (req, res, next) => {
  try {
    const prompt = req.body.prompt;
    const response = await openai.complete({
      engine: 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0,
      maxTokens: 3000,
      topP: 1,
      frequencyPenalty: 0.5,
      presencePenalty: 0,
      stop: '\n',
    });
    res.status(200).send({
      bot: response.choices[0].text,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// Error handler
app.use((err, req, res, next) => {
  res.status(500).send({
    message: err.message || 'Something went wrong',
    error: err,
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ChatGPT server started on http://localhost:${PORT}`));
