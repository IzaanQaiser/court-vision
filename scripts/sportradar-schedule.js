require("dotenv").config();

const { fetchHomeGames } = require("../src/sportradar/home-games");

async function run() {
  const games = await fetchHomeGames({ limit: 5 });
  games.forEach((game) => {
    console.log(game.line);
  });
}

run().catch((err) => {
  console.error("Schedule fetch error:", err.message);
  process.exit(1);
});
