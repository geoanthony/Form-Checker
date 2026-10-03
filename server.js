const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const FILE = path.join(__dirname, "sessions.json");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const read = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : []);

app.get("/api/sessions", (req, res) => res.json(read().slice(-10).reverse()));

app.post("/api/sessions", (req, res) => {
  const { exercise, reps, avgScore, issues } = req.body;
  const all = read();
  all.push({ exercise, reps, avgScore, issues, date: new Date().toISOString() });
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
  res.json({ ok: true });
});

// ---- daily routines ----
const RFILE = path.join(__dirname, "routines.json");
const readR = () => (fs.existsSync(RFILE) ? JSON.parse(fs.readFileSync(RFILE, "utf8")) : []);
const writeR = (a) => fs.writeFileSync(RFILE, JSON.stringify(a, null, 2));

app.get("/api/routines", (req, res) => res.json(readR()));

app.post("/api/routines", (req, res) => {
  const { name, days, items } = req.body;
  if (!name || !Array.isArray(items) || !items.length)
    return res.status(400).json({ error: "name and at least one exercise required" });
  const routine = {
    id: Date.now().toString(36),
    name: String(name).slice(0, 40),
    days: (Array.isArray(days) ? days : []).map(Number).filter((d) => d >= 0 && d <= 6),
    items: items.slice(0, 20).map((i) => ({
      exercise: String(i.exercise).slice(0, 30),
      target: Math.max(1, Math.min(999, parseInt(i.target) || 10)),
    })),
  };
  const all = readR(); all.push(routine); writeR(all);
  res.json(routine);
});

app.delete("/api/routines/:id", (req, res) => {
  writeR(readR().filter((r) => r.id !== req.params.id));
  res.json({ ok: true });
});

// localhost counts as a secure origin, so the camera works here
app.listen(3000, () => console.log("Open http://localhost:3000"));
