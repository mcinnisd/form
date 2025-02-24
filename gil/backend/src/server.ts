import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';
import { memoriesRouter } from './routes/memories';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/memories', memoriesRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 