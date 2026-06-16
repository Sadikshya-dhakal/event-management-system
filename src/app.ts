import express from 'express';
import { environment } from './environment.js';
import { connectDb } from './services/db.js';

export const app = express();

app.use(express.json()); // Middleware to parse JSON bodies

connectDb()
  .then(() => {
    app.listen(environment.PORT, () => {
      console.log(`Server is up and running at port ${environment.PORT}`);
    });
  })
  .catch((error) => {
    if (error instanceof Error) {
      console.log(error.message);
    }
  });
