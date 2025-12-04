// =======================
//  SHARE LOCATION SERVER
// =======================
import express from "express";
import cors from "cors";
import fs from "fs-extra";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Untuk path directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve Frontend
app.use(express.static(path.join(__dirname, "../frontend")));  
// index.html akan langsung tampil saat akses http://localhost:3000/

// File database lokasi
const DB_FILE = path.join(__dirname, "locations.json");

// Fungsi load database
async function readDB() {
    try {
        return await fs.readJson(DB_FILE);
    } catch {
        return {};
    }
}

// Fungsi write database
async function writeDB(data) {
    await fs.writeJson(DB_FILE, data, { spaces: 2 });
}

// ==================== API ====================

// Simpan Lokasi dari user
app.post("/api/save-location", async (req, res) => {
    const { user, lat, lon } = req.body;
    if (!user || !lat || !lon)
        return res.status(400).json({ message: "Data tidak lengkap" });

    let db = await readDB();
    db[user] = { lat, lon, time: new Date().toISOString() };
    await writeDB(db);

    io.emit("update-location", db); // realtime broadcast
    res.json({ success: true, message: "O" });
});

// Get semua lokasi
app.get("/api/locations", async (req, res) => {
    res.json(await readDB());
});

// Route ke dashboard
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

// ==============================================

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server berjalan pada port", PORT));
