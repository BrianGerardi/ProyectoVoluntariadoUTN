import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import emergencyRoutes from './routes/emergencies';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', emergencyRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port} (DB port 5433)`);
});

