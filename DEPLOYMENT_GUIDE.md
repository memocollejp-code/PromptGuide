# 📱 プロンプト引き出し PWA - GitHub Pages デプロイガイド

## 📦 ファイル構成

```
リポジトリルート/
├── index.html                              ← メイン（HTMLファイル）
├── prompt_drawer_pwa_2026-07-01_v1.html   ← 同一内容（バックアップ）
├── sw.js                                   ← Service Worker
├── manifest.json                           ← PWA設定（SVG埋め込み）
├── .nojekyll                               ← Jekyll無効化（空ファイル）
└── README.md                               ← このファイル

※ icon.png は不要（SVGをデータURIで埋め込み済み）
```

---

## 🚀 デプロイ手順

### 1. リポジトリに全ファイルを配置

```bash
# ローカルリポジトリにファイルをコピー
cp index.html gh-pages-repo/
cp sw.js gh-pages-repo/
cp manifest.json gh-pages-repo/
cp .nojekyll gh-pages-repo/
```

※ `icon.png` は SVG 埋め込み済みなので不要

### 2. Git コミット＆プッシュ

```bash
cd gh-pages-repo/
git add .
git commit -m "🚀 Deploy Prompt Drawer PWA v1"
git push origin main (または gh-pages)
```

### 3. GitHub Pages設定

- リポジトリの **Settings → Pages** に移動
- **Source** を「Deploy from a branch」に設定
- **Branch** を「main（または gh-pages）」に選択
- **Folder** を「/(root)」に設定
- 「Save」をクリック

### 4. デプロイ完了

1〜2分で以下のURLでアクセス可能：
```
https://[ユーザー名].github.io/[リポジトリ名]/
```

---

## 📲 PWA をスマホにインストール

### Chrome (Android)

1. アプリにアクセス
2. 右上の **⋮ メニュー**
3. **「アプリをインストール」** をタップ
4. 確認 → ホーム画面に追加完了 ✅

### Safari (iOS)

1. アプリを開く
2. 下部の **共有ボタン** をタップ
3. **「ホーム画面に追加」** をタップ
4. 名前を確認 → 「追加」をタップ

---

## 🔄 バージョンアップ手順（キャッシュ自動削除対応）

### 更新が必要な場合

1. **HTMLファイルのバージョン番号を変更**

   ```javascript
   const APP_VERSION = "20260701v2";  // ← ここを変更
   ```

2. **Service Worker のバージョンをコメント更新**

   ```javascript
   // Version: 20260701v2  ← ここも変更
   ```

3. **ファイル名もバージョン込みで変更（推奨）**

   ```
   prompt_drawer_pwa_2026-07-01_v2.html  ← _v1 → _v2
   ```

4. Git コミット＆プッシュ

   ```bash
   git add .
   git commit -m "✨ Update to v2 - [変更内容]"
   git push origin main
   ```

### 何が起こるか

1. ユーザーがアプリを開く
2. Service Worker が新バージョンを検出
3. 旧キャッシュが自動削除される
4. 新バージョンに自動リロード
5. ユーザーは何もしなくてOK ✅

---

## 🔧 トラブルシューティング

### ❌ アイコンが表示されない

→ ブラウザキャッシュをクリア（Ctrl+Shift+Delete）
→ manifest.json のSVGデータURIが正しいか確認（HTMLのfaviconとsyncしているか）
→ ブラウザのコンソールでエラー確認

### ❌ Service Worker が登録されない

→ ブラウザのコンソールで確認
```javascript
// Chrome DevTools → Console
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));
```

→ `sw.js` が正しく配置されているか確認
→ HTTPSが有効か確認（GitHub Pages は自動HTTPS）

### ❌ インポートに失敗する

→ JSONファイルの形式が正しいか確認
→ ブラウザのコンソールでエラー内容を確認

### ❌ ダークモードが切り替わらない

→ ローカルストレージをリセット
```javascript
localStorage.removeItem("prompt_drawer_theme");
location.reload();
```

---

## 📝 重要な設定値

| 項目 | 値 |
|------|-----|
| キャッシュプレフィックス | `prompt-drawer` |
| バージョン形式 | `YYYYMMDDVN` |
| ストレージキー | `prompt_drawer_data` |
| テーマキー | `prompt_drawer_theme` |
| ドラフト保存キー | `prompt_drawer_draft` |

---

## 🎯 動作確認チェックリスト

- [ ] ホーム画面からアプリが起動できる
- [ ] プロンプトを追加・編集・削除できる
- [ ] 検索・フィルタが機能する
- [ ] 「戻る」ボタンで画面遷移できる
- [ ] リロード後もデータが消えない（自動保存）
- [ ] JSONのインポート・エクスポートができる
- [ ] ダークモードが切り替わる
- [ ] オフライン時もキャッシュから表示される
- [ ] 新バージョン時に自動リロードされる

---

## 📧 サポート

何か問題が発生した場合は、以下を確認してください：

1. ブラウザのコンソール（DevTools）でエラーを確認
2. ローカルストレージをクリア：`localStorage.clear()`
3. Service Worker をアンインストール＆再登録
4. ブラウザキャッシュをクリア

---

**🎉 これでPWA化は完了です！**
