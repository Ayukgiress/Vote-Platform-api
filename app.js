import createError from 'http-errors';  
import express from 'express';  
import path from 'path';  
import cookieParser from 'cookie-parser';  
import logger from 'morgan';  
import connectDB from './config/dbConfig.js';
import cors from 'cors';  
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const uploadsDir = path.join(__dirname, 'uploads');

// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

const app = express();

app.use('/uploads', express.static('uploads'));



dotenv.config();   

const port = process.env.PORT || 5000; 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(path.resolve(), 'public')));

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', "DELETE", "PUT", "PATCH"],
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Welcome to the Fitness Tracker API!');
});

import usersRouter from './routes/users.js';  
import contestRouter from './routes/contests.js';
// import voteRoute from './routes/vote.js'

app.use('/users', usersRouter); 
app.use('/contests', contestRouter);
// app.use('./vote', voteRoute)

connectDB();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

app.use((err, req, res, next) => {  
  console.error('Error details:', err); 
  res.status(err.status || 500).json({  
    error: {  
      message: err.message,  
      status: err.status || 500,  
    },  
  });  
});

app.listen(port, () => console.log(`Server started on port ${port}`));  

export default app;
