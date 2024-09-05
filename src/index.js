// require('dotenv').config()
import dotenv from 'dotenv'
import connectDB from './DB/index.js'
import app from './app.js'


dotenv.config({
    path:"./env"
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`server is listening at  port ${process.env.PORT}` );
        
    })
})
.catch((err)=>{
    console.log(err);
    
})


























//second way of connecting database 
// import mongoose from "mongoose";
// import express from "express";
// // import { DB_NAME } from "./constants.js";

// const app=express();
// const PORT=process.env.PORT||8000
// const MONGODB_URI = "mongodb+srv://balu:balu@cluster0.1pebo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
// const DB_NAME ="videotube";

// (async ()=>{
//     try {
//         console.log('Starting application...');

//         const instanceConnection=await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`)
//         console.log(instanceConnection.connection.readyState);
    
//         app.on("error",(error)=>{
//             console.log("Error",error)
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`app is listening on port ${process.env.PORT}`)
//         })
        
//     } catch (error) {
//         console.log(error)
//         throw error
        
//     }
// })()