import { supabase } from "./supabase-config.js";

const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const saveBtn = document.getElementById("saveBtn");
const cardsDiv = document.getElementById("cards");

// ----------- Chargement utilisateur -----------
let currentUser = null;
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session && session.user) {
    currentUser = session.user;
    userEmail.textContent = `Bienvenue, ${currentUser.email}`;
    logoutBtn.classList.remove("hidden");
    await chargerArmes();
    await chargerClasses();
  } else {
    window.location.href = "login.html";
  }
});

// ----------- Déconnexion -----------
logoutBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error(error);
  else window.location.href = "login.html";
});

// ----------- Charger les armes (depuis ton JSON local) -----------
async function chargerArmes() {
  try {
    const response = await fetch("./armes.json");
    const data = await response.json();

    const typeSelect = document.getElementById("weaponType");
    const weaponSelect = document.getElementById("weaponName");

    // Remplir les types
    const types = [...new Set(data.armes.map(a => a.categorie))];
    typeSelect.innerHTML = `<option value="">Tous</option>`;
    types.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      typeSelect.appendChild(opt);
    });

    // Mettre à jour la liste d’armes selon le type
    typeSelect.addEventListener("change", () => {
      weaponSelect.innerHTML = `<option value="">— Choisir —</option>`;
      const armesFiltrees = typeSelect.value
        ? data.armes.filter(a => a.categorie === typeSelect.value)
        : data.armes;
      armesFiltrees.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.nom;
        opt.textContent = a.nom;
        weaponSelect.appendChild(opt);
      });
    });

    // Initialiser la liste complète
    typeSelect.dispatchEvent(new Event("change"));
  } catch (err) {
    console.error("Erreur chargement armes.json :", err);
  }
}

// ----------- Sauvegarder la classe -----------
saveBtn.addEventListener("click", sauvegarderClasse);

async function sauvegarderClasse() {
  const weapon = document.getElementById("weaponName").value;
  const type = document.getElementById("weaponType").value;
  if (!weapon) return alert("⚠️ Sélectionne une arme avant d’enregistrer.");

  const data = {
    user_id: currentUser.id,
    name: `${weapon} (${type})`,
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
    await chargerClasses();
  }
}

// ----------- Charger les classes sauvegardées -----------
async function chargerClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("user_id", currentUser.id);

  if (error) {
    console.error(error);
    return;
  }

  cardsDiv.innerHTML = "";
  if (data.length === 0) {
    cardsDiv.innerHTML = `<p class="text-gray-400">Aucune classe enregistrée.</p>`;
    return;
  }

  data.forEach(cls => {
    const div = document.createElement("div");
    div.className = "bg-slate-700 p-4 rounded";
    div.innerHTML = `
      <p class="font-bold text-blue-400">${cls.name}</p>
      <p class="text-sm text-gray-300">${cls.weapon}</p>
      <div class="flex gap-2 mt-2">
        <button class="px-2 py-1 bg-yellow-600 rounded text-sm hover:bg-yellow-500" data-id="${cls.id}">Modifier</button>
        <button class="px-2 py-1 bg-red-600 rounded text-sm hover:bg-red-500" data-id="${cls.id}">Supprimer</button>
      </div>
    `;
    div.querySelectorAll("button")[0].addEventListener("click", () => chargerClasse(cls));
    div.querySelectorAll("button")[1].addEventListener("click", () => supprimerClasse(cls.id));
    cardsDiv.appendChild(div);
  });
}

// ----------- Charger une classe dans les sélecteurs -----------
function chargerClasse(cls) {
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

  alert("🔄 Classe chargée !");
}

// ----------- Supprimer une classe -----------
async function supprimerClasse(id) {
  if (!confirm("❌ Supprimer cette classe ?")) return;
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) console.error(error);
  else chargerClasses();
}
