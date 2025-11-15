import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname));

app.post("/ai/hugeface", async (req, res) => {
  try {
    const prompt = req.body.prompt || req.body.message || "Hello";
    const HF_TOKEN = process.env.HF_TOKEN;
    const HF_MODEL = "google/gemma-2-2b-it";

    if (!HF_TOKEN) {
      return res.status(500).json({ error: "HF_TOKEN not set in environment" });
    }

    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 180,
            temperature: 0.7
          }
        }),
      }
    );

    const data = await response.json();

    const text =
      (Array.isArray(data) && data[0]?.generated_text) ||
      data?.generated_text ||
      data?.generated_text?.generated_text ||
      JSON.stringify(data);

    return res.json({ choices: [{ message: { role: "assistant", content: text } }] });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI server error", detail: String(err) });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server berjalan di port", PORT));
