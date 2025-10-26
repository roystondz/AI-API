import express from 'express';
import dotnev from 'dotenv';
import sqlite3 from 'sqlite3';
import OpenAI from 'openai';


dotnev.config();

const app = express();
app.use(express.json());

const PORT=3000;


const db = new sqlite3.Database('./database.sqlite',(err)=>{
    if (err){
        console.error('Error connecting to the database',err.message);
    }else{
        console.log('Connected to SQLite database');
    
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT,age INTEGER)`);
    db.run("INSERT OR IGNORE INTO users (id, name, email, age) VALUES (1, 'Alice', 'alice@example.com', 25)");
    db.run("INSERT OR IGNORE INTO users (id, name, email, age) VALUES (2, 'Bob', 'bob@example.com', 32)");
    db.run("INSERT OR IGNORE INTO users (id, name, email, age) VALUES (3, 'Charlie', 'charlie@example.com', 29)");

    }
})

const session = new Map();


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/',(req,res)=>{
    res.send("Hello from the server side application!");
})

app.post("/query", async (req, res) => {
    const { question } = req.body;
  
    if (!question) {
      return res.status(400).json({ error: "Please provide a question." });
    }
  
    try {
      // Step 1: Use AI to generate SQL
      const schema = `
        users(id INTEGER PRIMARY KEY, name TEXT, email TEXT, age INTEGER)
      `;
  
      const prompt = `
        You are an expert SQL assistant.
        Convert this question into a valid SQLite SELECT statement
        using the schema below. Return only the SQL code.
  
        SCHEMA:
        ${schema}
  
        QUESTION:
        ${question}
      `;
  
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
      });
  
      const sqlQuery = aiResponse.choices[0].message.content.trim();
  
      if (!sqlQuery.toLowerCase().startsWith("select")) {
        return res.status(400).json({
          error: "Only SELECT queries are allowed for safety.",
          sql: sqlQuery,
        });
      }
  
      console.log("🧠 Generated SQL:", sqlQuery);
  
      // Step 2: Execute SQL in SQLite
      db.all(sqlQuery, (err, rows) => {
        if (err) {
          console.error("❌ SQL Execution Error:", err);
          return res.status(500).json({ error: err.message, sql: sqlQuery });
        }
  
        res.json({
          question,
          sql: sqlQuery,
          results: rows,
        });
      });
    } catch (err) {
      console.error("❌ AI Query Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

app.listen(PORT,(req,res)=>{
    console.log(`Server is runnning on port : ${PORT}`);
})