// FANZA購入済み作品ページのダウンロードクリックを横取りし、
// 設定されたテンプレートからファイル名を生成して background に依頼する

(function () {
  "use strict";

  // ファイル名に使えない文字を除去
  const sanitize = (str) => str.replace(/[\\/:*?"<>|]/g, "").trim();

  // セレクタで要素を取得し、テキストをサニタイズして返す
  // 要素が見つからない場合はフォールバック値を返す
  const pickText = (selector, fallback) => {
    if (!selector) return fallback;

    let el = null;
    try {
      el = document.querySelector(selector);
    } catch (e) {
      // セレクタの書式が不正な場合
      console.warn("[FANZAファイル名指定DL] セレクタが不正です:", selector, e);
      return fallback;
    }

    if (!el) return fallback;

    const text = sanitize(el.textContent);
    return text || fallback;
  };

  // テンプレートのプレースホルダーを置換してファイル名を生成
  const buildFilename = (settings) => {
    const circle = pickText(settings.circleSelector, FALLBACK.circle);
    const title = pickText(settings.titleSelector, FALLBACK.title);

    return settings.template
      .replaceAll("{{サークル名}}", circle)
      .replaceAll("{{作品名}}", title);
  };

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest('a[data-common-click-event-name="download"]');
      if (!a || !a.href) return;

      // 標準のダウンロード動作を止める（設定読み込み前に同期的に行う必要がある）
      e.preventDefault();
      e.stopImmediatePropagation();

      const url = a.href;

      (async () => {
        const settings = await loadSettings();
        const filename = buildFilename(settings);

        const res = await chrome.runtime.sendMessage({
          type: "download",
          url,
          filename,
        });

        if (!res?.ok) {
          console.error("[FANZAファイル名指定DL] ダウンロードに失敗しました:", res?.error);
          alert(`ダウンロードに失敗しました\n${res?.error ?? "原因不明"}`);
        }
      })();
    },
    true,
  );
})();
