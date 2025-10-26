import express from 'express';
import dotnev from 'dotenv';
import sqlite3 from 'sqlite3';



dotnev.config();

const app = express();
app.use(express.json());

const PORT=3000;


const db = new sqlite3.Database('./database.sqlite',(err)=>{
    if (err){
        console.error('Error connecting to the database',err.message);
    }else{
        console.log('Connected to SQLite database');
    
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)`);
    }
})

app.get('/',(req,res)=>{
    res.send("Hello from the server side");
})


app.listen(PORT,(req,res)=>{
    console.log(`Server is runnning on port : ${PORT}`);
})