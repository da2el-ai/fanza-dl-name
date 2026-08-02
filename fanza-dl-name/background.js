// content script からの依頼を受けてファイル名を指定したダウンロードを実行する

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "download") return;

  chrome.downloads.download(
    {
      url: message.url,
      filename: message.filename,
      // 同名ファイルがある場合は連番を付けて保存
      conflictAction: "uniquify",
      saveAs: false,
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true, downloadId });
    },
  );

  // 非同期で応答するため true を返す
  return true;
});
