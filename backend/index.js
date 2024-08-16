import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import AuthRouter from './controllers/auth-controller.js';

dotenv.config();

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/login', AuthRouter);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
