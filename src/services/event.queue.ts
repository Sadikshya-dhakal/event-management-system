import { Queue } from 'bullmq';
import { environment } from '../environment.js';

export const eventQueue = new Queue('event-jobs', {
  connection: { url: environment.REDIS_URL },  // pass URL string, not Redis instance
});

export const enqueuePublishJob = async (eventId: string, title: string) => {
  await eventQueue.add('notify-subscribers', { eventId, title });
  console.log(`[QUEUE] Job enqueued for event: ${title}`);
};