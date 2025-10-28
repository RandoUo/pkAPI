const API_URL = "https://api.pokemontcg.io/v2";
const GIPHY_URL = "https://api.giphy.com/v1/gifs/search";
const GIPHY_KEY = "SUA_CHAVE_GIPHY_AQUI"; // 🔑 Substitua pela sua chave Giphy

const cardsContainer = document.getElementById("cardsContainer");
const gifsContainer = document.getElementById("gifsContainer");
const setList = document.getElementById("setList");

const searchCardsBtn = document.getElementById("searchCardsBtn");
const searchCardsInput = document.getElementById("searchCardsInput");

const searchGifsBtn = document.getElementById("searchGifsBtn");
const searchGifsInput = document.getElementById("searchGifsInput");

// ====== Função genérica para buscar JSON ======
async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Erro ao buscar: ${res.status}`);
  return res.json();
}

// ====== Buscar sets ======
async function loadSets() {
  try {
    setList.innerHTML = "<li>Carregando...</li>";
    const data = await fetchJSON(`${API_URL}/sets?pageSize=10`);
    setList.innerHTML = "";
    data.data.forEach(set => {
      const li = document.createElement("li");
      li.textContent = `${set.name} (${set.releaseDate})`;
      setList.appendChild(li);
    });
  } catch (err) {
    setList.innerHTML = "<li>Erro ao carregar coleções.</li>";
  }
}

// ====== Buscar cartas ======
async function searchCards() {
  const name = searchCardsInput.value.trim();
  if (!name) return;
  cardsContainer.innerHTML = "<p>🔍 Buscando cartas...</p>";

  try {
    const data = await fetchJSON(`${API_URL}/cards?q=name:${name}`);
    if (data.data.length === 0) {
      cardsContainer.innerHTML = "<p>⚠️ Nenhuma carta encontrada.</p>";
      return;
    }
    showCards(data.data);
  } catch (err) {
    cardsContainer.innerHTML = "<p>❌ Erro ao buscar cartas.</p>";
  }
}

function showCards(cards) {
  cardsContainer.innerHTML = "";
  cards.forEach(card => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.innerHTML = `
      <img src="${card.images.small}" alt="${card.name}" loading="lazy">
      <h3>${card.name}</h3>
      <p>Raridade: ${card.rarity || "Desconhecida"}</p>
      <p>Tipo: ${card.types ? card.types.join(", ") : "N/A"}</p>
    `;
    cardsContainer.appendChild(div);
  });
}

// ====== Buscar GIFs ======
async function searchGifs() {
  const name = searchGifsInput.value.trim();
  if (!name) return;
  gifsContainer.innerHTML = "<p>🎞️ Buscando GIFs...</p>";

  if (!GIPHY_KEY || GIPHY_KEY === "SUA_CHAVE_GIPHY_AQUI") {
    gifsContainer.innerHTML = "<p>⚠️ Adicione sua chave Giphy em script.js!</p>";
    return;
  }

  try {
    const data = await fetchJSON(
      `${GIPHY_URL}?api_key=${GIPHY_KEY}&q=${encodeURIComponent(name)}&limit=12`
    );

    if (data.data.length === 0) {
      gifsContainer.innerHTML = "<p>⚠️ Nenhum GIF encontrado.</p>";
      return;
    }

    gifsContainer.innerHTML = "";
    data.data.forEach(gif => {
      const div = document.createElement("div");
      div.classList.add("gif-item");
      div.innerHTML = `<img src="${gif.images.fixed_height.url}" alt="${gif.title}" loading="lazy">`;
      gifsContainer.appendChild(div);
    });
  } catch (err) {
    gifsContainer.innerHTML = "<p>❌ Erro ao buscar GIFs.</p>";
  }
}

// ====== Listeners ======
searchCardsBtn.addEventListener("click", searchCards);
searchGifsBtn.addEventListener("click", searchGifs);
searchCardsInput.addEventListener("keypress", e => e.key === "Enter" && searchCards());
searchGifsInput.addEventListener("keypress", e => e.key === "Enter" && searchGifs());

// ====== Inicialização ======
loadSets();
