import express from "express";
import mongoose from "mongoose";
import Redis from "ioredis";

const app = express();

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.get("/redis", async (req, res) => {
  const reply = await redis.ping();
  res.json({ redis: reply });
});

app.get("/mongo", async (req, res) => {
  const url =
    process.env.MONGO_URL || "mongodb://localhost:27017/sandesh_redis";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(url);
  }
  res.json({
    mongo: "Connected to MongoDB",
    database: mongoose.connection.db.databaseName,
  });
});

app.listen(3000, () =>
  console.log("Server is running on http://localhost:3000"),
);
