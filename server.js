import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import scrapeHandler from "./api/scrape.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Frontend
app.use(express.static(path.join(__dirname, "public")));

// API
app.get("/api/scrape", scrapeHandler);

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("✅ Website running on port " + PORT);
});
