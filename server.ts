import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/generate-tasks", async (req, res) => {
    try {
      const { jobTitle, daysCount, focus, customPrompt, duration, tone } = req.body;
      
      const targetJob = jobTitle || 'Tenaga Kependidikan / Guru';
      const targetDuration = duration || '450 menit';
      const targetCount = daysCount || 1;
      
      let focusText = "";
      if (focus) {
        focusText += ` Fokus utama kegiatan: ${focus}.`;
      }
      if (customPrompt) {
        focusText += ` Catatan / Instruksi Khusus: ${customPrompt}.`;
      }
      if (tone) {
        focusText += ` Gaya penulisan: ${tone}.`;
      }

      const prompt = `Buatkan daftar uraian pekerjaan/kegiatan harian yang profesional, realistis, dan bervariasi untuk posisi "${targetJob}".
${focusText}
Jumlah hari kerja yang dibutuhkan: ${targetCount} hari.
Durasi waktu rata-rata kerja harian: "${targetDuration}".

Format yang Wajib Dipatuhi:
Hasilkan HANYA array JSON berisi object dengan properti "waktu" (misalnya "${targetDuration}") dan "uraian" (string uraian pekerjaan yang rinci dan profesional, dipisahkan titik koma ";" jika terdiri dari beberapa sub-kegiatan).

Contoh output:
[
  {"waktu": "${targetDuration}", "uraian": "Mengajar dan membimbing siswa di kelas; Memeriksa lembar jawaban tugas siswa; Menyusun jurnal pembelajaran harian"},
  {"waktu": "${targetDuration}", "uraian": "Melaksanakan piket kebersihan dan ketertiban; Memandu diskusi kelompok siswa; Berkoordinasi dengan wali kelas"}
]

PENTING: Jangan sertakan teks penjelasan atau format markdown seperti \`\`\`json. Kembalikan murni teks JSON array!`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
            responseMimeType: "application/json"
        }
      });
      
      let text = response.text || "[]";
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let tasks = [];
      try {
          tasks = JSON.parse(text);
      } catch (e) {
          console.error("Failed to parse Gemini response as JSON", text);
      }
      
      res.json({ tasks });
    } catch (error: any) {
      console.error(error);
      const msg = error?.status === 503 ? "Model AI sedang sibuk (high demand). Silakan coba lagi beberapa saat." : "Gagal menghasilkan uraian pekerjaan.";
      res.status(500).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
