import createError from 'http-errors';  
import express from 'express';  
import path from 'path';  
import cookieParser from 'cookie-parser';  
import logger from 'morgan';  
import connectDB from './config/dbConfig.js';
import cors from 'cors';  
import dotenv from 'dotenv';
import fs from 'fs';

// Get the current directory path in ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Initialize the app
const app = express();

// Directory setup for uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use __dirname to serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

dotenv.config();   

const port = process.env.PORT || 5000; 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(path.resolve(), 'public')));

app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', "DELETE", "PUT"],
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Welcome to the Fitness Tracker API!');
});

import usersRouter from './routes/users.js';  
import contestRouter from './routes/contests.js';

app.use('/users', usersRouter); 
app.use('/contests', contestRouter);

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
