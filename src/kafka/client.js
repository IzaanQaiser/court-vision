const { Kafka } = require("kafkajs");

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function createKafka() {
  const bootstrapServers =
    process.env.CONFLUENT_BOOTSTRAP_SERVERS ||
    process.env.CONFLUENT_CLOUD_API_BOOTSTRAP_SERVER;

  if (!bootstrapServers) {
    throw new Error(
      "Missing bootstrap server. Set CONFLUENT_BOOTSTRAP_SERVERS or CONFLUENT_CLOUD_API_BOOTSTRAP_SERVER."
    );
  }

  return new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || "court-vision",
    brokers: [bootstrapServers],
    ssl: true,
    sasl: {
      mechanism: "plain",
      username: getEnv("CONFLUENT_CLOUD_API_KEY"),
      password: getEnv("CONFLUENT_CLOUD_API_SECRET"),
    },
  });
}

module.exports = { createKafka };
