require("dotenv").config();

const { createKafka } = require("../src/kafka/client");

const topic = process.env.KAFKA_TOPIC_RAW || "pbp.raw";

async function run() {
  const kafka = createKafka();
  const producer = kafka.producer();

  await producer.connect();

  const payload = {
    type: "test",
    source: "court-vision",
    ts: new Date().toISOString(),
    note: "hello from producer",
  };

  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(payload) }],
  });

  await producer.disconnect();
  console.log(`Sent test message to ${topic}`);
}

run().catch((err) => {
  console.error("Producer error:", err);
  process.exit(1);
});
