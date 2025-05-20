function formattaNome(nome) {
  return nome
    .toLowerCase()
    .split(" ")
    .map(parola => parola.charAt(0).toUpperCase() + parola.slice(1))
    .join(" ");
}

// Normalizza nome: minuscolo, split parole ordinate alfabeticamente per ignorare ordine
function normalizzaNomePerConfronto(nome) {
  return nome
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .sort()
    .join(" ");
}

// Verifica se due nomi sono compatibili: uno contenuto nell'altro dopo normalizzazione
function nomiCompatibili(nome1, nome2) {
  const n1 = normalizzaNomePerConfronto(nome1);
  const n2 = normalizzaNomePerConfronto(nome2);
  return n1.includes(n2) || n2.includes(n1);
}

let database = [];
const selectGara = document.getElementById("garaSelect");
const filterSocieta = document.getElementById("filterSocieta");
const tableHeader = document.getElementById("tableHeader");
const tbody = document.querySelector("#outputTable tbody");
const atletaTable = document.getElementById("atletaTable");
const atletaTbody = atletaTable.querySelector("tbody");


for (const gara of tutteLeGare) {
  const datiConNome = gara.dati.map(entry => ({ ...entry, gara: gara.nome }));
  database.push(...datiConNome);
}
// Popola il menu a tendina con le gare già definite in Gare.js
const nomiGare = new Set(tutteLeGare.map(g => g.nome));
for (const nome of nomiGare) {
  const option = document.createElement("option");
  option.value = nome;
  option.textContent = nome;
  selectGara.appendChild(option);
}

document.getElementById("fileInput").addEventListener("change", async (event) => {
  const files = Array.from(event.target.files);
  const gareCaricate = new Set();

  for (let file of files) {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      // Aggiungi il nome del file come proprietà 'gara' a ogni entry
      const datiConNomeGara = json.map(entry => ({ ...entry, gara: file.name }));
      database.push(...datiConNomeGara);
      gareCaricate.add(file.name);
    } catch (e) {
      alert(`Errore nel file ${file.name}: ${e.message}`);
    }
  }

  // Aggiorna menu a tendina senza duplicati
  for (let gara of gareCaricate) {
    if (![...selectGara.options].some(opt => opt.value === gara)) {
      const option = document.createElement("option");
      option.value = gara;
      option.textContent = gara;
      selectGara.appendChild(option);
    }
  }

  // Mostra la classifica aggregata di default
  aggiornaVisualizzazione();
});

// Funzione per mostrare la tabella gare atleta filtrata da nome
function mostraGareAtleta(nomeAtleta) {
  if (!nomeAtleta) {
    atletaTable.style.display = "none";
    atletaTbody.innerHTML = "";
    return;
  }

  const risultati = database.filter(entry =>
    nomiCompatibili(entry.nome, nomeAtleta)
  );

  if (risultati.length === 0) {
    atletaTable.style.display = "none";
    atletaTbody.innerHTML = "";
    return;
  }

  atletaTable.style.display = "";
  atletaTbody.innerHTML = "";

  risultati.sort((a, b) => a.gara.localeCompare(b.gara));

  for (const r of risultati) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="gara" title="${r.gara}">${r.gara}</td>
      <td>${r.categoria}</td>
      <td>${r.tempo}</td>
      <td>${parseFloat(r.punteggio).toFixed(2)}</td>
    `;
    atletaTbody.appendChild(tr);
  }
}


// Funzione per aggiornare la tabella in base a gara selezionata e filtro società
function aggiornaVisualizzazione() {
  const garaSelezionata = selectGara.value;
  const filtroSoc = filterSocieta.value.trim().toLowerCase();

  // Nascondi tabella dettagli atleta al cambio filtro/gara
  atletaTable.style.display = "none";
  atletaTbody.innerHTML = "";

  if (garaSelezionata === "") {
    // Classifica aggregata (tutte le gare)
    mostraClassificaAggregata(filtroSoc);
  } else {
    // Dettagli gara selezionata
    mostraDettagliGara(garaSelezionata, filtroSoc);
  }
}

// Mostra la classifica aggregata filtrando per società (se fornita)
function mostraClassificaAggregata(filtroSoc) {
  tableHeader.innerHTML = `
    <th>Nome</th>
    <th class="societa">Società</th>
    <th>Sesso</th>
    <th>Numero gare</th>
    <th>Punteggio totale</th>
  `;
  tbody.innerHTML = "";

  const aggregati = [];

  for (let entry of database) {
    if (filtroSoc && !entry.societa.toLowerCase().includes(filtroSoc)) continue;

    // Cerca se esiste già un aggregato con nome compatibile e stessa società
    let agg = aggregati.find(a =>
      nomiCompatibili(a.nome, entry.nome) &&
      a.societa.toLowerCase() === entry.societa.toLowerCase()
    );

    if (!agg) {
      agg = {
        nome: entry.nome,
        societa: entry.societa,
        femmina: entry.femmina,
        gare: 0,
        totale: 0
      };
      aggregati.push(agg);
    }

    agg.gare += 1;
    agg.totale += parseFloat(entry.punteggio || 0);
  }

  const righe = aggregati.sort((a, b) => b.totale - a.totale);

  for (let r of righe) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="#" class="nomeAtleta">${formattaNome(r.nome)}</a></td>
      <td class="societa">${r.societa.toUpperCase()}</td>
      <td>${r.femmina ? 'F' : 'M'}</td>
      <td>${r.gare}</td>
      <td>${r.totale.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  }

  // Aggiungi listener ai link nomi
  tbody.querySelectorAll(".nomeAtleta").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      mostraGareAtleta(e.target.textContent);
    });
  });
}

// Mostra i dettagli di una gara specifica filtrando per società (se fornita)
function mostraDettagliGara(garaSelezionata, filtroSoc) {
  tableHeader.innerHTML = `
    <th>Categoria</th>
    <th>Nome</th>
    <th class="societa">Società</th>
    <th>Sesso</th>
    <th>Tempo</th>
    <th>Punteggio</th>
  `;
  tbody.innerHTML = "";

  const risultati = database.filter(entry =>
    entry.gara === garaSelezionata &&
    (!filtroSoc || entry.societa.toLowerCase().includes(filtroSoc))
  );

  for (let r of risultati) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.categoria}</td>
      <td><a href="#" class="nomeAtleta">${formattaNome(r.nome)}</a></td>
      <td class="societa">${r.societa.toUpperCase()}</td>
      <td>${r.femmina ? 'F' : 'M'}</td>
      <td>${r.tempo}</td>
      <td>${r.punteggio}</td>
    `;
    tbody.appendChild(tr);
  }

  // Aggiungi listener ai link nomi
  tbody.querySelectorAll(".nomeAtleta").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      mostraGareAtleta(e.target.textContent);
    });
  });
}

// Eventi per aggiornare la tabella al cambiare della gara o del filtro società
selectGara.addEventListener("change", aggiornaVisualizzazione);
filterSocieta.addEventListener("input", aggiornaVisualizzazione);
document.addEventListener("DOMContentLoaded", aggiornaVisualizzazione);
