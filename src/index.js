import mongoose from "mongoose";
import express from "express";
// import { DB_NAME } from "./constants.js";

const app=express();
const PORT=process.env.PORT||8000
const MONGODB_URL = process.env.MONGODB_URL ||"mongodb+srv://balu:balu@cluster0.1pebo.mongodb.net"
const DB_NAME ="videotube";

(async ()=>{
    try {
        console.log('Starting application...');

        const instanceConnection=await mongoose.connect(`${MONGODB_URL}/${DB_NAME}`)
        console.log(instanceConnection.connection.readyState);
    
        app.on("error",(error)=>{
            console.log("Error",error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port ${process.env.PORT}`)
        })
        
    } catch (error) {
        console.log(error)
        throw error
        
    }
})()