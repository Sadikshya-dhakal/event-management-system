import { app } from './app.js';
import { authRouter } from './routes/auth.route.js';
import { userRouter } from './routes/user.route.js';

app.get('/', (_, res) => {
  return res.json({ message: 'Hello from server' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
