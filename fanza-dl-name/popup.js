// 設定画面の読み込み・保存

// テキスト入力の項目
const textFields = {
  template: document.getElementById("template"),
  circleSelector: document.getElementById("circleSelector"),
  titleSelector: document.getElementById("titleSelector"),
};

// チェックボックスの項目
const checkFields = {
  dimPurchased: document.getElementById("dimPurchased"),
};
const statusEl = document.getElementById("status");

let statusTimer = null;

// 画面下部にメッセージを一時表示する
const showStatus = (message) => {
  statusEl.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.textContent = "";
  }, 2000);
};

// 設定値を入力欄へ反映する
const applyToForm = (settings) => {
  for (const [key, el] of Object.entries(textFields)) {
    el.value = settings[key];
  }
  for (const [key, el] of Object.entries(checkFields)) {
    el.checked = settings[key];
  }
};

// 起動時に保存済みの設定を表示
loadSettings().then(applyToForm);

// 保存
document.getElementById("save").addEventListener("click", async () => {
  const settings = {};
  for (const [key, el] of Object.entries(textFields)) {
    // 空欄の項目はデフォルト値に戻す
    settings[key] = el.value.trim() || DEFAULT_SETTINGS[key];
  }
  for (const [key, el] of Object.entries(checkFields)) {
    settings[key] = el.checked;
  }

  await chrome.storage.sync.set(settings);
  applyToForm(settings);
  showStatus("保存しました");
});

// デフォルトに戻す（入力欄へ反映するだけで、保存は「保存」ボタンで行う）
document.getElementById("reset").addEventListener("click", () => {
  applyToForm(DEFAULT_SETTINGS);
  showStatus("デフォルト値を入力しました（保存を押してください）");
});
