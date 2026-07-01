// プロンプト引き出し - メインロジック
let allPrompts = [];
let editingPrompt = null;
let historyStack = [];
let CATEGORIES = {};
let SEED = [];

// 初期化
async function init() {
  // config.json から設定を読み込み
  if (window.APP_CONFIG) {
    CATEGORIES = window.APP_CONFIG.CATEGORIES;
    SEED = window.APP_CONFIG.SEED;
  }
  loadData();
  renderPrompts();
  renderFilters();
  setupEventListeners();
  registerServiceWorker();
  setupSearch();
}

function setupEventListeners() {
  document.getElementById("addBtn")?.addEventListener("click", () => openEdit());
  document.getElementById("closeEditBtn")?.addEventListener("click", closeEdit);
  document.getElementById("saveEditBtn")?.addEventListener("click", saveEdit);
  document.getElementById("deleteEditBtn")?.addEventListener("click", deleteEdit);
  document.getElementById("settingsBtn")?.addEventListener("click", openSettings);
  document.getElementById("closeSettingsBtn")?.addEventListener("click", closeSettings);
  document.getElementById("darkModeToggle")?.addEventListener("click", toggleDarkMode);
  document.getElementById("searchClear")?.addEventListener("click", clearSearch);
  document.getElementById("importInput")?.addEventListener("change", importData);
  window.addEventListener("popstate", handlePopState);
}

// ========== ダークモード ==========
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "true" : "false");
}

function loadDarkMode() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }
}

// ========== データ保存・読込 ==========
function loadData() {
  const saved = localStorage.getItem("prompts");
  if (saved) {
    try {
      allPrompts = JSON.parse(saved);
    } catch {
      allPrompts = SEED.map((p, i) => ({ ...p, id: `p${Date.now()}_${i}` }));
    }
  } else {
    allPrompts = SEED.map((p, i) => ({ ...p, id: `p${Date.now()}_${i}` }));
  }
  loadDarkMode();
}

function saveData() {
  localStorage.setItem("prompts", JSON.stringify(allPrompts));
}

// ========== Service Worker ==========
function registerServiceWorker() {
  if (!navigator.serviceWorker) return;
  navigator.serviceWorker.register("sw.js").then(() => {
    console.log("✅ Service Worker registered");
  }).catch((err) => {
    console.log("❌ Service Worker registration failed:", err);
  });
}

// ========== 履歴管理 ==========
function pushHistory() {
  history.pushState({ view: "modal" }, "", window.location.href);
}

function handlePopState() {
  closeEdit();
  closeSettings();
}

// ========== フィルタ表示 ==========
function renderFilters() {
  const counts = {};
  Object.keys(CATEGORIES).forEach(cat => counts[cat] = 0);
  allPrompts.forEach(p => counts[p.category]++);

  const html = Object.entries(CATEGORIES).map(([key, { label, color }]) => `
    <button class="filter-chip" data-category="${key}" onclick="filterByCategory('${key}')">
      <span class="filter-dot" style="background:${color}"></span>
      ${label} <span class="filter-count">${counts[key]}</span>
    </button>
  `).join("");
  
  document.getElementById("filterContainer").innerHTML = html;
}

function filterByCategory(cat) {
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
  event.target.closest(".filter-chip")?.classList.add("active");
  renderPrompts(cat);
}

// ========== プロンプト表示 ==========
function renderPrompts(filterCat) {
  const search = document.getElementById("searchInput").value.toLowerCase();
  document.getElementById("searchClear").style.display = search ? "block" : "none";

  let filtered = allPrompts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search) || (p.summary || "").toLowerCase().includes(search);
    const matchCat = !filterCat || p.category === filterCat;
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    document.getElementById("promptList").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">プロンプトがありません</div>
        <div class="empty-text">新しいプロンプトを追加してみましょう</div>
        <button class="btn-empty" onclick="document.getElementById('addBtn').click()">+ 新規作成</button>
      </div>
    `;
    return;
  }

  const html = filtered.map(p => {
    const cat = CATEGORIES[p.category] || { label: p.category, color: "#94a3b8" };
    return `
      <div class="prompt-card">
        <div class="card-header" onclick="toggleCard(this)">
          <div class="card-bar" style="background:${cat.color}"></div>
          <div class="card-header-content">
            <div class="card-info">
              <div class="card-code">${p.category.toUpperCase()}</div>
              <div class="card-title">${escapeHtml(p.title)}</div>
              <div class="card-summary">${escapeHtml(p.summary || "説明なし")}</div>
            </div>
            <div class="card-toggle">▼</div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-body-content">
            <div class="prompt-text">${escapeHtml(p.body)}</div>
            <div class="card-actions">
              <button class="btn-copy" onclick="copyPrompt('${p.id}', event)">📋 コピー</button>
              <button class="btn-edit" onclick="openEdit('${p.id}', event)">✏️ 編集</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("promptList").innerHTML = html;
}

function toggleCard(header) {
  header.querySelector(".card-toggle").classList.toggle("open");
  header.nextElementSibling?.classList.toggle("open");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ========== 編集機能 ==========
function openEdit(id, e) {
  e?.stopPropagation();
  editingPrompt = id ? allPrompts.find(p => p.id === id) : null;
  
  if (editingPrompt) {
    document.getElementById("editTitle").value = editingPrompt.title;
    document.getElementById("editSummary").value = editingPrompt.summary || "";
    document.getElementById("editBody").value = editingPrompt.body;
    setActiveCategory(editingPrompt.category);
    document.getElementById("deleteEditBtn").style.display = "block";
  } else {
    document.getElementById("editTitle").value = "";
    document.getElementById("editSummary").value = "";
    document.getElementById("editBody").value = "";
    setActiveCategory(Object.keys(CATEGORIES)[0]);
    document.getElementById("deleteEditBtn").style.display = "none";
  }

  renderCategoryChips();
  document.getElementById("editSheet").classList.add("open");
  pushHistory();
}

function closeEdit() {
  document.getElementById("editSheet").classList.remove("open");
  editingPrompt = null;
}

function renderCategoryChips() {
  const html = Object.entries(CATEGORIES).map(([key, { label, color }]) => `
    <button class="category-chip" data-category="${key}" style="border-color:${color};" onclick="selectCategory('${key}', this)">
      ${label}
    </button>
  `).join("");
  document.getElementById("categoryChips").innerHTML = html;
  setActiveCategory(editingPrompt?.category || Object.keys(CATEGORIES)[0]);
}

function setActiveCategory(cat) {
  document.querySelectorAll(".category-chip").forEach(c => {
    c.classList.remove("active");
    c.style.background = "";
    c.style.color = "";
  });
  const active = document.querySelector(`[data-category="${cat}"]`);
  if (active) {
    const color = CATEGORIES[cat].color;
    active.classList.add("active");
    active.style.background = color;
    active.style.color = "white";
    active.style.borderColor = color;
  }
}

function selectCategory(cat, el) {
  document.querySelectorAll(".category-chip").forEach(c => {
    c.classList.remove("active");
    c.style.background = "";
    c.style.color = "";
  });
  const color = CATEGORIES[cat].color;
  el.style.borderColor = color;
  el.style.background = color;
  el.style.color = "white";
  el.classList.add("active");
  if (editingPrompt) editingPrompt.category = cat;
  else editingPrompt = { category: cat };
}

function saveEdit() {
  const title = document.getElementById("editTitle").value.trim();
  const summary = document.getElementById("editSummary").value.trim();
  const body = document.getElementById("editBody").value.trim();
  const category = document.querySelector(".category-chip.active")?.dataset.category || Object.keys(CATEGORIES)[0];

  if (!title || !body) {
    showToast("❌ タイトルと本文は必須です");
    return;
  }

  if (editingPrompt && editingPrompt.id) {
    const idx = allPrompts.findIndex(p => p.id === editingPrompt.id);
    allPrompts[idx] = { id: editingPrompt.id, title, summary, body, category };
  } else {
    allPrompts.unshift({ id: `p${Date.now()}`, title, summary, body, category });
  }

  saveData();
  closeEdit();
  renderFilters();
  renderPrompts();
  showToast("✅ 保存しました");
}

function deleteEdit() {
  if (!editingPrompt?.id) return;
  if (!confirm("本当に削除しますか？")) return;
  allPrompts = allPrompts.filter(p => p.id !== editingPrompt.id);
  saveData();
  closeEdit();
  renderFilters();
  renderPrompts();
  showToast("🗑️ 削除しました");
}

// ========== コピー機能 ==========
function copyPrompt(id, e) {
  e.stopPropagation();
  const prompt = allPrompts.find(p => p.id === id);
  if (!prompt) return;

  navigator.clipboard.writeText(prompt.body).then(() => {
    const btn = e.target;
    const text = btn.textContent;
    btn.textContent = "✅ コピーしました!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = text;
      btn.classList.remove("copied");
    }, 1500);
    showToast("✅ クリップボードにコピーしました");
  }).catch(() => {
    showToast("❌ コピーに失敗しました");
  });
}

// ========== 設定 ==========
function openSettings() {
  document.getElementById("settingsSheet").classList.add("open");
  pushHistory();
}

function closeSettings() {
  document.getElementById("settingsSheet").classList.remove("open");
}

window.exportData = function() {
  const data = JSON.stringify(allPrompts, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompts_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("📥 ダウンロードしました");
};

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data)) throw new Error("Invalid format");
      allPrompts = data.map((p, i) => ({
        id: p.id || `p${Date.now()}_${i}`,
        category: p.category || "business",
        title: p.title || "",
        summary: p.summary || "",
        body: p.body || ""
      }));
      saveData();
      renderFilters();
      renderPrompts();
      showToast(`✅ ${data.length}件のプロンプトを復元しました`);
    } catch {
      showToast("❌ インポートに失敗しました");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

window.resetData = function() {
  if (!confirm("すべてのプロンプトを削除しますか？")) return;
  allPrompts = SEED.map((p, i) => ({ ...p, id: `p${Date.now()}_${i}` }));
  saveData();
  renderFilters();
  renderPrompts();
  showToast("🔄 リセットしました");
};

// ========== 検索 ==========
function setupSearch() {
  document.getElementById("searchInput")?.addEventListener("input", () => renderPrompts());
}

function clearSearch() {
  document.getElementById("searchInput").value = "";
  document.getElementById("searchClear").style.display = "none";
  renderPrompts();
}

// ========== トースト ==========
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "flex";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

// ページ読込完了時に初期化
document.addEventListener("DOMContentLoaded", init);
