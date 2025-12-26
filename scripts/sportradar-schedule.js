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

function sortByScheduledDesc(games) {
  return [...games].sort((a, b) => {
    const aTime = Date.parse(a.scheduled || 0);
    const bTime = Date.parse(b.scheduled || 0);
    return bTime - aTime;
  });
}

function formatGameLine(game, summary, timeZone) {
  const date = game.scheduled ? new Date(game.scheduled) : null;
  const dateStr = date ? formatDateInTimeZone(date, timeZone) : "Unknown";
  const timeStr = date
    ? new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date)
    : "Unknown";
  const home = game.home?.alias || game.home?.name || "HOME";
  const away = game.away?.alias || game.away?.name || "AWAY";
  const awayLabel = away;
  const homeLabel = home;

  const status = summary?.game?.status || summary?.status || game.status;
  const awayPoints = getTeamPoints(summary, "away", game);
  const homePoints = getTeamPoints(summary, "home", game);
  const hasScore =
    status !== "scheduled" &&
    typeof awayPoints === "number" &&
    typeof homePoints === "number";
  const score = hasScore ? `${awayPoints}-${homePoints}` : "N/A";
  const quarter =
    summary?.game?.quarter ??
    summary?.quarter ??
    summary?.game?.period ??
    summary?.game?.period_number;
  const clock =
    summary?.game?.clock ||
    summary?.clock ||
    summary?.game?.clock_decimal ||
    summary?.clock_decimal ||
    "";

  const isFinal = status === "closed" || status === "complete";
  const isHalftime = status === "halftime";
  const isInProgress = status === "inprogress";

  const scoreLabel = isFinal ? `${score} Final` : score;

  let periodPart = "";
  if (isInProgress) {
    if (quarter && clock) {
      periodPart = `Q${quarter} - ${clock}`;
    } else if (quarter) {
      periodPart = `Q${quarter}`;
    }
  } else if (isHalftime) {
    periodPart = "Halftime";
  }

  return periodPart
    ? `${dateStr} | ${timeStr} | ${awayLabel} @ ${homeLabel} | ${scoreLabel} | ${periodPart}`
    : `${dateStr} | ${timeStr} | ${awayLabel} @ ${homeLabel} | ${scoreLabel}`;
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateInTimeZone(date, timeZone) {
  if (!timeZone) {
    return formatDateLocal(date);
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDateKey(scheduled, timeZone) {
  if (!scheduled) {
    return "";
  }
  const date = new Date(scheduled);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return formatDateInTimeZone(date, timeZone);
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function getTeamPoints(summary, side, fallbackGame) {
  const direct =
    summary?.[side]?.points ??
    summary?.[side]?.statistics?.points ??
    summary?.[side]?.scoring?.points ??
    summary?.boxscore?.[side]?.points ??
    summary?.boxscore?.[side]?.statistics?.points ??
    summary?.boxscore?.[side]?.scoring?.points ??
    summary?.game?.[side]?.points ??
    summary?.game?.[`${side}_points`];

  const directNumber = toNumber(direct);
  if (directNumber !== null) {
    return directNumber;
  }

  const fallback =
    fallbackGame?.[`${side}_points`] ?? fallbackGame?.[side]?.points;
  const fallbackNumber = toNumber(fallback);
  return fallbackNumber !== null ? fallbackNumber : null;
}

async function fetchGameSummary({
  apiBase,
  accessLevel,
  language,
  format,
  apiKey,
  gameId,
  debug,
}) {
  const url = `${apiBase}/nba/${accessLevel}/v8/${language}/games/${gameId}/summary.${format}`;
  try {
    return await fetchJson(url, { "x-api-key": apiKey });
  } catch (err) {
    if (debug) {
      console.error(`Summary fetch failed for ${gameId}: ${err.message}`);
    }
    return null;
  }
}

async function run() {
  const apiKey =
    getEnv("SPORTRADAR_API_KEY") || getRequiredEnv("NBA_API_KEY");
  const accessLevel = getEnv("SPORTRADAR_ACCESS_LEVEL", "trial");
  const language = getEnv("SPORTRADAR_LANGUAGE", "en");
  const seasonYear = getEnv("SPORTRADAR_SEASON_YEAR", seasonYearDefault());
  const seasonType = getEnv("SPORTRADAR_SEASON_TYPE", "REG");
  const format = getEnv("SPORTRADAR_FORMAT", "json");
  const apiBase = getEnv("SPORTRADAR_API_BASE", "https://api.sportradar.com");
  const filterDate = getEnv("SPORTRADAR_DATE");
  const timeZone = getEnv("SPORTRADAR_TIMEZONE");
  const displayTimeZone = "America/New_York";
  const debug = getEnv("SPORTRADAR_DEBUG") === "1";

  const url = `${apiBase}/nba/${accessLevel}/v8/${language}/games/${seasonYear}/${seasonType}/schedule.${format}`;
  const data = await fetchJson(url, { "x-api-key": apiKey });

  const games = Array.isArray(data.games) ? data.games : [];
  const dateFilter = filterDate || formatDateInTimeZone(new Date(), timeZone);

  const byDate = new Map();
  games.forEach((game) => {
    const key = getDateKey(game.scheduled, timeZone);
    if (!key) {
      return;
    }
    if (!byDate.has(key)) {
      byDate.set(key, []);
    }
    byDate.get(key).push(game);
  });

  const todayGames = sortByScheduledDesc(byDate.get(dateFilter) || []);
  const otherDates = [...byDate.keys()]
    .filter((date) => date < dateFilter)
    .sort((a, b) => b.localeCompare(a));

  const picked = [...todayGames];
  for (const date of otherDates) {
    if (picked.length >= 5) {
      break;
    }
    const dayGames = sortByScheduledDesc(byDate.get(date) || []);
    for (const game of dayGames) {
      if (picked.length >= 5) {
        break;
      }
      picked.push(game);
    }
  }

  console.log(`Schedule date: ${dateFilter}`);
  if (timeZone) {
    console.log(`Time zone: ${timeZone}`);
  }
  console.log(`Games found: ${todayGames.length}/${games.length}`);
  if (todayGames.length < 5) {
    console.log(
      `Filling with most recent previous games to reach ${Math.min(5, games.length)} total.`
    );
  }
  console.log("---");

  const summaries = await Promise.all(
    picked.map(async (game) => ({
      game,
      summary: await fetchGameSummary({
        apiBase,
        accessLevel,
        language,
        format,
        apiKey,
        gameId: game.id,
        debug,
      }),
    }))
  );

  summaries.forEach(({ game, summary }) => {
    const line = formatGameLine(game, summary, displayTimeZone);
    console.log(line);
    if (
      debug &&
      summary?.game?.status === "inprogress" &&
      line.includes("N/A")
    ) {
      console.error(
        `Debug: inprogress game missing score for ${game.id} (${game.away?.alias} @ ${game.home?.alias})`
      );
    }
  });

  if (todayGames.length === 0) {
    console.log("No games matched the filter date. Try setting SPORTRADAR_DATE.");
  }
}

run().catch((err) => {
  console.error("Schedule fetch error:", err.message);
  process.exit(1);
});
