/* script.js — version FR pour ton format armes.json (clés : nom, categorie, stats.degats, cadence, portee) */

let dbData = null;
const LS_KEY = "bf6_classes_v1";

async function loadData() {
  try {
    const res = await fetch("./armes.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    dbData = await res.json();
    hydrateUI();
  } catch (e) {
    console.error("Chargement armes.json échoué:", e);
    alert("⚠️ Impossible de charger armes.json. Vérifie qu'il est dans le même dossier que index.html et lance le site via http (ex: npx serve).");
  }
}

function $(q){ return document.querySelector(q); }
function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }

function hydrateUI() {
  // Types
  const types = [...new Set((dbData.armes || []).map(w => w.categorie))].sort();
  const selType = $("#weaponType");
  selType.innerHTML = `<option value="">Tous</option>` + types.map(t => `<option value="${t}">${cap(t)}</option>`).join("");

  // Armes
  fillWeapons();

  // Accessoires
  const slots = dbData.accessoires || {};
  fillSelect("#slot-sights", slots.viseurs || ["—"]);
  fillSelect("#slot-barrels", slots.canons || ["—"]);
  fillSelect("#slot-muzzles", slots.bouches || ["—"]);
  fillSelect("#slot-underbarrels", slots["sous-canons"] || ["—"]);
  fillSelect("#slot-magazines", slots.chargeurs || ["—"]);
  fillSelect("#slot-stocks", slots.crosses || ["—"]);
  fillSelect("#slot-camouflages", slots.camouflages || ["—"]);

  // Gadgets / grenades
  fillSelect("#gadget1", dbData.gadgets || []);
  fillSelect("#gadget2", dbData.gadgets || []);
  fillSelect("#grenade", dbData.grenades || []);

  // Render classes
  renderCards();
}

function fillSelect(selSelector, arr){
  const el = document.querySelector(selSelector);
  if(!el) return;
  el.innerHTML = (arr||[]).map(v=>`<option>${v}</option>`).join("");
}

function fillWeapons() {
  const type = $("#weaponType").value;
  const search = $("#searchBar").value.trim().toLowerCase();
  const sel = $("#weaponName");
  const list = (dbData.armes || [])
    .filter(w => !type || w.categorie === type)
    .filter(w => !search || w.nom.toLowerCase().includes(search))
    .sort((a,b)=>a.nom.localeCompare(b.nom));

  sel.innerHTML = `<option value="">— Choisir —</option>` + list.map(w=>`<option value="${w.nom}" data-type="${w.categorie}">${w.nom}</option>`).join("");
}

/* Events */
$("#weaponType").addEventListener("change", fillWeapons);
$("#searchBar").addEventListener("input", fillWeapons);

/* Stats affichage */
$("#weaponName").addEventListener("change", e=>{
  const name = e.target.value;
  const arme = (dbData.armes || []).find(w => w.nom === name);
  const box = $("#weaponStats");
  if (!arme) { box.innerHTML = "<p>Sélectionne une arme pour afficher ses statistiques.</p>"; return; }
  const s = arme.stats || {};
  box.innerHTML = `
    <div class="flex items-baseline gap-2 mb-1">
      <h3 class="text-lg font-semibold text-blue-300">${arme.nom}</h3>
      <span class="text-xs text-gray-400">${cap(arme.categorie)}</span>
    </div>
    <div class="grid grid-cols-3 gap-2">
      <div>⚔️ Dégâts<br><span class="text-blue-200">${s.degats ?? "—"}</span></div>
      <div>⚡ Cadence<br><span class="text-blue-200">${s.cadence ?? "—"}</span></div>
      <div>📏 Portée<br><span class="text-blue-200">${s.portee ?? "—"}</span></div>
    </div>
  `;
});

/* Sauvegarde classe */
$("#saveBtn").addEventListener("click", ()=>{
  const weapon = $("#weaponName").value;
  if (!weapon) return alert("Choisis une arme d'abord.");
  const cls = {
    id: "c_"+Math.random().toString(36).slice(2,9),
    createdAt: Date.now(),
    weaponType: $("#weaponType").value || "",
    weaponName: weapon,
    slots: {
      sights: $("#slot-sights").value,
      barrels: $("#slot-barrels").value,
      muzzles: $("#slot-muzzles").value,
      underbarrels: $("#slot-underbarrels").value,
      magazines: $("#slot-magazines").value,
      stocks: $("#slot-stocks").value,
      camouflages: $("#slot-camouflages").value
    },
    gadget1: $("#gadget1").value,
    gadget2: $("#gadget2").value,
    grenade: $("#grenade").value
  };
  const arr = loadClasses();
  arr.unshift(cls);
  saveClasses(arr);
  renderCards();
  alert("✅ Classe enregistrée !");
});

function loadClasses(){
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveClasses(arr){
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

function renderCards(){
  const wrap = $("#cards");
  const arr = loadClasses();
  if (!arr.length){ wrap.innerHTML = `<div class="text-gray-400 text-sm">Aucune classe enregistrée pour l’instant.</div>`; return; }
  wrap.innerHTML = arr.map(c=>`
    <div class="bg-slate-800 rounded p-3 border border-slate-700">
      <div class="flex items-center justify-between mb-2">
        <div class="font-semibold">${c.weaponName}</div>
        <div class="text-xs text-gray-400">${new Date(c.createdAt).toLocaleString()}</div>
      </div>
      <div class="text-xs text-gray-300">Type: ${cap(c.weaponType || "—")}</div>
      <div class="text-xs text-gray-300">Viseur: ${c.slots.sights} · Canon: ${c.slots.barrels} · Bouche: ${c.slots.muzzles}</div>
      <div class="text-xs text-gray-300">Sous-canon: ${c.slots.underbarrels} · Chargeur: ${c.slots.magazines} · Crosse: ${c.slots.stocks}</div>
      <div class="text-xs text-gray-300">Camo: ${c.slots.camouflages}</div>
      <div class="text-xs text-gray-300">G1: ${c.gadget1} · G2: ${c.gadget2} · Grenade: ${c.grenade}</div>
      <div class="mt-2 flex gap-2">
        <button data-id="${c.id}" class="dup px-2 py-1 bg-slate-700 rounded text-xs">Dupliquer</button>
        <button data-id="${c.id}" class="del px-2 py-1 bg-red-600 rounded text-xs">Supprimer</button>
      </div>
    </div>
  `).join("");

  wrap.querySelectorAll(".del").forEach(b=>b.addEventListener("click", e=>{
    const id = e.target.dataset.id;
    const arr = loadClasses().filter(x=>x.id !== id);
    saveClasses(arr); renderCards();
  }));
  wrap.querySelectorAll(".dup").forEach(b=>b.addEventListener("click", e=>{
    const id = e.target.dataset.id;
    const arr = loadClasses();
    const idx = arr.findIndex(x=>x.id===id);
    if (idx>=0){ const copy = {...arr[idx], id:"c_"+Math.random().toString(36).slice(2,9), createdAt:Date.now()}; arr.unshift(copy); saveClasses(arr); renderCards(); }
  }));
}

/* Export / Import */
$("#exportBtn").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(loadClasses(), null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bf6_classes_export.json";
  document.body.appendChild(a); a.click(); a.remove();
});

$("#importInput").addEventListener("change", (ev)=>{
  const file = ev.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) saveClasses(data);
      else saveClasses([data]);
      renderCards();
      alert("✅ Import réussi !");
    } catch { alert("⚠️ Fichier JSON invalide."); }
  };
  reader.readAsText(file);
  ev.target.value = "";
});

/* Partage */
$("#shareBtn").addEventListener("click", ()=>{
  const cls = loadClasses()[0];
  if (!cls) return alert("Enregistre d’abord une classe.");
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(cls))));
  const url = new URL(window.location.href);
  url.searchParams.set("class", payload);
  navigator.clipboard.writeText(url.toString()).then(()=>alert("🔗 Lien copié !"));
});

(function loadShared(){
  const p = new URLSearchParams(location.search).get("class");
  if (!p) return;
  try {
    const cls = JSON.parse(decodeURIComponent(escape(atob(p))));
    const arr = loadClasses(); arr.unshift(cls); saveClasses(arr);
    renderCards();
    alert("📥 Classe importée depuis le lien.");
  } catch {}
})();

window.addEventListener("DOMContentLoaded", loadData);
