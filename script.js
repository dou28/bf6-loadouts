// script.js (version corrigée & robuste)
// --------------------------------------------------
// Dépendances : supabase-config.js (exporte `supabase`)
// index.html doit charger ce script avec type="module"
// --------------------------------------------------

import { supabase } from "./supabase-config.js";

/* ----------------------------- DOM ----------------------------- */
const userEmailEl = document.getElementById("userEmail");
const banner = document.getElementById("banner");

const logoutBtn  = document.getElementById("logoutBtn");
const saveBtn    = document.getElementById("saveBtn");
const exportBtn  = document.getElementById("exportBtn");
const importIn   = document.getElementById("importInput");
const shareBtn   = document.getElementById("shareBtn");

const cardsDiv   = document.getElementById("cards");
const statsDiv   = document.getElementById("weaponStats");

const selType = document.getElementById("weaponType");
const selArme = document.getElementById("weaponName");

const sSights  = document.getElementById("slot-sights");
const sBarrels = document.getElementById("slot-barrels");
const sMuzzles = document.getElementById("slot-muzzles");
const sUnder   = document.getElementById("slot-underbarrels");
const sMags    = document.getElementById("slot-magazines");
const sStocks  = document.getElementById("slot-stocks");
const sCamos   = document.getElementById("slot-camouflages");
const g1       = document.getElementById("gadget1");
const g2       = document.getElementById("gadget2");
const nade     = document.getElementById("grenade");

const notifBox = document.getElementById("saveNotif");

/* ----------------------------- State ---------------------------- */
let session = null;
let armesData = null;

/* ----------------------------- Utils ---------------------------- */
const notif = (msg)=> {
  if (!notifBox) return;
  notifBox.textContent = msg;
  notifBox.classList.add("show");
  setTimeout(()=>notifBox.classList.remove("show"), 2200);
};

/* ---------- Modal générique (retourne valeur ou null) ---------- */
function openModal(title, placeholder="", extra="", confirmText="OK") {
  return new Promise(resolve => {
    const bg = document.getElementById("modalBg");
    const t = document.getElementById("modalTitle");
    const i = document.getElementById("modalInput");
    const e = document.getElementById("modalExtra");
    const c = document.getElementById("modalCancel");
    const ok = document.getElementById("modalConfirm");

    if (!bg || !t || !i || !c || !ok) {
      // si modal absent → fallback simple
      const val = prompt(title, placeholder || "");
      resolve(val);
      return;
    }

    t.textContent = title;
    i.value = "";
    i.placeholder = placeholder;
    e.classList.toggle("hidden", !extra);
    e.textContent = extra;
    ok.textContent = confirmText;

    bg.classList.add("show");
    i.focus();

    const cleanup = () => {
      bg.classList.remove("show");
      c.onclick = null;
      ok.onclick = null;
      i.onkeydown = null;
    };

    c.onclick = () => { cleanup(); resolve(null); };
    ok.onclick = () => { const v = i.value || null; cleanup(); resolve(v); };
    i.onkeydown = ev => { if (ev.key === "Enter") { const v = i.value || null; cleanup(); resolve(v); } };
  });
}

/* ----------------------------- Données -------------------------- */
const getPayload = (nameOverride=null) => {
  const name = nameOverride ?? (selArme.value ? `${selArme.value}` : "Classe sans nom");
  return {
    user_id: session.user.id,
    name,
    weapon: selArme.value,
    type: selType.value,
    accessories: {
      viseur: sSights.value, canon: sBarrels.value, bouche: sMuzzles.value,
      souscanon: sUnder.value, chargeur: sMags.value, crosse: sStocks.value,
      camouflage: sCamos.value,
    },
    gadgets: { gadget1: g1.value, gadget2: g2.value, grenade: nade.value },
  };
};

function fillSelect(select, list = []) {
  if (!select) return;
  select.innerHTML = "";
  list.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

function afficherStats() {
  const armeNom = selArme.value;
  const arme = (armesData?.armes || []).find(a => a.nom === armeNom);
  if (!arme) {
    statsDiv.innerHTML = "<p>Sélectionne une arme pour afficher ses statistiques.</p>";
    return;
  }
  statsDiv.innerHTML = `
    <div class="flex justify-between">
      <div><strong>${arme.nom}</strong> — ${arme.categorie}</div>
      <div class="text-sm text-gray-300">${(arme.stats?.degats ?? "-")} dmg · ${(arme.stats?.cadence ?? "-")} RPM · ${(arme.stats?.portee ?? "-")} m</div>
    </div>`;
}

/* --------------------------- Auth / Session ---------------------- */
async function ensureSession() {
  try {
    const { data:sessionData } = await supabase.auth.getSession();
    session = sessionData?.session || null;
    supabase.auth.onAuthStateChange((_e, s)=>{ session = s; if(!s?.user) location.href="login.html"; });
    if (!session?.user) {
      location.href = "login.html";
      return false;
    } else {
      userEmailEl.textContent = `Bienvenue, ${session.user.email}`;
      return true;
    }
  } catch (err) {
    console.error("Erreur session auth:", err);
    return false;
  }
}

/* ---------------------------- Armes.json ------------------------- */
/**
 * Essaie automatiquement plusieurs chemins possibles pour le fichier armes.
 * Retourne true si chargé correctement, false sinon.
 */
async function chargerArmes() {
  const candidates = [
    "./data/armes.json",
    "./armes.json",
    "./data/weapons.json",
    "./weapons.json"
  ];

  let res = null, lastErr = null;
  for (const path of candidates) {
    try {
      res = await fetch(path);
    } catch (err) {
      lastErr = err;
      res = null;
    }
    if (res && res.ok) {
      try {
        armesData = await res.json();
      } catch (err) {
        console.error("Erreur JSON parsing pour", path, err);
        lastErr = err;
        armesData = null;
      }
      break;
    }
  }

  if (!armesData) {
    console.error("Impossible de charger armes.json — erreur précédente:", lastErr);
    alert("⚠️ Impossible de charger les armes. Vérifie que le fichier armes.json (ou data/armes.json) existe et est valide.");
    return false;
  }

  // Remplir selects
  selType.innerHTML = `<option value="">Tous</option>`;
  const types = [...new Set((armesData.armes || []).map(a => a.categorie || "Autre"))];
  types.forEach(t => selType.innerHTML += `<option value="${t}">${t}</option>`);

  fillSelect(sSights,  armesData.accessoires?.viseurs || []);
  fillSelect(sBarrels, armesData.accessoires?.canons || []);
  fillSelect(sMuzzles, armesData.accessoires?.bouches || []);
  fillSelect(sUnder,   armesData.accessoires?.["sous-canons"] || armesData.accessoires?.souscanon || []);
  fillSelect(sMags,    armesData.accessoires?.chargeurs || []);
  fillSelect(sStocks,  armesData.accessoires?.crosses || armesData.accessoires?.crosses || []);
  fillSelect(sCamos,   armesData.accessoires?.camouflages || []);
  fillSelect(g1,       armesData.gadgets || []);
  fillSelect(g2,       armesData.gadgets || []);
  fillSelect(nade,     armesData.grenades || []);

  // Armes list
  const remplirArmes = () => {
    const type = selType.value;
    selArme.innerHTML = `<option value="">— Choisir —</option>`;
    (armesData.armes || []).filter(a => !type || (a.categorie === type)).forEach(a => {
      const o = document.createElement("option");
      o.value = a.nom;
      o.textContent = a.nom;
      selArme.appendChild(o);
    });
  };

  selType.addEventListener("change", remplirArmes);
  selArme.addEventListener("change", afficherStats);
  remplirArmes();

  return true;
}

/* ------------------------------ CRUD ---------------------------- */
async function loadClasses() {
  if (!session?.user) return;
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending:false });

  if (error) {
    console.error("Erreur loadClasses:", error);
    return;
  }

  cardsDiv.innerHTML = "";
  data.forEach(cls => {
    const card = document.createElement("div");
    card.className = "bg-slate-700 p-4 rounded shadow";
    card.innerHTML = `
      <div class="flex justify-between items-center gap-4">
        <div class="min-w-0">
          <p class="font-semibold text-blue-300 truncate">${cls.name || cls.weapon}</p>
          <p class="text-xs text-gray-400">${cls.weapon} · ${cls.type || ""}</p>
        </div>
        <div class="flex gap-2 shrink-0">
          <button data-edit="${cls.id}" class="px-2 py-1 bg-amber-500 rounded text-sm hover:bg-amber-400">Modifier</button>
          <button data-rename="${cls.id}" class="px-2 py-1 bg-sky-600 rounded text-sm hover:bg-sky-500">Renommer</button>
          <button data-del="${cls.id}"  class="px-2 py-1 bg-red-600 rounded text-sm hover:bg-red-500">🗑</button>
        </div>
      </div>`;
    cardsDiv.appendChild(card);
  });

  // Attacher handlers (edit / rename / delete)
  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.getAttribute("data-edit");
      const { data, error } = await supabase.from("classes").select("*").eq("id", id).single();
      if (error) return alert("❌ " + error.message);
      selType.value = data.type || "";
      selType.dispatchEvent(new Event("change"));
      selArme.value = data.weapon || "";
      afficherStats();

      const acc = data.accessories || {};
      sSights.value = acc.viseur || ""; sBarrels.value = acc.canon || ""; sMuzzles.value = acc.bouche || "";
      sUnder.value  = acc.souscanon || ""; sMags.value = acc.chargeur || ""; sStocks.value = acc.crosse || "";
      sCamos.value  = acc.camouflage || "";
      const g = data.gadgets || {};
      g1.value = g.gadget1 || ""; g2.value = g.gadget2 || ""; nade.value = g.grenade || "";
      notif("🔄 Classe chargée.");
    };
  });

  document.querySelectorAll("[data-rename]").forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.getAttribute("data-rename");
      const newName = await openModal("Renommer la classe", "Nouveau nom...");
      if (!newName) return;
      const { error } = await supabase.from("classes").update({ name:newName }).eq("id", id);
      if (error) return alert("❌ " + error.message);
      await loadClasses();
    };
  });

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.getAttribute("data-del");
      const confirmDel = await openModal("Confirmer la suppression", "Tape SUPPRIMER pour confirmer");
      if (!confirmDel) return;
      if (confirmDel.toUpperCase() !== "SUPPRIMER") return;
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) return alert("❌ " + error.message);
      await loadClasses();
    };
  });
}

/* ------------------------ Boutons principaux -------------------- */
logoutBtn.addEventListener("click", async ()=>{
  const { error } = await supabase.auth.signOut();
  if (error) { alert("❌ " + error.message); return; }
  location.href = "login.html";
});

saveBtn.addEventListener("click", async ()=>{
  if (!selArme.value) return alert("Sélectionne une arme avant d’enregistrer.");
  const name = await openModal("Nom de la classe", "Ex: Fusil AK24 rapide");
  if (!name) return;
  const payload = getPayload(name);
  const { error } = await supabase.from("classes").insert([payload]);
  if (error) return alert("❌ " + error.message);
  notif("✅ Classe enregistrée !");
  await loadClasses();
});

exportBtn.addEventListener("click", ()=>{
  if (!selArme.value) return alert("Sélectionne une arme à exporter.");
  const data = getPayload();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(data.name || "classe").replace(/\s+/g,'_')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

importIn.addEventListener("change", async (e)=>{
  const file = e.target.files?.[0]; if (!file) return;
  const txt = await file.text();
  try {
    const obj = JSON.parse(txt);
    selType.value = obj.type || "";
    selType.dispatchEvent(new Event("change"));
    selArme.value = obj.weapon || ""; afficherStats();
    const acc = obj.accessories || {};
    sSights.value = acc.viseur || ""; sBarrels.value = acc.canon || ""; sMuzzles.value = acc.bouche || "";
    sUnder.value  = acc.souscanon || ""; sMags.value = acc.chargeur || ""; sStocks.value = acc.crosse || "";
    sCamos.value  = acc.camouflage || "";
    const g = obj.gadgets || {};
    g1.value = g.gadget1 || ""; g2.value = g.gadget2 || ""; nade.value = g.grenade || "";
    notif("📥 Classe importée !");
  } catch (err) {
    console.error("Import error:", err);
    alert("❌ Fichier invalide.");
  }
  importIn.value = "";
});

shareBtn.addEventListener("click", async ()=>{
  if (!selArme.value) return alert("Sélectionne une arme avant de partager.");
  const payload = getPayload();
  const pub = { ...payload, owner_id: session.user.id };
  const { data, error } = await supabase.from("public_classes").insert([pub]).select("id").single();
  if (error) { console.error("share error:", error); return alert("❌ " + error.message); }

  const shareUrl = `${location.origin}${location.pathname}?shared=${data.id}`;
  try { await navigator.clipboard.writeText(shareUrl); } catch {}
  await openModal("Lien de partage", "", shareUrl, "Fermer");
});

/* ---------------------- Chargement partagé ---------------------- */
async function handleShared() {
  const params = new URLSearchParams(location.search);
  const sharedId = params.get("shared");
  if (!sharedId) return;
  banner.classList.remove("hidden");
  try {
    const { data, error } = await supabase.from("public_classes").select("*").eq("id", sharedId).single();
    if (!error && data) {
      selType.value = data.type || "";
      selType.dispatchEvent(new Event("change"));
      selArme.value = data.weapon || ""; afficherStats();
      const acc = data.accessories || {};
      sSights.value = acc.viseur || ""; sBarrels.value = acc.canon || ""; sMuzzles.value = acc.bouche || "";
      sUnder.value  = acc.souscanon || ""; sMags.value = acc.chargeur || ""; sStocks.value = acc.crosse || "";
      sCamos.value  = acc.camouflage || "";
      const g = data.gadgets || {};
      g1.value = g.gadget1 || ""; g2.value = g.gadget2 || ""; nade.value = g.grenade || "";
      notif("🔎 Classe publique chargée");
    } else {
      console.warn("shared load error:", error);
    }
  } catch (e) {
    console.warn("handleShared error:", e);
  }
}

/* --------------------------- Boot ------------------------------- */
(async function boot(){
  const ok = await ensureSession();
  if (!ok) return;
  const loaded = await chargerArmes();
  if (!loaded) {
    // on arrête le boot pour éviter autres erreurs
    return;
  }
  await handleShared();
  await loadClasses();
})();
