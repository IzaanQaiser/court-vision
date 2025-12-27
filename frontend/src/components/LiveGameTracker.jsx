function LiveGameTracker({ summary }) {
  const statusLabel =
    summary.status === "inprogress"
      ? "Live"
      : summary.status === "halftime"
        ? "Halftime"
        : summary.status === "closed" || summary.status === "complete"
          ? "Final"
          : "Scheduled";

  return (
    <aside className="tracker">
      <div className="tracker__pill">{statusLabel}</div>
      <h2 className="tracker__matchup">
        {summary.away} @ {summary.home}
      </h2>
      <div className="tracker__score">{summary.score}</div>
      <div className="tracker__period">{summary.period}</div>
      <div className="tracker__meta">Game ID: {summary.gameId}</div>
    </aside>
  );
}

export default LiveGameTracker;
