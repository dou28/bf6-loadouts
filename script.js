// --- Variables globales ---
let armesData = [];
let classesSauvegardees = [];

// --- Chargement du fichier JSON ---
async function chargerArmes() {
  try {
    console.log("🔄 Chargement du fichier armes.json...");
    const res = await fetch("./data/armes.json");
    if (!res.ok) throw new Error("Fichier JSON introuvable !");
    const data = await res.json();

    armesData = data.armes;
    console.log("✅ Armes chargées :", armesData.length);
    remplirTypesArmes();
  } catch (err) {
    console.error("❌ Erreur de chargement :", err);
    alert("Impossible de charger les armes. Vérifie le chemin : ./data/armes.json");
  }
}

// --- Remplissage des types d’armes ---
function remplirTypesArmes() {
  const typeSelect = document.getElementById("weaponType");
  const armeSelect = document.getElementById("weaponName");
  if (!typeSelect || !armeSelect) return console.error("⚠️ IDs manquants dans le HTML.");

  const armesParCategorie = {};

  armesData.forEach(a => {
    if (!armesParCategorie[a.categorie]) armesParCategorie[a.categorie] = [];
    armesParCategorie[a.categorie].push(a.nom);
  });

  // Nettoyage et ajout
  typeSelect.innerHTML = `<option value="">-- Choisir un type --</option>`;
  Object.keys(armesParCategorie).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    typeSelect.appendChild(opt);
  });

  typeSelect.addEventListener("change", () => {
    remplirArmes(typeSelect.value, armesParCategorie);
  });
}

// --- Liste des armes selon la catégorie ---
function remplirArmes(categorie, armesParCategorie) {
  const armeSelect = document.getElementById("weaponName");
  armeSelect.innerHTML = "";

  const armes = armesParCategorie[categorie] || [];
  armes.forEach(nom => {
    const opt = document.createElement("option");
    opt.value = nom;
    opt.textContent = nom;
    armeSelect.appendChild(opt);
  });

  if (armes.length > 0) afficherArme(armes[0]);
  armeSelect.addEventListener("change", () => afficherArme(armeSelect.value));
}

// --- Affiche stats + accessoires ---
function afficherArme(nom) {
  const arme = armesData.find(a => a.nom === nom);
  if (!arme) return;

  afficherStats(arme);
  afficherAccessoires(arme);
}

// --- Stats ---
function afficherStats(arme) {
  const statsDiv = document.getElementById("weaponStats");
  if (!arme.stats) return;

  statsDiv.innerHTML = `
    <h3 class="text-lg font-semibold mb-2 text-blue-400">${arme.nom}</h3>
    <p><strong>Dégâts :</strong> ${arme.stats.degats ?? "—"}</p>
    <p><strong>Précision :</strong> ${arme.stats.precision ?? "—"}</p>
    <p><strong>Contrôle :</strong> ${arme.stats.controle ?? "—"}</p>
    <p><strong>Mobilité :</strong> ${arme.stats.mobilite ?? "—"}</p>
  `;
}

// --- Accessoires dynamiques ---
function afficherAccessoires(arme) {
  const container = document.getElementById("slots");
  container.innerHTML = "";

  if (!arme.accessoires) return;

  const ordre = [
    "accessoires supérieur",
    "accessoires droit",
    "viseurs",
    "bouche",
    "canon",
    "sous_canons",
    "chargeurs",
    "munitions",
    "ergonomie",
    "accessoire de visée",
    "camouflages"
  ];

  let categories = Object.keys(arme.accessoires).sort(
    (a, b) => (ordre.indexOf(a) === -1 ? 99 : ordre.indexOf(a)) - (ordre.indexOf(b) === -1 ? 99 : ordre.indexOf(b))
  );

  categories.forEach(cat => {
    const div = document.createElement("div");
    div.className = "mb-3";

    const label = document.createElement("label");
    label.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    label.className = "block text-sm mb-1 text-gray-300";

    const select = document.createElement("select");
    select.className = "w-full bg-slate-700 p-2 rounded";
    select.id = `slot-${cat}`;

    arme.accessoires[cat].forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });

    div.appendChild(label);
    div.appendChild(select);
    container.appendChild(div);
  });
}

// --- Sauvegarde locale d'une classe ---
document.getElementById("saveBtn").addEventListener("click", () => {
  const armeNom = document.getElementById("weaponName").value;
  const arme = armesData.find(a => a.nom === armeNom);
  if (!arme) return alert("Aucune arme sélectionnée !");

  const config = { arme: arme.nom, accessoires: {} };

  Object.keys(arme.accessoires).forEach(cat => {
    const select = document.getElementById(`slot-${cat}`);
    if (select) config.accessoires[cat] = select.value;
  });

  classesSauvegardees.push(config);
  localStorage.setItem("classesBF6", JSON.stringify(classesSauvegardees));
  afficherClasses();
  alert("✅ Classe enregistrée !");
});

// --- Afficher classes sauvegardées ---
function afficherClasses() {
  const cards = document.getElementById("cards");
  cards.innerHTML = "";

  classesSauvegardees.forEach((classe, index) => {
    const div = document.createElement("div");
    div.className = "bg-slate-700 p-3 rounded-lg shadow-md";

    let accessoiresHTML = "";
    for (const [cat, val] of Object.entries(classe.accessoires)) {
      accessoiresHTML += `<p><strong>${cat} :</strong> ${val}</p>`;
    }

    div.innerHTML = `
      <h4 class="font-semibold text-blue-300 mb-2">${classe.arme}</h4>
      ${accessoiresHTML}
      <button class="mt-2 bg-red-600 px-2 py-1 rounded" onclick="supprimerClasse(${index})">Supprimer</button>
    `;
    cards.appendChild(div);
  });
}

function supprimerClasse(index) {
  classesSauvegardees.splice(index, 1);
  localStorage.setItem("classesBF6", JSON.stringify(classesSauvegardees));
  afficherClasses();
}

// --- Chargement initial ---
window.addEventListener("load", () => {
  const saved = localStorage.getItem("classesBF6");
  if (saved) {
    classesSauvegardees = JSON.parse(saved);
    afficherClasses();
  }
  chargerArmes(); // Démarre le chargement des armes
});
