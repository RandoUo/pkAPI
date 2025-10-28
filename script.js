const API_URL = "https://api.pokemontcg.io/v2";
const GIPHY_URL = "https://api.giphy.com/v1/gifs/search";
const GIPHY_KEY = "SUA_CHAVE_AQUI"; // substitua pela sua chave Giphy gratuita

const cardsContainer = document.getElementById("cards");
const setList = document.getElementById("setList");
const feedback = document.getElementById("feedback");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

// ===== Funções =====

async function buscarPokemons(nome) {
  showFeedback("🔍 Buscando cartas...");
  try {
    const cardsRes = await fetch(`${API_URL}/cards?q=name:${nome}&pageSize=8`);
    const cardsData = await cardsRes.json();

    if (!cardsData.data.length) {
      showFeedback("Nenhuma carta encontrada.");
      cardsContainer.innerHTML = "";
      return;
    }

    exibirCartas(cardsData.data);
    showFeedback("");
  } catch (error) {
    console.error(error);
    showFeedback("❌ Erro ao buscar dados.");
  }
}

async function carregarSets() {
  try {
    const res = await fetch(`${API_URL}/sets?pageSize=10`);
    const data = await res.json();

    setList.innerHTML = "";
    data.data.forEach(set => {
      const li = document.createElement("li");
      li.textContent = set.name;
      setList.appendChild(li);
    });
  } catch {
    setList.innerHTML = "<li>Erro ao carregar sets.</li>";
  }
}

async function carregarInicio() {
  showFeedback("Carregando cartas iniciais...");
  try {
    const res = await fetch(`${API_URL}/cards?pageSize=8`);
    const data = await res.json();
    exibirCartas(data.data);
    showFeedback("");
  } catch {
    showFeedback("Erro ao carregar cartas iniciais.");
  }
}

function exibirCartas(cards) {
  cardsContainer.innerHTML = "";
  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="${card.images.small}" alt="${card.name}">
      <h3>${card.name}</h3>
      <p><b>Raridade:</b> ${card.rarity || "Desconhecida"}</p>
      <p><b>Tipo:</b> ${card.types ? card.types.join(", ") : "N/A"}</p>
    `;
    div.addEventListener("click", () => abrirModal(card));
    cardsContainer.appendChild(div);
  });
}

async function abrirModal(card) {
  modal.style.display = "block";
  modalBody.innerHTML = `<h2>${card.name}</h2><p>Carregando GIF...</p><img src="${card.images.large}" alt="${card.name}">`;

  try {
    const res = await fetch(`${GIPHY_URL}?api_key=${GIPHY_KEY}&q=${card.name}&limit=1&rating=g`);
    const data = await res.json();
    const gif = data.data[0]?.images.fixed_height_small.url;
    if (gif) {
      modalBody.innerHTML = `
        <h2>${card.name}</h2>
        <div>
          <img src="${card.images.large}" alt="${card.name}">
          <img src="${gif}" alt="GIF de ${card.name}">
        </div>
        <p><b>Raridade:</b> ${card.rarity || "Desconhecida"}</p>
        <p><b>Tipo:</b> ${card.types ? card.types.join(", ") : "N/A"}</p>
      `;
    } else {
      modalBody.innerHTML += `<p>Nenhum GIF encontrado 😢</p>`;
    }
  } catch {
    modalBody.innerHTML += `<p>Erro ao carregar GIF.</p>`;
  }
}

function showFeedback(msg) {
  feedback.textContent = msg;
}

// ===== Eventos =====
closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

searchBtn.addEventListener("click", () => {
  const nome = searchInput.value.trim().toLowerCase();
  if (!nome) return showFeedback("Digite o nome de um Pokémon.");
  buscarPokemons(nome);
});

searchInput.addEventListener("keypress", e => {
  if (e.key === "Enter") searchBtn.click();
});

// ===== Inicialização =====
carregarInicio();
carregarSets();
