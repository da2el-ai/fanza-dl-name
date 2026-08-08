// 設定のデフォルト値と読み込み処理
// content script と popup の両方から読み込まれる

// 設定のデフォルト値
const DEFAULT_SETTINGS = {
  // 全体テンプレート（{{サークル名}} と {{作品名}} が置換される）
  template: "(同人誌) [{{サークル名}}] {{作品名}}.zip",
  // サークル名を取得する querySelector
  circleSelector: ".circleNamezjQ9A",
  // 作品名を取得する querySelector
  titleSelector: ".productDetailTitleRdzpP a",
  // 同人一覧ページで購入済み商品を薄く表示するか
  dimPurchased: true,
};

// 要素が見つからなかった場合に使う値
const FALLBACK = {
  circle: "不明サークル",
  title: "不明タイトル",
};

// 保存済みの設定を読み込む（未設定の項目はデフォルト値で補完される）
const loadSettings = async () => {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
};
