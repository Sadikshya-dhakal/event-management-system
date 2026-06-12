import 'dotenv/config';
import { Worker, type Job } from 'bullmq';
import { connectDb } from './services/db.js';
import fs from 'fs';

const REDIS_URL = process.env.REDIS_URL!;
const exportsDir = 'exports';
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir);

connectDb();

const worker = new Worker(
  'event-jobs',
  async (job: Job) => {
    console.log(`[WORKER] Processing: ${job.name}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const report = {
      jobId: job.id,
      eventId: job.data.eventId,
      eventTitle: job.data.title,
      generatedAt: new Date().toISOString(),
      simulatedAttendees: Math.floor(Math.random() * 200) + 10,
    };

    fs.writeFileSync(
      `${exportsDir}/report-${job.data.eventId}.json`,
      JSON.stringify(report, null, 2)
    );
    console.log(`[WORKER] Report saved for: ${job.data.title}`);
  },
  { connection: { url: REDIS_URL } }  // pass URL string, not Redis instance
);

worker.on('completed', (job) => console.log(`[WORKER] Job ${job.id} done`));
worker.on('failed', (job, err) => console.error(`[WORKER] Job ${job?.id} failed:`, err));
console.log('[WORKER] Listening for jobs...');