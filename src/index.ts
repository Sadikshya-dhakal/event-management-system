import express from 'express';
import { app } from './app.js';
import { environment } from './environment.js';
import { connectDb } from './services/db.js';

// routes
import { authRouter } from './routes/auth.route.js';
import { userRouter } from './routes/user.route.js';
import { eventRouter } from './routes/event.route.js';

// static files
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/events', eventRouter);

// health check
app.get('/', (_, res) => {
  res.json({ message: 'Hello from server' });
});

// start server AFTER DB connection
connectDb()
  .then(() => {
    app.listen(environment.PORT, () => {
      console.log(`Server is running on port ${environment.PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
  });
