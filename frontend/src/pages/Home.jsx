import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:3000/api/home/games");
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data.games)) {
          setGames(data.games);
          setError("");
        } else {
          throw new Error("Invalid response from API.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load games. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = useMemo(() => {
    return games.map((game, index) => {
      const status = (game.status || "").toLowerCase();
      const isLive = status === "inprogress" || status === "halftime";
      const isFinal = status === "closed" || status === "complete";
      const statusLabel = isLive
        ? "Live"
        : isFinal
          ? "Final"
          : status === "created" || status === "scheduled"
            ? "Scheduled"
            : "Update";

      return {
        key: `${game.date}-${game.home}-${game.away}-${index}`,
        gameId: game.gameId || `fallback-${index}`,
        status,
        statusLabel,
        headline: `${game.away} @ ${game.home}`,
        score: game.tipoff || game.score || "N/A",
        period: game.period,
        time: game.timeEST,
        date: game.date,
        isLive,
        isFinal,
        raw: game,
      };
    });
  }, [games]);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__label">Court Vision</div>
        <h1 className="hero__title">Today’s Games</h1>
        <p className="hero__subtitle">
          Live NBA scoreboard with real-time status, scores, and tipoff windows.
        </p>
      </header>

      {loading ? (
        <div className="state">Loading…</div>
      ) : error ? (
        <div className="state state--error">{error}</div>
      ) : (
        <section className="grid">
          {cards.map((card) => (
            <Link
              key={card.key}
              to={`/game/${card.gameId}`}
              state={{ game: card.raw }}
              className="card-link"
            >
              <article className="card">
                <div className="card__top">
                  <span
                    className={`pill pill--${card.status || "unknown"} ${
                      card.isLive ? "pill--live" : ""
                    }`}
                  >
                    {card.statusLabel}
                  </span>
                  <span className="meta">
                    {card.date} · {card.time}
                  </span>
                </div>

                <div className="card__body">
                  <h2 className="matchup">{card.headline}</h2>
                  <div className="score">{card.score}</div>
                  {card.period ? (
                    <div className="period">{card.period}</div>
                  ) : null}
                </div>
              </article>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

export default Home;
