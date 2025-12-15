import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import FormData from "form-data";
import os from "os";

/* 🔴 REPLACE ONLY THIS */
const BOT_TOKEN = "8419880200:AAG5OpgB0BG7FOpN-XrUu_7y3hGJKmWimI4";
const CHAT_ID  = "7652176329";
/* 🔴 END */

export default async function handler(req, res) {
  try {
    const url = req.query.url;
    if (!url) return res.json({ error: "URL missing" });

    const baseDir = path.join(os.tmpdir(), "clone_site");
    fs.mkdirSync(baseDir, { recursive: true });

    // Fetch HTML
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 20000
    });

    fs.writeFileSync(path.join(baseDir, "index.html"), response.data);

    const $ = cheerio.load(response.data);

    // Download images
    const imgDir = path.join(baseDir, "images");
    fs.mkdirSync(imgDir, { recursive: true });

    const images = $("img").map((i, el) => $(el).attr("src")).get();

    for (const img of images) {
      try {
        if (!img || !img.startsWith("http")) continue;
        const imgName = path.basename(img.split("?")[0]);
        const imgData = await axios.get(img, { responseType: "arraybuffer" });
        fs.writeFileSync(path.join(imgDir, imgName), imgData.data);
      } catch {}
    }

    // ZIP create
    const zipPath = path.join(os.tmpdir(), "website_clone.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(baseDir, false);
    await archive.finalize();

    // Send to Telegram
    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    form.append("document", fs.createReadStream(zipPath));

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      form,
      { headers: form.getHeaders() }
    );

    res.json({ success: true, message: "ZIP sent to Telegram ✅" });

  } catch (e) {
    res.json({ error: "Clone failed (site blocked or error)" });
  }
                                   }
