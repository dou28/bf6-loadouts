import { supabase } from "./supabase-config.js";

// ------- Références DOM -------
const userEmailEl = document.getElementById("userEmail");
const logoutBtn   = document.getElementById("logoutBtn");
const saveBtn     = document.getElementById("saveBtn");
const cardsDiv    = document.getElementById("cards");
const statsDiv    = document.getElementById("weaponStats");

// Sélecteurs
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

// ------- Etat -------
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

// ------- Auth / Session -------

// 1) récupérer la session au chargement
const { data:sessionData } = await supabase.auth.getSession();
session = sessionData?.session || null;

// 2) écouter les changements (login/logout)
supabase.auth.onAuthStateChange((_event, newSession) => {
  session = newSession;
  if (!session?.user) {
    // si déconnecté → aller au login
    window.location.href = "login.html";
  }
});

// si pas de session → login
if (!session?.user) {
  window.location.href = "login.html";
} else {
  userEmailEl.textContent = `Bienvenue, ${session.user.email}`;
}

// bouton logout
logoutBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) { alert("❌ " + error.message); return; }
  window.location.href = "login.html";
});

// ------- Armes.json -------

async function chargerArmes() {
  try {
    const res = await fetch("./armes.json");
    armesData = await res.json();

    // Types
    selType.innerHTML = `<option value="">Tous</option>`;
    const types = [...new Set(armesData.armes.map(a => a.categorie))];
    types.forEach(t => selType.innerHTML += `<option value="${t}">${t}</option>`);

    // Accessoires / Gadgets
    fillSelect(sSights,  armesData.accessoires.viseurs);
    fillSelect(sBarrels, armesData.accessoires.canons);
    fillSelect(sMuzzles, armesData.accessoires.bouches);
    fillSelect(sUnder,   armesData.accessoires["sous-canons"] ?? armesData.accessoires["souscanon"] ?? []);
    fillSelect(sMags,    armesData.accessoires.chargeurs);
    fillSelect(sStocks,  armesData.accessoires.crosses);
    fillSelect(sCamos,   armesData.accessoires.camouflages);
    fillSelect(g1,       armesData.gadgets);
    fillSelect(g2,       armesData.gadgets);
    fillSelect(nade,     armesData.grenades);

    // Armes
    remplirArmes();
    selType.addEventListener("change", remplirArmes);
    selArme.addEventListener("change", afficherStats);
  } catch (e) {
    console.error("Erreur chargement armes.json :", e);
    alert("❌ Impossible de charger armes.json (mets-le à la racine).");
  }
}

function fillSelect(select, list = []) {
  select.innerHTML = "";
  list.forEach(v => select.innerHTML += `<option>${v}</option>`);
}

function remplirArmes() {
  const type = selType.value;
  selArme.innerHTML = `<option value="">— Choisir —</option>`;
  (armesData?.armes || [])
    .filter(a => !type || a.categorie === type)
    .forEach(a => selArme.innerHTML += `<option value="${a.nom}">${a.nom}</option>`);
}

function afficherStats() {
  const armeNom = selArme.value;
  const arme = (armesData?.armes || []).find(a => a.nom === armeNom);
  if (!arme) { statsDiv.innerHTML = "<p>Sélectionne une arme pour afficher ses statistiques.</p>"; return; }
  statsDiv.innerHTML = `
    <div class="flex justify-between">
      <div><strong>${arme.nom}</strong> — ${arme.categorie}</div>
      <div class="text-sm text-gray-300">${arme.stats.degats} dmg · ${arme.stats.cadence} RPM · ${arme.stats.portee} m</div>
    </div>`;
}

// ------- Classes (Supabase) -------

async function loadClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending:false })
    .limit(100);

  if (error) { console.error(error); return; }

  cardsDiv.innerHTML = "";
  data.forEach(cls => {
    const card = document.createElement("div");
    card.className = "bg-slate-700 p-4 rounded shadow";
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <p class="font-semibold text-blue-300">${cls.name || cls.weapon}</p>
          <p class="text-xs text-gray-400">${cls.type || ""}</p>
        </div>
        <div class="flex gap-2">
          <button data-edit="${cls.id}" class="px-2 py-1 bg-amber-500 rounded text-sm hover:bg-amber-400">Modifier</button>
          <button data-del="${cls.id}"  class="px-2 py-1 bg-red-600 rounded text-sm hover:bg-red-500">🗑</button>
        </div>
      </div>`;
    cardsDiv.appendChild(card);
  });

  // Modifier
  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.getAttribute("data-edit");
      const { data, error } = await supabase.from("classes").select("*").eq("id", id).single();
      if (error) return alert("❌ " + error.message);
      // réinjecte dans l’UI
      selType.value = data.type || ""; remplirArmes();
      selArme.value = data.weapon || ""; afficherStats();
      const acc = data.accessories || {};
      sSights.value  = acc.viseur || ""; sBarrels.value = acc.canon || ""; sMuzzles.value = acc.bouche || "";
      sUnder.value   = acc.souscanon || ""; sMags.value = acc.chargeur || ""; sStocks.value = acc.crosse || "";
      sCamos.value   = acc.camouflage || "";
      const g = data.gadgets || {};
      g1.value = g.gadget1 || ""; g2.value = g.gadget2 || ""; nade.value = g.grenade || "";
      notif("🔄 Classe chargée dans le configurateur");
    });
  });

  // Supprimer
  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.getAttribute("data-del");
      if (!confirm("Supprimer cette classe ?")) return;
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) return alert("❌ " + error.message);
      await loadClasses();
    });
  });
}

// Enregistrer une nouvelle classe
saveBtn.addEventListener("click", async () => {
  if (!selArme.value) return alert("Sélectionne une arme avant d’enregistrer.");

  const payload = {
    user_id: session.user.id,
    name: `${selArme.value} · ${selType.value || "Sans type"}`,
    weapon: selArme.value,
    type: selType.value,
    accessories: getConfig().accessories,
    gadgets: getConfig().gadgets
  };

  const { error } = await supabase.from("classes").insert([payload]);
  if (error) { console.error(error); return alert("❌ Erreur lors de la sauvegarde."); }
  notif("✅ Classe enregistrée !");
  await loadClasses();
});

// ------- Boot -------

await chargerArmes();   // remplit tous les selects à partir d'armes.json
await loadClasses();   // charge les classes liées à l’utilisateur connecté
