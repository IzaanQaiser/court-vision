require("dotenv").config();

const { createKafka } = require("../src/kafka/client");

const topic = process.env.KAFKA_TOPIC_RAW || "pbp.raw";
const groupId = process.env.KAFKA_GROUP_ID || "court-vision-test";

async function run() {
  const kafka = createKafka();
  const consumer = kafka.consumer({ groupId });

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  console.log(`Listening on ${topic} (group: ${groupId})`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value ? message.value.toString() : "";
      console.log("Message:", value);
    },
  });
}

run().catch((err) => {
  console.error("Consumer error:", err);
  process.exit(1);
});
