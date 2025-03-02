import { Worker } from "bullmq";
import { createServer } from "http";
import { Server } from "socket.io";

const redisConfig = { host: "localhost", port: 6379, maxRetriesPerRequest: null };

const httpServer = createServer();
const io = new Server(httpServer, { 
  cors: { 
    origin: "http://localhost:3001",  // ✅ Allow frontend on port 3001
    methods: ["GET", "POST"]
  }
});
global.io = io;

io.on("connection", (socket) => {
  console.log("Client connected");
});

const worker = new Worker(
  "log-processing-queue",
  async (job) => {
    console.log(`Processing log file: ${job.data.fileName}`);
    io.emit('log-update', { jobId: job.id, });
  },
  { connection: redisConfig, concurrency: 4, attempts: 3 }
);

httpServer.listen(9000, () => {
  console.log("🚀 Worker is listening on port 9000");
})

worker.on("completed", (job) => console.log(`🎉 Job ${job.id} completed!`));
worker.on("failed", (job, err) => console.log(`❌ Job ${job.id} failed: ${err.message}`));

console.log("👷 Worker is running...");
