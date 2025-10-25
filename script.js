import { supabase } from "./supabase-config.js";

const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const saveBtn = document.getElementById("saveBtn");
const cardsDiv = document.getElementById("cards");

// Chargement utilisateur
let currentUser = null;
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session && session.user) {
    currentUser = session.user;
    userEmail.textContent = `Bienvenue, ${currentUser.email}`;
    logoutBtn.classList.remove("hidden");
    await loadClasses();
  } else {
    window.location.href = "login.html";
  }
});

// Déconnexion
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

// Sauvegarde automatique
saveBtn.addEventListener("click", saveCurrentClass);

async function saveCurrentClass() {
  const weapon = document.getElementById("weaponName").value;
  const type = document.getElementById("weaponType").value;
  if (!weapon) return alert("⚠️ Sélectionne une arme avant d’enregistrer.");

  const data = {
    user_id: currentUser.id,
    name: `${weapon} - ${type}`,
    weapon,
    type,
    accessories: {
      viseur: document.getElementById("slot-sights").value,
      canon: document.getElementById("slot-barrels").value,
      bouche: document.getElementById("slot-muzzles").value,
      souscanon: document.getElementById("slot-underbarrels").value,
      chargeur: document.getElementById("slot-magazines").value,
      crosse: document.getElementById("slot-stocks").value,
      camouflage: document.getElementById("slot-camouflages").value,
    },
    gadgets: {
      gadget1: document.getElementById("gadget1").value,
      gadget2: document.getElementById("gadget2").value,
      grenade: document.getElementById("grenade").value,
    },
  };

  const { error } = await supabase.from("classes").insert([data]);
  if (error) {
    console.error(error);
    alert("❌ Erreur lors de la sauvegarde !");
  } else {
    alert("✅ Classe enregistrée !");
    await loadClasses();
  }
}

// Chargement des classes
async function loadClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("user_id", currentUser.id);

  if (error) return console.error(error);

  cardsDiv.innerHTML = "";
  data.forEach((cls) => {
    const div = document.createElement("div");
    div.className = "bg-slate-700 p-4 rounded";
    div.innerHTML = `
      <p class="font-bold text-blue-400">${cls.name}</p>
      <p class="text-sm text-gray-300">${cls.weapon}</p>
      <button class="mt-2 px-2 py-1 bg-yellow-600 rounded text-sm hover:bg-yellow-500" data-id="${cls.id}">Modifier</button>
    `;
    div.querySelector("button").addEventListener("click", () => loadClass(cls));
    cardsDiv.appendChild(div);
  });
}

function loadClass(cls) {
  document.getElementById("weaponType").value = cls.type;
  document.getElementById("weaponName").value = cls.weapon;

  const acc = cls.accessories || {};
  document.getElementById("slot-sights").value = acc.viseur || "";
  document.getElementById("slot-barrels").value = acc.canon || "";
  document.getElementById("slot-muzzles").value = acc.bouche || "";
  document.getElementById("slot-underbarrels").value = acc.souscanon || "";
  document.getElementById("slot-magazines").value = acc.chargeur || "";
  document.getElementById("slot-stocks").value = acc.crosse || "";
  document.getElementById("slot-camouflages").value = acc.camouflage || "";

  const g = cls.gadgets || {};
  document.getElementById("gadget1").value = g.gadget1 || "";
  document.getElementById("gadget2").value = g.gadget2 || "";
  document.getElementById("grenade").value = g.grenade || "";

  alert("🔄 Configuration chargée !");
}
