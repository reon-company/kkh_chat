import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./routes.js";

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use("/api", router);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Service2 backend listening on http://localhost:${PORT}`);
});
