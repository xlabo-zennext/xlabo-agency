/**
 * X-LABO 代理店管理アプリ → Googleスプレッドシート 反映用 Web App
 *
 * 【セットアップ】
 *  1. 対象スプレッドシートを開く → 拡張機能 → Apps Script
 *  2. このコードを貼り付けて保存
 *  3. 右上「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *       - 実行するユーザー：自分
 *       - アクセスできるユーザー：全員（リンクを知っている全員）
 *  4. 発行された「ウェブアプリのURL（/exec で終わる）」をコピー
 *  5. アプリ側の .env.local に  NEXT_PUBLIC_SHEET_WEBAPP_URL=<そのURL>  を設定
 *
 * 受け取るJSON: { tab, action: "append"|"upsert", keyField?, rows: [ {列名:値, ...}, ... ] }
 *  - append : 空き行（IDが空の最初の行）から順に書き込み
 *  - upsert : keyField（例「代理店ID」）が一致する行を更新。無ければ空き行に追記
 * 見出し行は各タブの1〜5行目から自動判定します（このシートは2行目が見出し）。
 */

function doGet() {
  return json_({ ok: true, service: "xlabo-sheet-sync", time: new Date().toISOString() });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var tab = body.tab;
    var rows = body.rows || [];
    var action = body.action || "append";
    var keyField = body.keyField || null;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tab);
    if (!sheet) return json_({ ok: false, error: "tab not found: " + tab });

    var info = findHeader_(sheet, rows[0] ? Object.keys(rows[0]) : []);
    if (!info) return json_({ ok: false, error: "header not found in tab: " + tab });
    var header = info.header;         // 列名の配列
    var headerRow = info.headerRow;   // 見出し行番号(1始まり)
    var colIndex = {};                // 列名 → 列番号(1始まり)
    header.forEach(function (name, i) { if (name) colIndex[String(name).trim()] = i + 1; });

    var keyCol = keyField && colIndex[keyField] ? colIndex[keyField] : (colIndex[header[0]] || 1);
    var written = 0;

    rows.forEach(function (row) {
      var targetRow = null;
      if (action === "upsert" && keyField && row[keyField]) {
        targetRow = findRowByKey_(sheet, headerRow, keyCol, row[keyField]);
      }
      if (!targetRow) targetRow = firstEmptyRow_(sheet, headerRow, keyCol);
      Object.keys(row).forEach(function (name) {
        var c = colIndex[String(name).trim()];
        if (c) sheet.getRange(targetRow, c).setValue(row[name]);
      });
      written++;
    });

    return json_({ ok: true, written: written, tab: tab });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** 見出し行を1〜5行目から探す（渡されたキーに最も一致する行） */
function findHeader_(sheet, keys) {
  var scan = Math.min(5, sheet.getLastRow());
  var lastCol = sheet.getLastColumn();
  if (scan === 0 || lastCol === 0) return null;
  var best = null, bestScore = -1;
  for (var r = 1; r <= scan; r++) {
    var vals = sheet.getRange(r, 1, 1, lastCol).getValues()[0];
    var set = {};
    vals.forEach(function (v) { if (v) set[String(v).trim()] = true; });
    var score = 0;
    keys.forEach(function (k) { if (set[k]) score++; });
    if (keys.length === 0) score = vals.filter(function (v) { return v !== ""; }).length;
    if (score > bestScore) { bestScore = score; best = { header: vals, headerRow: r }; }
  }
  return best;
}

/** キー列で値が一致する行を返す（無ければ null） */
function findRowByKey_(sheet, headerRow, keyCol, value) {
  var last = sheet.getLastRow();
  if (last <= headerRow) return null;
  var col = sheet.getRange(headerRow + 1, keyCol, last - headerRow, 1).getValues();
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][0]).trim() === String(value).trim()) return headerRow + 1 + i;
  }
  return null;
}

/** キー列が空の最初の行（無ければ最終行の次） */
function firstEmptyRow_(sheet, headerRow, keyCol) {
  var last = sheet.getLastRow();
  if (last <= headerRow) return headerRow + 1;
  var col = sheet.getRange(headerRow + 1, keyCol, last - headerRow, 1).getValues();
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][0]).trim() === "") return headerRow + 1 + i;
  }
  return last + 1;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
