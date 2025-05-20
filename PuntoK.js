function formattaNome(nome) {
  return nome
    .toLowerCase()
    .split(" ")
    .map(parola => parola.charAt(0).toUpperCase() + parola.slice(1))
    .join(" ");
}

function normalizzaNomePerConfronto(nome) {
  return nome
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .sort()
    .join(" ");
}

function nomiCompatibili(nome1, nome2) {
  const n1 = normalizzaNomePerConfronto(nome1);
  const n2 = normalizzaNomePerConfronto(nome2);
  return n1.includes(n2) || n2.includes(n1);
}

const selectGara = document.getElementById("garaSelect");
const filterSocieta = document.getElementById("filterSocieta");
const tableHeader = document.getElementById("tableHeader");
const tbody = document.querySelector("#outputTable tbody");
const atletaTable = document.getElementById("atletaTable");
const atletaTbody = atletaTable.querySelector("tbody");

let database = [];

// Popola database dai dati di tutteLeGare e aggiunge campo 'gara'
function caricaDatabase() {
  database = []; // resetto in caso
  for (const gara of tutteLeGare) {
    const datiConNome = gara.dati.map(entry => ({ ...entry, gara: gara.nome }));
    database.push(...datiConNome);
  }
}

// Popola select gara da tutteLeGare
function popolaSelectGara() {
  // Rimuovo eventuali option tranne la prima (aggregata)
  while (selectGara.options.length > 1) {
    selectGara.remove(1);
  }
  for (const gara of tutteLeGare) {
    const option = document.createElement("option");
    option.value = gara.nome;
    option.textContent = gara.nome;
    selectGara.appendChild(option);
  }
}

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

function aggiornaVisualizzazione() {
  const garaSelezionata = selectGara.value;
  const filtroSoc = filterSocieta.value.trim().toLowerCase();

  atletaTable.style.display = "none";
  atletaTbody.innerHTML = "";

  if (garaSelezionata === "") {
    mostraClassificaAggregata(filtroSoc);
  } else {
    mostraDettagliGara(garaSelezionata, filtroSoc);
  }
}

function mostraClassificaAggregata(filtroSoc) {
  tableHeader.innerHTML = `
    <tr>
      <th>Nome</th>
      <th>Punteggio totale</th>
      <th>Numero gare</th>
      <th class="societa">Società</th>
      <th>Sesso</th>
    </tr>
  `;
  tbody.innerHTML = "";

  const aggregati = [];

  for (let entry of database) {
    if (filtroSoc && !entry.societa.toLowerCase().includes(filtroSoc)) continue;

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

  aggregati.sort((a, b) => b.totale - a.totale);

  for (let r of aggregati) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="#" class="nomeAtleta">${formattaNome(r.nome)}</a></td>
      <td>${r.totale.toFixed(2)}</td>
      <td>${r.gare}</td>
      <td class="societa">${r.societa.toUpperCase()}</td>
      <td>${r.femmina ? 'F' : 'M'}</td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll(".nomeAtleta").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      mostraGareAtleta(e.target.textContent);
    });
  });
}

function mostraDettagliGara(garaSelezionata, filtroSoc) {
  tableHeader.innerHTML = `
    <tr>
      <th>Nome</th>
      <th>Categoria</th>
      <th>Tempo</th>
      <th>Punteggio</th>
      <th class="societa">Società</th>
    </tr>
  `;
  tbody.innerHTML = "";

  const risultati = database.filter(entry =>
    entry.gara === garaSelezionata &&
    (!filtroSoc || entry.societa.toLowerCase().includes(filtroSoc))
  );

  for (let r of risultati) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="#" class="nomeAtleta">${formattaNome(r.nome)}</a></td>
      <td>${r.categoria}</td>
      <td>${r.tempo}</td>
      <td>${r.punteggio}</td>
      <td class="societa">${r.societa.toUpperCase()}</td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll(".nomeAtleta").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      mostraGareAtleta(e.target.textContent);
    });
  });
}

// Inizializzazione all’avvio pagina
document.addEventListener("DOMContentLoaded", () => {
  caricaDatabase();
  popolaSelectGara();
  aggiornaVisualizzazione();

  selectGara.addEventListener("change", aggiornaVisualizzazione);
  filterSocieta.addEventListener("input", aggiornaVisualizzazione);
});
