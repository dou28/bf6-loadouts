const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;
let currentLoadout = null;
let armesData = null;

// ✅ Initialisation
auth.onAuthStateChanged(async (user) => {
  if (!user) return (window.location.href = "login.html");
  currentUser = user;
  document.getElementById("userName").textContent =
    "Bienvenue, " + (user.displayName || user.email);
  await chargerArmes();
  await chargerClasses();
  setupAutoSave();
});

// 🚪 Déconnexion
document.getElementById("logoutBtn").addEventListener("click", () => {
  auth.signOut().then(() => (window.location.href = "login.html"));
});

// ⚙️ Chargement des armes depuis armes.json
async function chargerArmes() {
  try {
    const res = await fetch("./armes.json");
    armesData = await res.json();

    const types = [...new Set(armesData.armes.map((a) => a.categorie))];
    const selectType = document.getElementById("weaponType");
    selectType.innerHTML = `<option value="">Tous</option>`;
    types.forEach((t) => {
      selectType.innerHTML += `<option value="${t}">${t}</option>`;
    });

    remplirArmes();

    selectType.addEventListener("change", remplirArmes);
    document.getElementById("weaponName").addEventListener("change", afficherStats);

    remplirSelects("slot-sights", armesData.accessoires.viseurs);
    remplirSelects("slot-barrels", armesData.accessoires.canons);
    remplirSelects("slot-muzzles", armesData.accessoires.bouches);
    remplirSelects("slot-underbarrels", armesData.accessoires["sous-canons"]);
    remplirSelects("slot-magazines", armesData.accessoires.chargeurs);
    remplirSelects("slot-stocks", armesData.accessoires.crosses);
    remplirSelects("slot-camouflages", armesData.accessoires.camouflages);
    remplirSelects("gadget1", armesData.gadgets);
    remplirSelects("gadget2", armesData.gadgets);
    remplirSelects("grenade", armesData.grenades);
  } catch (err) {
    console.error("Erreur chargement armes :", err);
  }
}

// 🔁 Remplir les sélecteurs
function remplirSelects(id, liste) {
  const s = document.getElementById(id);
  s.innerHTML = "";
  liste.forEach((item) => {
    s.innerHTML += `<option>${item}</option>`;
  });
}

// 🔫 Remplir la liste des armes selon le type
function remplirArmes() {
  const type = document.getElementById("weaponType").value;
  const selectArme = document.getElementById("weaponName");
  selectArme.innerHTML = `<option value="">— Choisir —</option>`;
  armesData.armes
    .filter((a) => !type || a.categorie === type)
    .forEach((a) => {
      selectArme.innerHTML += `<option value="${a.nom}">${a.nom}</option>`;
    });
}

// 📊 Afficher les statistiques d’une arme
function afficherStats() {
  const armeNom = document.getElementById("weaponName").value;
  const arme = armesData.armes.find((a) => a.nom === armeNom);
  const statsDiv = document.getElementById("weaponStats");

  if (!arme) {
    statsDiv.innerHTML = "<p>Sélectionne une arme pour afficher ses statistiques.</p>";
    return;
  }

  statsDiv.innerHTML = `
    <div class="flex justify-between">
      <div><strong>${arme.nom}</strong> — ${arme.categorie}</div>
      <div class="text-sm text-gray-400">${arme.stats.degats} dmg | ${arme.stats.cadence} RPM | ${arme.stats.portee} m</div>
    </div>
  `;
}

// 📦 Récupérer la config actuelle
function getCurrentLoadout() {
  return {
    arme: document.getElementById("weaponName").value,
    type: document.getElementById("weaponType").value,
    accessoires: {
      viseur: document.getElementById("slot-sights").value,
      canon: document.getElementById("slot-barrels").value,
      bouche: document.getElementById("slot-muzzles").value,
      sousCanon: document.getElementById("slot-underbarrels").value,
      chargeur: document.getElementById("slot-magazines").value,
      crosse: document.getElementById("slot-stocks").value,
      camouflage: document.getElementById("slot-camouflages").value,
    },
    gadgets: {
      g1: document.getElementById("gadget1").value,
      g2: document.getElementById("gadget2").value,
      grenade: document.getElementById("grenade").value,
    },
    date: new Date().toISOString(),
  };
}

// 💾 Enregistrer manuellement
document.getElementById("saveBtn").addEventListener("click", async () => {
  if (!currentUser) return alert("Connecte-toi pour sauvegarder ta classe.");
  const classe = getCurrentLoadout();
  if (!classe.arme) return alert("Choisis une arme avant d’enregistrer.");

  await db.collection("users").doc(currentUser.uid).collection("classes").add(classe);
  showNotif("✅ Classe enregistrée !");
  await chargerClasses();
});

// 🔁 Auto-save
function setupAutoSave() {
  let lastConfig = JSON.stringify(getCurrentLoadout());
  setInterval(async () => {
    if (!currentUser || !currentLoadout) return;
    const newConfig = JSON.stringify(getCurrentLoadout());
    if (newConfig !== lastConfig) {
      await db.collection("users").doc(currentUser.uid).collection("classes").doc(currentLoadout.id).update(getCurrentLoadout());
      showNotif("💾 Classe sauvegardée !");
      lastConfig = newConfig;
    }
  }, 5000);
}

// 📜 Charger les classes
async function chargerClasses() {
  if (!currentUser) return;
  const snapshot = await db.collection("users").doc(currentUser.uid).collection("classes").orderBy("date", "desc").get();
  const cards = document.getElementById("cards");
  cards.innerHTML = "";

  snapshot.forEach((doc) => {
    const c = doc.data();
    const div = document.createElement("div");
    div.className = "bg-slate-700 p-3 rounded shadow-md";
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <strong>${c.arme}</strong><br>
          <span class="text-xs text-gray-400">${new Date(c.date).toLocaleString()}</span>
        </div>
        <div class="flex gap-2">
          <button class="bg-amber-500 px-2 py-1 rounded text-sm hover:bg-amber-400" data-id="${doc.id}">✏️ Modifier</button>
          <button class="bg-red-600 px-2 py-1 rounded text-sm hover:bg-red-500" data-del="${doc.id}">🗑️</button>
        </div>
      </div>
    `;
    cards.appendChild(div);
  });

  document.querySelectorAll("[data-id]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");
      const docSnap = await db.collection("users").doc(currentUser.uid).collection("classes").doc(id).get();
      if (docSnap.exists) chargerClasseDansUI(docSnap.id, docSnap.data());
    });
  });

  document.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-del");
      if (confirm("Supprimer cette classe ?")) {
        await db.collection("users").doc(currentUser.uid).collection("classes").doc(id).delete();
        await chargerClasses();
      }
    });
  });
}

// 🎯 Charger une classe existante
function chargerClasseDansUI(id, data) {
  currentLoadout = { id, ...data };
  document.getElementById("weaponType").value = data.type;
  remplirArmes();
  document.getElementById("weaponName").value = data.arme;
  document.getElementById("slot-sights").value = data.accessoires.viseur;
  document.getElementById("slot-barrels").value = data.accessoires.canon;
  document.getElementById("slot-muzzles").value = data.accessoires.bouche;
  document.getElementById("slot-underbarrels").value = data.accessoires.sousCanon;
  document.getElementById("slot-magazines").value = data.accessoires.chargeur;
  document.getElementById("slot-stocks").value = data.accessoires.crosse;
  document.getElementById("slot-camouflages").value = data.accessoires.camouflage;
  document.getElementById("gadget1").value = data.gadgets.g1;
  document.getElementById("gadget2").value = data.gadgets.g2;
  document.getElementById("grenade").value = data.gadgets.grenade;
  afficherStats();
}

// 🔔 Notification
function showNotif(message) {
  const notif = document.getElementById("saveNotif");
  notif.textContent = message;
  notif.classList.add("show");
  setTimeout(() => notif.classList.remove("show"), 2500);
}
