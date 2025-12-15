import express from "express";
import scrapeHandler from "./api/scrape.js";

const app = express();
const PORT = 3000;

// test route
app.get("/", (req, res) => {
  res.send("SERVER IS RUNNING ✅");
});

// api route
app.get("/api/scrape", scrapeHandler);

// IMPORTANT: bind to all interfaces
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server listening on port " + PORT);
});
