// --- Chargement du fichier JSON des armes ---
let armesData = [];
let classesSauvegardees = [];

// Chargement du fichier JSON
fetch("./data/armes.json")
  .then(res => res.json())
  .then(data => {
    armesData = data.armes;
    remplirTypesArmes();
  })
  .catch(err => console.error("Erreur de chargement des armes :", err));

// --- Remplissage des sélecteurs de type d'arme et d'arme ---
function remplirTypesArmes() {
  const typeSelect = document.getElementById("weaponType");
  const armesParCategorie = {};

  // Regroupe les armes par catégorie
  armesData.forEach(a => {
    if (!armesParCategorie[a.categorie]) armesParCategorie[a.categorie] = [];
    armesParCategorie[a.categorie].push(a.nom);
  });

  // Remplir le sélecteur des types
  Object.keys(armesParCategorie).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    typeSelect.appendChild(opt);
  });

  typeSelect.addEventListener("change", () => remplirArmes(typeSelect.value, armesParCategorie));
}

// Remplit la liste des armes selon la catégorie
function remplirArmes(categorie, armesParCategorie) {
  const armeSelect = document.getElementById("weaponName");
  armeSelect.innerHTML = "";
  armesParCategorie[categorie].forEach(nom => {
    const opt = document.createElement("option");
    opt.value = nom;
    opt.textContent = nom;
    armeSelect.appendChild(opt);
  });

  afficherArme(armeSelect.value);
  armeSelect.addEventListener("change", () => afficherArme(armeSelect.value));
}

// --- Affichage des infos et accessoires d’une arme ---
function afficherArme(nom) {
  const arme = armesData.find(a => a.nom === nom);
  if (!arme) return;

  afficherStats(arme);
  afficherAccessoires(arme);
}

// Affiche les stats d'une arme
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

// Génère dynamiquement les catégories d'accessoires
function afficherAccessoires(arme) {
  const container = document.getElementById("slots");
  container.innerHTML = "";

  let categories = Object.keys(arme.accessoires);

  // Trie les catégories dans un ordre logique si présent
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
  categories.sort((a, b) => {
    const ai = ordre.indexOf(a);
    const bi = ordre.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Crée dynamiquement les champs
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

// --- Sauvegarde d’une classe localement ---
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

// --- Afficher les classes sauvegardées ---
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

// --- Charger les classes au démarrage ---
window.addEventListener("load", () => {
  const saved = localStorage.getItem("classesBF6");
  if (saved) {
    classesSauvegardees = JSON.parse(saved);
    afficherClasses();
  }
});
