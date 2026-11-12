# Narekan Plus

ナレカン（narekan.jp）を拡張する Chrome 拡張（Manifest V3）。

## 機能
- **お気に入りFAQ**: FAQ詳細ページのタイトル横の ★ で登録/解除。FAQトップの検索欄下の「★お気に入り」タブで一覧表示。保存先は localStorage（チーム別）。

## 導入
1. `chrome://extensions` →「デベロッパーモード」ON
2. 「パッケージ化されていない拡張機能を読み込む」でこのフォルダ（`manifest.json` がある場所）を選択
3. ナレカンのFAQページをリロード

## 構成
`src/features/` に機能を1ファイルずつ追加し、`manifest.json` の `content_scripts.js` に `src/content.js` より前で登録する。
DOM変更時は `src/features/favoriteFaqs.js` 冒頭の `SELECTORS` を調整。
