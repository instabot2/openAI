import express, { Request, Response, NextFunction } from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import * as OpenAI from 'ai.text'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

OpenAI.apiKey = process.env.OPENAI_API_KEY

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from ChatGPT AI!'
  })
})

app.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = req.body.prompt;

    const response = await OpenAI.complete({
      model: 'text-davinci-002',
      prompt: `${prompt}`,
      temperature: 0.7,
      maxTokens: 100,
      n: 1,
      stop: null,
      stream: false,
      presencePenalty: 0,
      frequencyPenalty: 0,
      bestOf: 1,
      apiKey: process.env.OPENAI_API_KEY,
    });

    res.status(200).send({
      bot: response.choices[0].text
    });

  } catch (error) {
    console.error(error)
    if (error.response) {
      const statusCode = error.response.status
      if (statusCode === 401) {
        res.status(401).send("Unauthorized")
      } else if (statusCode === 404) {
        res.status(404).send("Not found")
      } else {
        res.status(500).send("Internal server error")
      }
    } else {
      next(error)
    }
  }
})

// Global error handler middleware function
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(500).send(err.message || 'Something went wrong')
})

app.listen(5000, () => console.log('AI server started on http://localhost:5000'))
