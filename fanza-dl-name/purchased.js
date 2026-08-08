// 同人の一覧ページで購入済み商品を薄く表示する

(function () {
  "use strict";

  // 挿入する style 要素の id（重複挿入・削除の目印）
  const STYLE_ID = "fanza-dl-name-dim-purchased";

  // 購入済み商品を半透明にする CSS
  const CSS = `
.productList__item:has(.listPurchased__btn) {
  opacity: 0.4;
  background-color: #ccc;
}

.mainList__item:has(.mainListPurchaseStatus__btn--purchased) {
  opacity: 0.4;
  background-color: #ccc;
}
`;

  // 設定に応じて style 要素を挿入・削除する
  const applyStyle = (enabled) => {
    const existing = document.getElementById(STYLE_ID);

    if (!enabled) {
      existing?.remove();
      return;
    }

    if (existing) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    // document_start では head がまだ無いことがある
    (document.head ?? document.documentElement).appendChild(style);
  };

  loadSettings().then((settings) => applyStyle(settings.dimPurchased));

  // 設定画面での変更を開いているページへ即時反映する
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes.dimPurchased) return;
    applyStyle(changes.dimPurchased.newValue ?? DEFAULT_SETTINGS.dimPurchased);
  });
})();
