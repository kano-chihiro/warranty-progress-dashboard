/**
 * 保証進捗ダッシュボード — Google Apps Script バックエンド
 *
 * データストア: Google Spreadsheet "保証進捗ダッシュボード - データストア"
 *   - "Data" シート: キー / JSON値 / 更新日時
 *
 * デプロイ時に「自分のみ」または「組織内」に制限すれば認証が自動的にかかる。
 */

// ===== 設定 =====
var SPREADSHEET_ID = '1BQZhzqHGTJkrCP8Xfzc8ooJM94UD9_z-qIodqswW5pY';
var DATA_SHEET_NAME = 'Data';

// データキー一覧
var DATA_KEYS = [
  'warrantyDashboardData',
  'serviceDashboardData',
  'hardwareDashboardData',
  'dashboardViewState'
];

// ===== Web App エントリーポイント =====

function doGet() {
  var html = HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('保証 進捗ダッシュボード')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  return html;
}

// テンプレートから他の HTML ファイルをインクルードするヘルパー
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ===== データ永続化 =====

/**
 * 全データをスプレッドシートから読み込む
 * @return {Object} { warrantyDashboardData, serviceDashboardData, hardwareDashboardData, dashboardViewState }
 */
function loadAllData() {
  var sheet = getDataSheet_();
  var data = sheet.getDataRange().getValues();
  var result = {};

  // ヘッダー行をスキップ（1行目はヘッダー）
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var value = data[i][1];
    if (key && DATA_KEYS.indexOf(key) !== -1) {
      try {
        // dashboardViewState は文字列のまま、他は JSON パース
        result[key] = (key === 'dashboardViewState') ? value : JSON.parse(value);
      } catch (e) {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * 全データをスプレッドシートに保存
 * @param {Object} allData - { warrantyDashboardData, serviceDashboardData, hardwareDashboardData, dashboardViewState }
 */
function saveAllData(allData) {
  var sheet = getDataSheet_();
  var now = new Date().toISOString();

  // 既存データの行マップを構築
  var data = sheet.getDataRange().getValues();
  var rowMap = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      rowMap[data[i][0]] = i + 1; // 1-indexed row number
    }
  }

  // 各キーを更新または追加
  for (var k = 0; k < DATA_KEYS.length; k++) {
    var key = DATA_KEYS[k];
    if (allData[key] === undefined) continue;

    var value = (key === 'dashboardViewState')
      ? allData[key]
      : JSON.stringify(allData[key]);

    if (rowMap[key]) {
      // 既存行を更新
      sheet.getRange(rowMap[key], 2).setValue(value);
      sheet.getRange(rowMap[key], 3).setValue(now);
    } else {
      // 新規行を追加
      sheet.appendRow([key, value, now]);
    }
  }

  return { ok: true, savedAt: now };
}

// ===== プライベートヘルパー =====

function getDataSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(DATA_SHEET_NAME);

  // 初回: ヘッダーがなければ作成
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['key', 'value', 'updatedAt']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  }

  return sheet;
}
