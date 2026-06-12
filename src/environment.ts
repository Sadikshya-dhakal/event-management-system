import { config } from 'dotenv';

config({
  path: '.env',
});

const environment = {
  PORT: process.env.PORT!,
  MONGODB_URI: process.env.MONGODB_URI!,
};

export { environment };
