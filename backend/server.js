import express from "express";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from "cookie-parser";
import userRouter from './routes/UserRoutes.js'
import productRouter from './routes/ProductRoute.js'
import orderRouter from  "./routes/OrderRoute.js"





// dotenv config
dotenv.config();
  
// express app
const app = express(); 
 
// middlewares
app.use(cors());
app.use(express.json());

//set cookie-parser middleware
app.use(cookieParser());



//User router /api
app.use('/api' , userRouter);


//Product router /api
app.use('/api' , productRouter)


//Order router /api
app.use('/api' , orderRouter)










// connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB Now connected..');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch((err) => console.error('❌ MongoDB connection failed:', err));