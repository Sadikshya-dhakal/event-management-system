import { connect } from 'mongoose';
import { environment } from '../environment.js';

export async function connectDb() {
  await connect(environment.MONGODB_URI, {
    dbName: 'event',
  });
}
