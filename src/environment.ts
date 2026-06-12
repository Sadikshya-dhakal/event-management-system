import { config } from 'dotenv';

config({ path: '.env' });

const environment = {
  PORT: process.env.PORT!,
  MONGODB_URI: process.env.MONGODB_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,       
  REDIS_URL: process.env.REDIS_URL!,         
};

export { environment };