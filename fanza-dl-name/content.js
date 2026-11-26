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

  // ログの接頭辞
  const LOG_PREFIX = "[FANZAファイル名指定DL]";
  // ダウンロードリンクのセレクタ
  const DOWNLOAD_LINK_SELECTOR = 'a[data-common-click-event-name="download"]';
  // 要素が出るまで待つ最大時間（ミリ秒）
  const DIAGNOSE_TIMEOUT = 10000;

  // セレクタの状態を調べる（invalid: 書式不正 / missing: 見つからない / found: 見つかった）
  const inspectSelector = (selector) => {
    if (!selector) return { status: "missing", text: "" };
    try {
      const el = document.querySelector(selector);
      if (!el) return { status: "missing", text: "" };
      const text = sanitize(el.textContent);
      return text ? { status: "found", text } : { status: "missing", text: "" };
    } catch (e) {
      return { status: "invalid", text: "" };
    }
  };

  // ページの状態を調べる
  const inspectPage = (settings) => ({
    linkCount: document.querySelectorAll(DOWNLOAD_LINK_SELECTOR).length,
    circle: inspectSelector(settings.circleSelector),
    title: inspectSelector(settings.titleSelector),
  });

  // すべての要素がそろったか（書式不正のセレクタは待っても変わらないので完了扱い）
  const isReady = (state) =>
    state.linkCount > 0 &&
    state.circle.status !== "missing" &&
    state.title.status !== "missing";

  // セレクタの問題を理由の文にする
  const selectorReason = (label, selector, result, fallback) => {
    if (result.status === "invalid") {
      return `${label}のセレクタ「${selector}」の書式が不正です（「${fallback}」になります）`;
    }
    if (result.status === "missing") {
      return `${label}の要素「${selector}」が見つかりません（「${fallback}」になります）`;
    }
    return null;
  };

  // 判定結果をコンソールに表示する
  const report = (settings, state) => {
    // ダウンロードリンクが無ければ動作しない
    if (state.linkCount === 0) {
      console.error(
        `${LOG_PREFIX} ❌ 動作しません: ダウンロードリンク ${DOWNLOAD_LINK_SELECTOR} が見つかりません（${DIAGNOSE_TIMEOUT / 1000}秒待機）`,
      );
      return;
    }

    const filename = buildFilename(settings);
    const summary = `サークル名: ${state.circle.text || FALLBACK.circle} / 作品名: ${state.title.text || FALLBACK.title} / ファイル名: ${filename} / DLリンク: ${state.linkCount}件`;

    // 警告の理由を集める
    const reasons = [
      selectorReason("サークル名", settings.circleSelector, state.circle, FALLBACK.circle),
      selectorReason("作品名", settings.titleSelector, state.title, FALLBACK.title),
    ];
    if (!settings.template.includes("{{サークル名}}")) {
      reasons.push("テンプレートに {{サークル名}} が入っていません");
    }
    if (!settings.template.includes("{{作品名}}")) {
      reasons.push("テンプレートに {{作品名}} が入っていません");
    }
    const warnings = reasons.filter(Boolean);

    if (warnings.length > 0) {
      console.warn(`${LOG_PREFIX} ⚠️ 動作しますが注意があります（${summary}）\n- ${warnings.join("\n- ")}`);
    } else {
      console.log(`${LOG_PREFIX} ✅ 動作します（${summary}）`);
    }
  };

  // 読み込み時に動作できるかを判定する
  const diagnose = async () => {
    console.log(`${LOG_PREFIX} content script を読み込みました`);

    let settings;
    try {
      settings = await loadSettings();
    } catch (e) {
      console.error(`${LOG_PREFIX} ❌ 動作しません: 設定を読み込めませんでした`, e);
      return;
    }

    // すでに要素がそろっていればすぐに表示
    const first = inspectPage(settings);
    if (isReady(first)) {
      report(settings, first);
      return;
    }

    // 要素が描画されるのを待つ
    await new Promise((resolve) => {
      const finish = () => {
        observer.disconnect();
        clearTimeout(timer);
        resolve();
      };
      const observer = new MutationObserver(() => {
        if (isReady(inspectPage(settings))) finish();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(finish, DIAGNOSE_TIMEOUT);
    });

    report(settings, inspectPage(settings));
  };

  diagnose();

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest(DOWNLOAD_LINK_SELECTOR);
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
