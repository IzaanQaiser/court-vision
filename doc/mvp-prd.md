## **Court Vision — LIVE MVP PRD (Hackathon-Correct)**

### **1. Goal (non-negotiable)**

Explain **why a live NBA scoring run is happening** using **real-time streamed data**, not prediction.

---

### **2. Live Data Requirement (core constraint)**

- **Source:** Sportradar NBA *live- play-by-play (trial or live game)
- **Transport:** Confluent Cloud (Kafka topics)
- **Processing:** rolling, in-motion (no batch, no replay fallback)
- **Update cadence:** per possession / per event

If the stream stops, the product fails.

---

### **3. MVP Features (minimum to win)**

- **Live Event Detection**

  - Detect **scoring runs ≥ 8–0 within ≤ 3 minutes**
  - Triggered directly from streamed play-by-play
- **Live Event Tracking**

  - Once detected, event stays “open”
  - Metrics update **as new plays arrive**
- **Live Metrics (only these)**

  - Actual points vs expected points
  - Free throw attempts
  - Turnovers
  - Shot mix (rim / mid / 3)
- **Real-Time Classification**

  - Structural vs Variance (rule-based, transparent)
- **AI Explainer (live, evidence-gated)**

  - Regenerated only when evidence changes
  - Every sentence cites live metrics

---

### **4. Architecture (minimum viable, live)**

- **Kafka / Confluent Topics**

  - `pbp.raw` (live Sportradar feed)
  - `pbp.normalized`
  - `events.detected`
  - `events.metrics`
  - `events.explanation`
- **Stream Logic**

  - Rolling window run detection
  - Rolling possession aggregation
- **Google Cloud**

  - Cloud Run: stream consumer + explainer
  - Vertex AI (Gemini): text only, no analysis

No Firestore timelines.
No historical storage beyond “current event state”.

---

### **5. Demo Definition of Done (judge lens)**

- A **real live NBA game** is streaming
- A scoring run is detected **in real time**
- Metrics visibly change as plays happen
- Label updates logically
- AI explanation updates with **new numbers**
- Judge understands value in **<30 seconds**
