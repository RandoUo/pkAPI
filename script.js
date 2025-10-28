const API_URL = "https://api.pokemontcg.io/v2";
const GIPHY_URL = "https://api.giphy.com/v1/gifs/search";
const GIPHY_KEY = "SUA_CHAVE_AQUI"; // coloque sua chave da Giphy API

const cardsContainer = document.getElementById("cards");
const setList = document.getElementById("setList");
const feedback = document.getElementById("feedback");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const gifsContainer = document.getElementById("gifs");

searchBtn.addEventListener("click", () => {
  const name = searchInput.value.trim().toLowerCase();
  if (!name) {
    showFeedback("Digite o nome de um Pokémon para buscar.");
    return;
  }
  showFeedback("🔍 Buscando cartas e GIFs...");

  Promise.all([
    fetch(`${API_URL}/cards?q=name:${name}`).then(res => res.json()),
    fetch(`${GIPHY_URL}?api_key=${GIPHY_KEY}&q=${name}&limit=6`).then(res => res.json())
  ])
    .then(([cardsData, gifsData]) => {
      showFeedback("");
      if (cardsData.data.length === 0) {
        showFeedback("Nenhuma carta encontrada. Tente outro nome!");
        cardsContainer.innerHTML = "";
      } else {
        showCards(cardsData.data);
      }
      showGifs(gifsData.data);
    })
    .catch(() => showFeedback("Erro ao buscar dados. Tente novamente."));
});

function loadSets() {
  fetch(`${API_URL}/sets`)
    .then(res => res.json())
    .then(data => {
      setList.innerHTML = "";
      data.data.slice(0, 8).forEach(set => {
        const li = document.createElement("li");
        li.textContent = `${set.name}`;
        setList.appendChild(li);
      });
    });
}

function loadRandomCards() {
  showFeedback("Carregando cartas iniciais...");
  fetch(`${API_URL}/cards?pageSize=6`)
    .then(res => res.json())
    .then(data => {
      showFeedback("");
      showCards(data.data);
    });
}

function showCards(cards) {
  cardsContainer.innerHTML = "";
  cards.forEach(card => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.innerHTML = `
      <img src="${card.images.small}" alt="${card.name}">
      <h3>${card.name}</h3>
      <p><b>Raridade:</b> ${card.rarity || "Desconhecida"}</p>
      <p><b>Tipo:</b> ${card.types ? card.types.join(", ") : "N/A"}</p>
    `;
    cardsContainer.appendChild(div);
  });
}

function showGifs(gifs) {
  gifsContainer.innerHTML = "";
  if (gifs.length === 0) {
    gifsContainer.innerHTML = "<p>Nenhum GIF encontrado.</p>";
    return;
  }
  gifs.forEach(gif => {
    const img = document.createElement("img");
    img.src = gif.images.fixed_height.url;
    img.alt = "Pokémon GIF";
    gifsContainer.appendChild(img);
  });
}

function showFeedback(msg) {
  feedback.textContent = msg;
}

loadRandomCards();
loadSets();
