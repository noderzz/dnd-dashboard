import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { parseDice } from "./roller";
import { PendingRoll, Character } from "./types";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// super simple in-memory store
const store = {
  characters: [] as Character[],
  armed: null as null | { characterId: string; roll: PendingRoll }
};

app.post("/api/characters", (req, res) => {
  const c = req.body as Character;
  if (!c?.id || !c?.name) return res.status(400).json({ error: "Invalid character" });
  const i = store.characters.findIndex(x => x.id === c.id);
  if (i >= 0) store.characters[i] = c;
  else store.characters.push(c);
  res.json({ ok: true });
});

app.get("/api/characters", (_, res) => res.json(store.characters));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", socket => {
  socket.emit("server:armed", { armed: !!store.armed });

  socket.on("gm:arm-roll", (payload: { characterId: string; roll: PendingRoll }) => {
    store.armed = payload;
    const c = store.characters.find(x => x.id === payload.characterId) ?? null;
    io.emit("server:armed", { armed: true, characterSummary: c ? { id: c.id, name: c.name } : null });
  });

  socket.on("player:press", () => {
    if (!store.armed) return;
    const { characterId, roll } = store.armed;
    const c = store.characters.find(x => x.id === characterId) ?? null;

    const label =
      roll.kind === "ability" ? `${roll.ability} check` :
      roll.kind === "save" ? `${roll.ability} save` :
      roll.kind === "skill" ? `${roll.skill} check` : roll.label;

    let mod = 0;
    if (c) {
      if (roll.kind === "ability") mod = c.abilities[roll.ability];
      if (roll.kind === "save") mod = c.saves[roll.ability];
      if (roll.kind === "skill") mod = c.skills[roll.skill] ?? 0;
    }

    const { rolls, total } = parseDice(roll.dice);
    const finalTotal = total + (mod || 0);

    io.emit("server:result", {
      total: finalTotal,
      detail: { dice: roll.dice, rolls, mod: mod || 0 },
      characterName: c?.name ?? "Unknown",
      label
    });

    store.armed = null;
    io.emit("server:clear", { armed: false });
  });
});

const PORT = process.env.PORT || 5174;
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
