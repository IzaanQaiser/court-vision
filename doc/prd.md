# Product Requirements Document (PRD)

## Court Vision

---

## 1. Problem Statement

Watching NBA games live, fans experience rapid swings (runs, foul trouble, hot shooting) but **cannot tell why they’re happening*- or whether they’re meaningful.

Existing solutions fail:

- **Box score / win probability*- → descriptive, not explanatory
- **Commentary / Twitter*- → subjective, emotional, often wrong
- **“AI predictors”*- → opaque, unverifiable, low trust

Users lack **real-time, evidence-backed understanding*- of game events.

---

## 2. Product Vision

Create a real-time companion that:

  - Detects meaningful in-game events
    - explains why that event is meaningful (expected vs actual)
  - Lets users *track- those events as they unfold in real time
  - Explains **what is happening and why**, using only data
  - Tells you whether what you’re seeing is expected or just a fluke
  - Uses AI **only as a narrator**, never as a guesser

The app does **not predict outcomes.**
It **explains what's going on**.

---

## 3. Target Users

### Primary

1. **Hardcore NBA fans**

   - Watch full games
   - Want deeper understanding, not more stats

2. **Basketball content creators / analysts**

   - Need defensible real-time insights
   - Want to follow and narrate game storylines

---

## 4. Core Value Proposition

**“We turn live NBA games into understandable stories, backed by numbers.”**

Concrete value:
- Reduces emotional overreaction
- Identifies whether events are process-driven or luck-driven
- Builds trust in AI through evidence gating
- Makes watching games smarter, not noisier

---

## 5. Core Use Case (Golden Path)

1. User opens app during a live NBA game
2. App detects an event (e.g., 12–2 run)
3. User taps **“Track Event”**
4. App opens an Event View that:
  - explains why the event is meaningful (expected vs actual)
   - Continuously updates metrics
   - Shows AI explanation with cited evidence
   - Labels event as **structural*- or **variance-driven**
5. User asks follow-up questions via event-scoped chat
6. Event resolves (run ends, fouls stabilize, shooting regresses)
7. User understands *why- it happened

---

## 6. Key Features

### 6.1 Event Detection (Automatic)

The system detects events using live data.

Initial supported events (MVP):

- Scoring runs (≥ 8–0 within ≤ 3 minutes)
- Turnover spikes (≥ 3 TOV in 5 possessions)
- Foul parades (≥ 6 FTA in 3 minutes)
- Hot / cold shooting (actual − expected ≥ ±6 pts over last 10 shots)

Each detection creates a unique `event_id`.

---

### 6.2 Event Tracking (Core Feature)

Users can “track” an event.

Tracked events:

- Persist as live objects
- Update metrics every possession
- Maintain a timeline from event start → end

Each tracked event has:

- Start time and trigger condition
- Rolling metrics since start
- AI explanations that refresh as evidence changes

---

### 6.3 Evidence Dashboard

For each tracked event, display:

Metrics (updated live):

- Shot quality: expected vs actual points
- Turnover rate and points off turnovers
- Free-throw rate
- Shot mix (rim / mid / 3)
- Pace proxy
- Possessions gained/lost

This answers:
**What measurable forces are driving this event?**

---

### 6.4 Real vs Variance Classification

Each event is continuously labeled:

- **Structural (process-driven)**
- **Variance-driven (luck-based)**
- **Mixed / unclear**

Logic:

- Structural → improvements in xPts, rim pressure, FTs, possession advantage
- Variance → large actual − expected gaps with no process change

This is one of the highest-value features for users.

---

### 6.5 AI Explainer (Evidence-Gated)

AI generates explanations with strict rules:

Output includes:

- Headline (≤ 12 words)
- 2–3 sentence explanation
- Evidence list (metrics + values)
- Confidence score
- Limits (what this does *not- prove)

Hard constraints:

- AI only sees a structured **Evidence Packet**
- Every claim must cite metrics
- No speculation, intent, or predictions
- If evidence is insufficient → AI must say so

---

### 6.6 Event-Scoped Chatbot

Users can ask questions about a tracked event:

- “Why is this run continuing?”
- “What would make this stop?”
- “Is this normal historically?”

Constraints:

- Chat is locked to one event
- AI can only reference that event’s metrics
- If data doesn’t support an answer → “Insufficient evidence”

This builds trust and educational value.

---

## 7. Data Sources

Primary data provider:

- **Sportradar NBA real-time API**

  - Play-by-play
  - Shots
  - Fouls
  - Game state

Initial mode:

- Replay Mode using completed games
- Optional live mode using trial access

---

## 8. AI & Analytics

### 8.1 Shot Quality / Expected Points Model

- Input: shot location bucket, shot type, clock, score margin, assist flag
- Output: expected points per shot
- Used to compute variance vs process

Model type:

- Logistic regression or gradient boosting (v1)

---

### 8.2 AI Explanation (Vertex AI/Gemini)

- Gemini used strictly for **language generation**
- Never for raw analysis
- Prompt enforces schema and citations
- Output validated server-side before display

---

## 9. Real-Time Architecture

### Event Streaming

- Sportradar → Ingest Service → Confluent topics

Key topics:

- `pbp.raw`
- `pbp.normalized`
- `events.detected`
- `events.tracked`
- `events.metrics`
- `events.explanations`

### Stream Processing

- Rolling windows via ksqlDB / Flink
- Event detection + metric aggregation
- Updates published continuously

This directly aligns with “data in motion” requirements.

---

## 10. Platform Architecture (GCP)

- **Cloud Run**

  - Ingest service
  - Event API
  - Explainer service
  - Chat service

- **Firestore**

  - Event state
  - Timelines
  - Explanations

- **Vertex AI**

  - Gemini API
  - Optional ML model hosting

- **Secret Manager**

  - API keys and credentials

- **Cloud Storage**

  - Replay files, logs

---

## 11. MVP Scope (1-week feasible)

Included:

- Replay Mode (1 full game)
- Scoring runs + foul events
- Shot quality baseline
- Event tracking
- AI explainer with receipts
- Single-page web UI

Excluded:

- Player tracking data
- Coaching simulations
- Outcome prediction
- Multi-game dashboards

---

## 12. Success Criteria

### User-level

- Users keep app open during full games
- Users track at least one event per game
- Users ask follow-up questions

### Product-level

- AI explanations always cite data
- No hallucinated claims
- Events correctly classified as real vs variance

### Demo-level (hackathon)

- Judges understand value in < 30 seconds
- Live or replay demo clearly shows event evolution
- AI explanations feel trustworthy, not magical

---

## 13. One-Sentence Summary

**A real-time NBA companion that lets fans track live game events and understand what’s actually happening, using AI explanations backed strictly by data.**