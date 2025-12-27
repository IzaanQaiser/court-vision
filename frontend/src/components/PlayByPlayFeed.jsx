function PlayByPlayFeed({ feed }) {
  return (
    <section className="feed">
      <div className="feed__header">
        <h2>Live Play-by-Play</h2>
        <span className="feed__meta">Auto-refreshing</span>
      </div>
      <div className="feed__list">
        {feed.map((item) => (
          <div key={item.id} className="feed__item">
            <div className="feed__time">
              {item.quarter} · {item.clock}
            </div>
            <div className="feed__event">{item.event}</div>
            <div className="feed__player">{item.player}</div>
            <div className="feed__score">{item.score}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PlayByPlayFeed;
