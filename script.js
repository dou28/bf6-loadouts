// === CONFIGURATEUR BF6 - VERSION DYNAMIQUE ===

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

// --- Remplir les types d’armes ---
function remplirTypesArmes() {
  const typeSelect = document.getElementById("weaponType");
  const armeSelect = document.getElementById("weaponName");
  const types = [...new Set(armesData.map(a => a.categorie))];

  typeSelect.innerHTML = `<option value="">-- Choisir un type --</option>`;
  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeSelect.appendChild(opt);
  });

  typeSelect.addEventListener("change", () => {
    const type = typeSelect.value;
    const armes = armesData.filter(a => a.categorie === type);
    remplirArmes(armes);
  });
}

// --- Liste d’armes selon le type ---
function remplirArmes(armes) {
  const armeSelect = document.getElementById("weaponName");
  armeSelect.innerHTML = "";

  armes.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.nom;
    opt.textContent = a.nom;
    armeSelect.appendChild(opt);
  });

  armeSelect.addEventListener("change", () => afficherArme(armeSelect.value));
  if (armes.length > 0) afficherArme(armes[0].nom);
}

// --- Affiche les infos d’une arme ---
function afficherArme(nom) {
  const arme = armesData.find(a => a.nom === nom);
  if (!arme) return;
  afficherStats(arme);
  afficherAccessoires(arme);
}

// --- Afficher les statistiques ---
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

// --- Créer dynamiquement tous les accessoires ---
function afficherAccessoires(arme) {
  const container = document.getElementById("slots");
  container.innerHTML = "";

  if (!arme.accessoires) {
    console.warn("⚠️ Aucun accessoire trouvé pour", arme.nom);
    return;
  }

  Object.entries(arme.accessoires).forEach(([categorie, liste]) => {
    const div = document.createElement("div");
    div.className = "mb-3";

    const label = document.createElement("label");
    label.textContent = categorie.charAt(0).toUpperCase() + categorie.slice(1);
    label.className = "block text-sm mb-1 text-gray-300";

    const select = document.createElement("select");
    select.className = "w-full bg-slate-700 p-2 rounded";
    select.id = `slot-${categorie}`;

    liste.forEach(opt => {
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

// --- Sauvegarde locale ---
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

// --- Initialisation ---
window.addEventListener("load", () => {
  const saved = localStorage.getItem("classesBF6");
  if (saved) {
    classesSauvegardees = JSON.parse(saved);
    afficherClasses();
  }
  chargerArmes();
});
