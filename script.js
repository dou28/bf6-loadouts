import { supabase } from "./supabase-config.js";

// ------- DOM -------
const userEmailEl = document.getElementById("userEmail");
const logoutBtn   = document.getElementById("logoutBtn");
const saveBtn     = document.getElementById("saveBtn");
const exportBtn   = document.getElementById("exportBtn");
const cardsDiv    = document.getElementById("cards");
const statsDiv    = document.getElementById("weaponStats");

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

let session = null;
let armesData = null;

// ------- Helpers -------
const notif = (msg)=> {
  const n = document.getElementById("saveNotif");
  n.textContent = msg;
  n.classList.add("show");
  setTimeout(()=>n.classList.remove("show"), 2200);
};

const getConfig = () => ({
  weapon: selArme.value,
  type: selType.value,
  accessories: {
    viseur: sSights.value, canon: sBarrels.value, bouche: sMuzzles.value,
    souscanon: sUnder.value, chargeur: sMags.value, crosse: sStocks.value,
    camouflage: sCamos.value
  },
  gadgets: { gadget1: g1.value, gadget2: g2.value, grenade: nade.value }
});

// ------- Auth -------
const { data:sessionData } = await supabase.auth.getSession();
session = sessionData?.session || null;

supabase.auth.onAuthStateChange((_event, newSession) => {
  session = newSession;
  if (!session?.user) window.location.href = "login.html";
});

if (!session?.user) window.location.href = "login.html";
else userEmailEl.textContent = `Bienvenue, ${session.user.email}`;

logoutBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) alert("❌ " + error.message);
  else window.location.href = "login.html";
});

// ------- Charger armes.json -------
async function chargerArmes() {
  const res = await fetch("./armes.json");
  armesData = await res.json();
  const types = [...new Set(armesData.armes.map(a => a.categorie))];
  selType.innerHTML = `<option value="">Tous</option>`;
  types.forEach(t => selType.innerHTML += `<option value="${t}">${t}</option>`);
  remplirArmes();
  selType.addEventListener("change", remplirArmes);
  selArme.addEventListener("change", afficherStats);

  fillSelect(sSights,  armesData.accessoires.viseurs);
  fillSelect(sBarrels, armesData.accessoires.canons);
  fillSelect(sMuzzles, armesData.accessoires.bouches);
  fillSelect(sUnder,   armesData.accessoires["sous-canons"]);
  fillSelect(sMags,    armesData.accessoires.chargeurs);
  fillSelect(sStocks,  armesData.accessoires.crosses);
  fillSelect(sCamos,   armesData.accessoires.camouflages);
  fillSelect(g1,       armesData.gadgets);
  fillSelect(g2,       armesData.gadgets);
  fillSelect(nade,     armesData.grenades);
}

function fillSelect(select, list = []) {
  select.innerHTML = "";
  list.forEach(v => select.innerHTML += `<option>${v}</option>`);
}

function remplirArmes() {
  const type = selType.value;
  selArme.innerHTML = `<option value="">— Choisir —</option>`;
  armesData.armes.filter(a => !type || a.categorie === type)
    .forEach(a => selArme.innerHTML += `<option value="${a.nom}">${a.nom}</option>`);
}

function afficherStats() {
  const arme = armesData.armes.find(a => a.nom === selArme.value);
  if (!arme) return statsDiv.innerHTML = "<p>Sélectionne une arme.</p>";
  statsDiv.innerHTML = `<strong>${arme.nom}</strong> — ${arme.categorie}<br>
  Dégâts: ${arme.stats.degats}, Cadence: ${arme.stats.cadence}, Portée: ${arme.stats.portee}`;
}

// ------- Classes -------
async function loadClasses() {
  const { data, error } = await supabase.from("classes").select("*").eq("user_id", session.user.id).order("created_at",{ascending:false});
  if (error) return console.error(error);

  cardsDiv.innerHTML = "";
  data.forEach(cls => {
    const card = document.createElement("div");
    card.className = "bg-slate-700 p-4 rounded shadow";
    const publicIcon = cls.is_public ? "🌍" : "🔒";
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <p class="font-semibold text-blue-300">${cls.name || cls.weapon}</p>
          <p class="text-xs text-gray-400">${publicIcon} ${cls.type || ""}</p>
        </div>
        <div class="flex gap-2">
          ${cls.is_public ? `<button class="px-2 py-1 bg-emerald-600 text-sm rounded shareBtn" data-id="${cls.id}">Partager</button>` : ""}
          <button data-edit="${cls.id}" class="px-2 py-1 bg-amber-500 rounded text-sm hover:bg-amber-400">Modifier</button>
          <button data-del="${cls.id}"  class="px-2 py-1 bg-red-600 rounded text-sm hover:bg-red-500">🗑</button>
        </div>
      </div>`;
    cardsDiv.appendChild(card);
  });

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.target.getAttribute("data-edit");
      const { data, error } = await supabase.from("classes").select("*").eq("id", id).single();
      if (error) return alert("❌ " + error.message);
      selType.value = data.type || ""; remplirArmes();
      selArme.value = data.weapon || ""; afficherStats();
      const acc = data.accessories || {};
      sSights.value = acc.viseur || ""; sBarrels.value = acc.canon || "";
      sMuzzles.value = acc.bouche || ""; sUnder.value = acc.souscanon || "";
      sMags.value = acc.chargeur || ""; sStocks.value = acc.crosse || "";
      sCamos.value = acc.camouflage || "";
      const g = data.gadgets || {};
      g1.value = g.gadget1 || ""; g2.value = g.gadget2 || ""; nade.value = g.grenade || "";
      notif("Classe chargée !");
    });
  });

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async e => {
      if (!confirm("Supprimer cette classe ?")) return;
      const id = e.target.getAttribute("data-del");
      await supabase.from("classes").delete().eq("id", id);
      loadClasses();
    });
  });

  document.querySelectorAll(".shareBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.target.getAttribute("data-id");
      const link = `${window.location.origin}/?class=${id}`;
      navigator.clipboard.writeText(link);
      notif("🔗 Lien copié dans le presse-papiers !");
    });
  });
}

// ------- Sauvegarde -------
saveBtn.addEventListener("click", async () => {
  if (!selArme.value) return alert("Choisis une arme.");
  const className = prompt("Nom de ta classe :", `${selArme.value}`);
  if (!className) return;
  const isPublic = confirm("Rendre cette classe publique ? (OK = Oui, Annuler = Non)");

  const payload = {
    user_id: session.user.id,
    name: className,
    weapon: selArme.value,
    type: selType.value,
    accessories: getConfig().accessories,
    gadgets: getConfig().gadgets,
    is_public: isPublic
  };

  const { error } = await supabase.from("classes").insert([payload]);
  if (error) return alert("Erreur : " + error.message);
  notif("💾 Classe enregistrée !");
  loadClasses();
});

// ------- Export -------
exportBtn.addEventListener("click", () => {
  const config = getConfig();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${selArme.value || "classe"}.json`;
  a.click();
  notif("📦 Fichier exporté !");
});

// ------- Init -------
await chargerArmes();
await loadClasses();
