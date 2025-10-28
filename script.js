const API_URL = "https://api.pokemontcg.io/v2";
const GIPHY_URL = "https://api.giphy.com/v1/gifs/search";
const GIPHY_KEY = "SUA_CHAVE_AQUI"; // => substitua aqui

const cardsContainer = document.getElementById("cards");
const setList = document.getElementById("setList");
const feedback = document.getElementById("feedback");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const gifsContainer = document.getElementById("gifs");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal") || document.getElementById("closeModal");

// debounce + abort controller + cache
let debounceTimer = null;
let currentController = null;
const gifCache = new Map();

function showFeedback(msg=""){ feedback.textContent = msg; }

async function fetchJSON(url, opts){
  const res = await fetch(url, opts);
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchAll(name){
  if(currentController) currentController.abort();
  currentController = new AbortController();
  const signal = currentController.signal;

  showFeedback("🔍 Buscando cartas e GIFs...");
  try{
    const cardsPromise = fetchJSON(`${API_URL}/cards?q=name:${encodeURIComponent(name)}&pageSize=8`, { signal });
    const gifsPromise = fetchGifs(name, signal);

    const [cardsData, gifs] = await Promise.all([cardsPromise, gifsPromise]);

    if(!cardsData?.data?.length){
      cardsContainer.innerHTML = "";
      showFeedback("Nenhuma carta encontrada.");
    } else {
      renderCards(cardsData.data);
      showFeedback("");
    }

    renderGifs(gifs);
  }catch(err){
    if(err.name === "AbortError") return;
    console.error(err);
    showFeedback("Erro ao buscar — verifique sua conexão ou a chave GIPHY.");
  } finally {
    currentController = null;
  }
}

async function fetchGifs(name, signal){
  const key = name.toLowerCase();
  if(gifCache.has(key)) return gifCache.get(key);

  try{
    const url = `${GIPHY_URL}?api_key=${GIPHY_KEY}&q=${encodeURIComponent(name)}&limit=6&rating=g`;
    const data = await fetchJSON(url, { signal });
    const gifs = (data.data || []).map(g => ({
      url: g.images?.fixed_height_small?.url || g.images?.fixed_height?.url,
      title: g.title || ""
    })).filter(Boolean);
    gifCache.set(key, gifs);
    return gifs;
  }catch(err){
    if(err.name === "AbortError") throw err;
    console.warn("Giphy erro:", err);
    gifCache.set(key, []);
    return [];
  }
}

function renderGifs(gifs){
  gifsContainer.innerHTML = "";
  if(!gifs || gifs.length === 0){
    gifsContainer.innerHTML = `<p style="color:var(--muted)">Nenhum GIF encontrado.</p>`;
    return;
  }
  gifs.forEach(g => {
    const img = document.createElement("img");
    img.src = g.url;
    img.alt = g.title || "GIF";
    img.loading = "lazy";
    img.addEventListener("click", () => {
      // abrir modal mostrando somente o GIF (rápido)
      modalShow({ gifUrl: g.url, title: g.title });
    });
    gifsContainer.appendChild(img);
  });
}

function renderCards(cards){
  cardsContainer.innerHTML = "";
  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    const imgUrl = card.images?.small || card.images?.large || "";
    div.innerHTML = `
      <img src="${imgUrl}" alt="${card.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/160x140?text=No+Image'">
      <h3>${card.name}</h3>
      <p><b>Raridade:</b> ${card.rarity || "Desconhecida"}</p>
      <p><b>Tipo:</b> ${card.types ? card.types.join(", ") : "N/A"}</p>
    `;
    div.addEventListener("click", () => onCardClick(card));
    cardsContainer.appendChild(div);
  });
}

async function onCardClick(card){
  showFeedback("Carregando detalhe...");
  // tentar obter GIF já cacheado para o nome da carta/pokemon
  const name = card.name.split(" ")[0]; // tenta pegar primeiro token (melhora match)
  const gifs = await fetchGifs(name).catch(()=>[]);
  const gif = gifs[0]?.url || null;

  modalShow({ card, gifUrl: gif });
  showFeedback("");
}

function modalShow({ card=null, gifUrl=null, title="" }){
  modal.setAttribute("aria-hidden","false");
  modalBody.innerHTML = "";

  const mediaWrap = document.createElement("div");
  mediaWrap.className = "media";

  if(card){
    const img = document.createElement("img");
    img.src = card.images?.large || card.images?.small || "";
    img.alt = card.name || "Carta";
    img.onerror = () => img.src = "https://via.placeholder.com/320x320?text=No+Image";
    mediaWrap.appendChild(img);
  }

  if(gifUrl){
    const g = document.createElement("img");
    g.src = gifUrl;
    g.alt = `GIF ${title || (card && card.name) || "GIF"}`;
    g.onerror = () => {
      g.remove();
    };
    mediaWrap.appendChild(g);
  }

  const meta = document.createElement("div");
  meta.className = "meta";
  const nameEl = document.createElement("h2");
  nameEl.textContent = card?.name || title || "Detalhe";
  const rarity = document.createElement("p");
  rarity.innerHTML = `<b>Raridade:</b> ${card?.rarity || "Desconhecida"}`;
  const types = document.createElement("p");
  types.innerHTML = `<b>Tipo:</b> ${card?.types ? card.types.join(", ") : "N/A"}`;
  meta.appendChild(nameEl);
  meta.appendChild(rarity);
  meta.appendChild(types);

  modalBody.appendChild(mediaWrap);
  modalBody.appendChild(meta);
}

// close modal
function modalClose(){
  modal.setAttribute("aria-hidden","true");
  modalBody.innerHTML = "";
}

async function loadSets(){
  try{
    const data = await fetchJSON(`${API_URL}/sets?pageSize=12`);
    setList.innerHTML = "";
    data.data.forEach(s=>{
      const li = document.createElement("li");
      li.textContent = s.name;
      setList.appendChild(li);
    });
  }catch(err){
    setList.innerHTML = "<li>Erro ao carregar sets</li>";
    console.warn(err);
  }
}

async function loadInitial(){
  showFeedback("Carregando inicial...");
  try{
    const cardsRes = await fetchJSON(`${API_URL}/cards?pageSize=8`);
    renderCards(cardsRes.data || []);
    // carregar gifs genéricos "pokemon" para inicial
    const gifs = await fetchGifs("pokemon");
    renderGifs(gifs);
    showFeedback("");
  }catch(err){
    console.error(err);
    showFeedback("Erro ao carregar inicial.");
  }
}

// events
searchBtn.addEventListener("click", ()=>{
  const v = searchInput.value.trim();
  if(!v){ showFeedback("Digite o nome de um Pokémon."); return; }
  searchAll(v);
});
searchInput.addEventListener("keypress", e=>{
  if(e.key === "Enter") searchBtn.click();
});
searchInput.addEventListener("input", ()=>{
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(()=>{
    const v = searchInput.value.trim();
    if(v) searchAll(v);
  }, 480);
});
modal.addEventListener("click", e=>{
  if(e.target === modal) modalClose();
});
document.addEventListener("keydown", e=>{
  if(e.key === "Escape") modalClose();
});
if(closeModal) closeModal.addEventListener("click", modalClose);

// init
loadSets();
loadInitial();
