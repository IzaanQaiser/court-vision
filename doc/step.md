- **Phase 0 — Lock scope + “definition of done” (half day)**

  - Pick **1 replay game*- (JSON file) and freeze the MVP events: **(A) scoring runs, (B) foul parade**.
  - Freeze the **Evidence Packet schema*- (what AI is allowed to see) + the **Explainer output schema*- (headline, 2–3 sentences, evidence list, confidence, limits).
  - Write 10–15 concrete acceptance tests (ex: “8–0 in ≤3:00 produces `event_id`, start_time, trigger_condition, and metrics update every possession”).

- **Phase 1 — Data foundation (Replay Ingest → Normalized PBP)**

  1. Get Sportradar sample / trial OR use exported replay JSON.
  2. Build **Ingest Service*- (Cloud Run): reads replay file, emits events in time order.
  3. Define **canonical normalized events**:

     - possession_start/end, shot_attempt(made/miss + location bucket), foul(FTA count), turnover, rebound, score_update, game_clock, team_id.
  4. Publish to Confluent topics:

     - `pbp.raw` (as-is), `pbp.normalized` (your schema).
  5. Add deterministic **idempotency**: `game_id + sequence_number` as unique key.

- **Phase 2 — Stream processing backbone (rolling windows + possession state)**

  1. Stand up ksqlDB/Flink jobs that consume `pbp.normalized`.
  2. Build a **possession aggregator*- (critical):

     - emits `possession.summary` with: team, points, FTA, TOV, shot type, xPts (later), timestamp.
  3. Store minimal game state needed for windows:

     - current score, time, possession count, last N possessions per team (windowed tables).

- **Phase 3 — Event detection (MVP: Runs + Foul Parade)**

  - **Scoring run detector**

    - Rolling window: last **≤3 minutes*- OR last **N possessions*- with clock constraint.
    - Trigger when one team scores **≥8 unanswered**.
    - Emit `events.detected` with `event_id`, type, start_time, end_time=null, trigger_condition, teams, window context.
  - **Foul parade detector**

    - Rolling: last **3 minutes**.
    - Trigger when team attempts **≥6 FTA*- in window.
  - Add **dedupe + cooldown*- logic so you don’t spam events:

    - “same event continues” vs “new event”.

- **Phase 4 — Event tracking + timeline state (Firestore + topics)**

  1. Create **Event API*- (Cloud Run):

     - `POST /track` (user tracks `event_id`)
     - `GET /event/:id` (live state)
     - `GET /event/:id/timeline`
  2. Firestore model:

     - `events/{event_id}`: status, start_time, tracked_by_count, label, latest_metrics, latest_explanation
     - `events/{event_id}/timeline/{tick}`: per-possession updates + key deltas
  3. When an event is tracked:

     - publish to `events.tracked`
     - start continuously computing + persisting metrics deltas for that event.

- **Phase 5 — Metrics engine (Evidence Dashboard)**

  - Build an `events.metrics` producer that updates **every possession*- while event is active:

    - **Actual vs Expected points*- (needs xPts model in Phase 6)
    - **FT rate**: FTA per possession
    - **TOV rate**
    - **Shot mix**: rim/mid/3 counts + shares
    - **Possessions gained/lost*- proxy: TOV differential + OREB (if you track)
    - **Pace proxy**: possessions per minute during event window
  - Emit `events.metrics` (and persist latest + timeline).

- **Phase 6 — Shot quality / expected points (baseline first, then model)**

  1. Start with a **baseline table*- (fast):

     - xPts by shot bucket (rim/mid/3) + assist flag if available.
  2. Then replace with v1 model:

     - Train logistic/GBM offline on historical shots: inputs you listed (location bucket, shot type, clock, margin, assist flag).
  3. Deploy model:

     - simplest: a Cloud Run “xPts Service” called by stream job OR Vertex AI endpoint if you want.
  4. Validate:

     - sanity checks (league-average eFG, xPts distribution by zone).

- **Phase 7 — Structural vs Variance classification (continuous label)**

  - Implement a transparent rule-based scorer (MVP):

    - Structural signals: **xPts up**, **FT rate up**, **TOV advantage**, **rim pressure up**
    - Variance signals: **(actual − expected) big*- with no change in process signals
  - Output:

    - `label ∈ {STRUCTURAL, VARIANCE, MIXED}`
    - “reason vector” (weights) so you can show receipts.
  - Publish to `events.metrics` (as part of metrics packet) and store in Firestore.

- **Phase 8 — Evidence Packet + AI explainer (gated + validated)**

  1. Define **Evidence Packet*- JSON (only numbers + allowed context):

     - event type, teams, time range, rolling metrics, deltas vs pre-event baseline, label, and “uncertainty flags”.
  2. Build **Explainer Service*- (Cloud Run):

     - consumes `events.metrics`
     - constructs Evidence Packet
     - calls Gemini
     - validates output against schema:

       - every claim must map to an evidence item (store `claim_to_metric_refs`)
       - if missing refs → reject and replace with “insufficient evidence” template
  3. Publish `events.explanations` + write latest to Firestore.

- **Phase 9 — Event-scoped chat (strictly bounded)**

  1. Chat Service (Cloud Run):

     - `POST /event/:id/chat`
  2. Retrieval:

     - only pull **that event’s*- latest Evidence Packet + timeline summaries.
  3. Hard constraints:

     - no predictions
     - if question asks beyond data → respond “Insufficient evidence” + suggest what metric would be needed.

- **Phase 10 — Web UI (single-page MVP)**

  - Pages/components:

    - **Game View**: list of detected events in time order (live feed)
    - **Event View*- (core): dashboard metrics, label, explainer, timeline chart, chat box
  - UX details that matter:

    - “Track Event” button
    - “Updated X seconds ago”
    - timeline entries are readable (“possession 47: missed 3, +0 xPts, 2 FTA”)

- **Phase 11 — Demo polish (what wins hackathons)**

  - Replay controls:

    - play/pause, 1x/2x/5x speed, jump to event start
  - “Judge mode”:

    - a curated game with 2–3 obvious events
    - one-click jump to each event and show how explanation evolves
  - Trust hooks:

    - show the Evidence Packet (collapsed) + “Limits” section always visible.

- **Phase 12 — Production hardening (minimum needed)**

  - Observability:

    - structured logs, trace IDs, topic lag, error rate for explainer validation rejects
  - Backpressure handling:

    - if explainer fails, UI still shows metrics + label
  - Cost controls:

    - cache explanations per tick; only re-generate if evidence changes materially.