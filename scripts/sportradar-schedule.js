require("dotenv").config();

const https = require("https");

function getEnv(name, fallback = "") {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function getRequiredEnv(name) {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function seasonYearDefault() {
  const now = new Date();
  const year = now.getUTCFullYear();
  // NBA season year is the year the season begins (e.g., 2024 for 2024-25).
  return now.getUTCMonth() >= 7 ? String(year) : String(year - 1);
}

function fetchJson(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: "GET", headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 300) {
          return reject(
            new Error(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`)
          );
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err.message}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function formatGameLine(game) {
  const scheduled = game.scheduled || "";
  const home = game.home?.name || game.home?.alias || "HOME";
  const away = game.away?.name || game.away?.alias || "AWAY";
  const status = game.status || "unknown";
  return `${scheduled} | ${away} @ ${home} | ${status} | ${game.id}`;
}

async function run() {
  const apiKey = getRequiredEnv("NBA_API_KEY");
  const accessLevel = getEnv("SPORTRADAR_ACCESS_LEVEL", "trial");
  const language = getEnv("SPORTRADAR_LANGUAGE", "en");
  const seasonYear = getEnv("SPORTRADAR_SEASON_YEAR", seasonYearDefault());
  const seasonType = getEnv("SPORTRADAR_SEASON_TYPE", "REG");
  const format = getEnv("SPORTRADAR_FORMAT", "json");
  const apiBase = getEnv("SPORTRADAR_API_BASE", "https://api.sportradar.com");
  const filterDate = getEnv("SPORTRADAR_DATE");

  const url = `${apiBase}/nba/${accessLevel}/v8/${language}/games/${seasonYear}/${seasonType}/schedule.${format}`;
  const data = await fetchJson(url, { "x-api-key": apiKey });

  const games = Array.isArray(data.games) ? data.games : [];
  const dateFilter = filterDate || new Date().toISOString().slice(0, 10);

  const filtered = games.filter((game) =>
    (game.scheduled || "").startsWith(dateFilter)
  );

  console.log(`Schedule date: ${dateFilter}`);
  console.log(`Games found: ${filtered.length}/${games.length}`);
  console.log("---");

  filtered.forEach((game) => {
    console.log(formatGameLine(game));
  });

  if (filtered.length === 0) {
    console.log("No games matched the filter date. Try setting SPORTRADAR_DATE.");
  }
}

run().catch((err) => {
  console.error("Schedule fetch error:", err.message);
  process.exit(1);
});
