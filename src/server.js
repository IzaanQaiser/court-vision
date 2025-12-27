require("dotenv").config();

const express = require("express");
const { fetchHomeGames } = require("./sportradar/home-games");

const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
const port = Number(process.env.PORT) || 3000;
const CACHE_TTL_MS = 30 * 1000;
let cachedGames = null;
let cachedAt = 0;
let inFlight = null;

app.get("/api/home/games", async (req, res) => {
  const now = Date.now();
  if (cachedGames && now - cachedAt < CACHE_TTL_MS) {
    res.setHeader("X-Cache", "fresh");
    res.json({ games: cachedGames });
    return;
  }

  if (!inFlight) {
    inFlight = fetchHomeGames({ limit: 5 })
      .then((games) => {
        cachedGames = games;
        cachedAt = Date.now();
        return games;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  try {
    const games = await inFlight;
    res.setHeader("X-Cache", "miss");
    res.json({ games });
  } catch (err) {
    console.error("Home games error:", err?.message || err);
    if (cachedGames) {
      res.setHeader("X-Cache", "stale");
      res.json({ games: cachedGames });
      return;
    }
    res.status(500).json({ error: "Failed to fetch games." });
  }
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
