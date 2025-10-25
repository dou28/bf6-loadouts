// updateWeapons.js — Générateur d'armes avec fallback local
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const REMOTE_SOURCES = [
  // ➜ Mets ici TES liens “raw” GitHub (facultatifs)
  // "https://raw.githubusercontent.com/<ton_user>/<ton_repo>/main/weapons.json",
  // "https://raw.githubusercontent.com/<ton_user>/<ton_repo>/main/attachments.json",
  // "https://raw.githubusercontent.com/<ton_user>/<ton_repo>/main/gadgets.json",
  // "https://raw.githubusercontent.com/<ton_user>/<ton_repo>/main/grenades.json",
];

const LOCAL_SOURCES = [
  path.join(__dirname, "data", "weapons.json"),
  path.join(__dirname, "data", "attachments.json"),
  path.join(__dirname, "data", "gadgets.json"),
  path.join(__dirname, "data", "grenades.json"),
];

async function readRemote(url) {
  const res = await axios.get(url, { timeout: 15000 });
  return res.data;
}

function readLocal(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function normalize(data) {
  // Attend n’importe quel format courant et retourne { weapons, attachments, gadgets, grenades }
  const out = { weapons: [], attachments: {}, gadgets: [], grenades: [] };

  const pushWeapons = (arr) => {
    if (Array.isArray(arr)) out.weapons.push(...arr);
    else if (arr && Array.isArray(arr.weapons)) out.weapons.push(...arr.weapons);
  };

  const mergeObj = (src) => {
    if (!src || typeof src !== "object") return;
    if (src.attachments && typeof src.attachments === "object") {
      out.attachments = { ...out.attachments, ...src.attachments };
    }
    if (Array.isArray(src.gadgets)) out.gadgets = src.gadgets;
    if (Array.isArray(src.grenades)) out.grenades = src.grenades;
  };

  // si data est un tableau d’armes
  if (Array.isArray(data)) pushWeapons(data);
  // si data est un objet
  if (data && typeof data === "object") {
    pushWeapons(data);
    mergeObj(data);
  }
  return out;
}

async function run() {
  console.log("🔄 Mise à jour de la base d’armes Battlefield…");

  const collected = [];

  // 1) Essaye d’abord les sources distantes
  for (const url of REMOTE_SOURCES) {
    try {
      console.log("🌐 Lecture distante :", url);
      const d = await readRemote(url);
      collected.push(normalize(d));
    } catch (e) {
      console.warn("⚠️ Échec remote:", url, "-", e.message);
    }
  }

  // 2) Complète avec les fichiers locaux (fallback)
  for (const p of LOCAL_SOURCES) {
    try {
      console.log("📁 Lecture locale  :", p);
      const d = readLocal(p);
      if (d) collected.push(normalize(d));
    } catch (e) {
      console.warn("⚠️ Échec local:", p, "-", e.message);
    }
  }

  // Fusion
  const merged = {
    meta: {
      generatedAt: new Date().toISOString(),
      remoteSourcesTried: REMOTE_SOURCES,
      localSourcesUsed: LOCAL_SOURCES.filter((p) => fs.existsSync(p))
    },
    weapons: [],
    attachments: {},
    gadgets: [],
    grenades: []
  };

  for (const pack of collected) {
    if (!pack) continue;
    if (Array.isArray(pack.weapons)) merged.weapons.push(...pack.weapons);
    if (pack.attachments) merged.attachments = { ...merged.attachments, ...pack.attachments };
    if (Array.isArray(pack.gadgets) && pack.gadgets.length) merged.gadgets = pack.gadgets;
    if (Array.isArray(pack.grenades) && pack.grenades.length) merged.grenades = pack.grenades;
  }

  // Dé-doublonnage basique par "name"
  const seen = new Set();
  merged.weapons = merged.weapons.filter((w) => {
    if (!w || !w.name) return false;
    const key = w.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const outPath = path.join(__dirname, "armes.json");
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf8");
  console.log(`✅ armes.json mis à jour (${merged.weapons.length} armes, ${Object.keys(merged.attachments).length} groupes d’accessoires)`);
}

run().catch((e) => {
  console.error("❌ Erreur lors de la génération :", e);
  process.exit(1);
});
