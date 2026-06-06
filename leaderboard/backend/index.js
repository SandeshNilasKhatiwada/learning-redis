import express from "express";
import { createClient } from "redis";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5174", // Replace with your frontend URL
  }),
);
app.use(express.json());

async function connectRedis() {
  const redisClient = createClient({
    url: "redis://localhost:6379",
  });
  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
  });
  await redisClient.connect();
  console.log("Connected to Redis");
  return redisClient;
}

const redisClient = await connectRedis();

const LEADERBOARD_KEY = "leaderboard";
// 1. submit/update (uses ZINCRBY)
app.post("/api/score", async (req, res) => {
  const { username, points } = req.body;
  if (!username || !points) {
    return res.status(400).json({ error: "Username and points are required" });
  }
  try {
    //Increment user's score in the sorted set
    const newScore = await redisClient.zIncrBy(
      LEADERBOARD_KEY,
      parseFloat(points),
      username,
    );
    res.json({ username: username, newScore: parseFloat(newScore) });
  } catch (err) {
    res.status(500).json({ error: "Failed to update score" });
  }
});

// 2. get Top 10 LeaderBoard (Uses ZREVRANGE with WITHSCORES via zRange)
app.get("/api/leaderboard", async (req, res) => {
  try {
    const playersWithScores = await redisClient.zRangeWithScores(LEADERBOARD_KEY, 0, 9, {
      REV: true,
    });
    console.log("Fetched leaderboard from Redis:", playersWithScores);
    res.json(playersWithScores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. get specific User Rank (Uses ZREVRANK)
app.get("/api/rank/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const rank = await redisClient.zRevRank(LEADERBOARD_KEY, username);
    const score = await redisClient.zScore(LEADERBOARD_KEY, username);
    if (rank === null) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ username, rank: rank + 1, score: parseFloat(score) }); // Rank is 0-based, so add 1
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
