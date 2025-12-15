import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import os from "os";
import archiver from "archiver";
import FormData from "form-data";

/* =========================
   🔴 REPLACE HERE ONLY
   ========================= */
const BOT_TOKEN = "8419880200:AAG5OpgB0BG7FOpN-XrUu_7y3hGJKmWimI4";
const CHAT_ID  = "7652176329";
/* ========================= */

export default async function handler(req, res) {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "URL missing" });
    }

    // Temp folder (Vercel safe)
    const baseDir = path.join(os.tmpdir(), "site_clone");
    fs.mkdirSync(baseDir, { recursive: true });

    /* ========= FETCH HTML ========= */
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const htmlPath = path.join(baseDir, "index.html");
    fs.writeFileSync(htmlPath, response.data);

    const $ = cheerio.load(response.data);

    /* ========= DOWNLOAD IMAGES ========= */
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

    /* ========= CREATE ZIP ========= */
    const zipPath = path.join(os.tmpdir(), "website_clone.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(baseDir, false);
    await archive.finalize();

    /* ========= SEND ZIP TO TELEGRAM ========= */
    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    form.append("document", fs.createReadStream(zipPath));

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      form,
      { headers: form.getHeaders() }
    );

    return res.json({
      success: true,
      message: "✅ Website cloned & ZIP sent to Telegram"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "❌ Clone failed"
    });
  }
}
