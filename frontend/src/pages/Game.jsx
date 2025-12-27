import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import LiveGameTracker from "../components/LiveGameTracker.jsx";
import PlayByPlayFeed from "../components/PlayByPlayFeed.jsx";

const dummyFeed = [
  {
    id: 1,
    quarter: "Q2",
    clock: "8:46",
    event: "3PT Jump Shot",
    player: "Stephen Curry",
    score: "GSW 55 - 48 LAL",
  },
  {
    id: 2,
    quarter: "Q2",
    clock: "8:21",
    event: "Assist",
    player: "Stephen Curry",
    score: "GSW 55 - 50 LAL",
  },
  {
    id: 3,
    quarter: "Q2",
    clock: "7:55",
    event: "Steal",
    player: "Stephen Curry",
    score: "GSW 57 - 50 LAL",
  },
  {
    id: 4,
    quarter: "Q2",
    clock: "7:30",
    event: "Layup",
    player: "Stephen Curry",
    score: "GSW 59 - 50 LAL",
  },
];

function Game() {
  const { gameId } = useParams();
  const location = useLocation();
  const game = location.state?.game;

  const summary = useMemo(() => {
    const away = game?.away || "GSW";
    const home = game?.home || "LAL";
    const status = game?.status || "inprogress";
    const score = game?.score || "GSW 55 - 48 LAL";
    const period = game?.period || "Q2 - 8:46";
    return {
      gameId,
      away,
      home,
      status,
      score,
      period,
    };
  }, [game, gameId]);

  return (
    <div className="page page--detail">
      <header className="detail-header">
        <Link to="/" className="back-link">
          ← Back to games
        </Link>
      </header>

      <div className="detail-layout">
        <LiveGameTracker summary={summary} />
        <PlayByPlayFeed feed={dummyFeed} />
      </div>
    </div>
  );
}

export default Game;
