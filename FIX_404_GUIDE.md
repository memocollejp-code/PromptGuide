# 🚨 GitHub Pages 404 エラー解決ガイド

## 原因

- `manifest.json` がリポジトリに **存在しない**
- `sw.js` がリポジトリに **存在しない**
- 結果：`index.html` は存在するが、参照ファイルが 404 → PWA 設定が読み込めず

---

## ✅ 解決方法（3ステップ）

### ステップ 1: ローカルで 3 ファイルを確認

```
your-repo/
├── index.html         ← ✅ あり
├── manifest.json      ← ❌ ないはず → 追加する
└── sw.js             ← ❌ ないはず → 追加する
```

### ステップ 2: 新しいファイルをコピー

下記の 2 ファイルを **リポジトリのルート** に配置：

1. **`manifest_fix.json`** → **`manifest.json`** に名前変更
2. **`sw_fix.js`** → **`sw.js`** に名前変更

### ステップ 3: Git コミット＆プッシュ

```bash
cd your-repo/

# 確認（3つあるはず）
ls -la | grep -E "index.html|manifest.json|sw.js"

# 追加＆コミット
git add manifest.json sw.js
git commit -m "🔧 Fix: Add manifest.json and sw.js for PWA support"
git push origin main (または main/master)
```

### ステップ 4: 待機＆確認

- **1〜2 分待つ**（GitHub Pages ビルド時間）
- `https://[username].github.io/[repo-name]/` にアクセス
- ✅ プロンプト一覧が表示される
- ✅ 右上の ⚙️ 設定ボタンが効く

---

## 📱 Chrome インストール手順

1. **アプリにアクセス**
   ```
   https://[username].github.io/[repo-name]/
   ```

2. **Chrome 右上の ⋮ メニュー**

3. **「アプリをインストール」** をタップ
   - または 「ホーム画面に追加」

4. **確認ダイアログで「インストール」**

5. ✅ ホーム画面に **虹色の引き出し** アイコンが追加される

---

## 🔍 確認チェックリスト

| 項目 | 状態 | チェック |
|------|------|---------|
| `index.html` がリポジトリルートにある | ✅ あり | ☑ |
| `manifest.json` がリポジトリルートにある | ✅ あり | ☑ |
| `sw.js` がリポジトリルートにある | ✅ あり | ☑ |
| GitHub Pages が有効（Settings → Pages） | ✅ main/gh-pages | ☑ |
| HTTPSが有効（リポジトリ名が大文字 → 小文字になってない） | ✅ 自動HTTPS | ☑ |
| プロンプト一覧が表示される | ✅ 表示される | ☑ |
| 右上の ⚙️ ボタンが反応する | ✅ 反応する | ☑ |
| Chrome 右上に「インストール」が出現 | ✅ 出現する | ☑ |
| インストール後、ホーム画面にアイコンがある | ✅ ある | ☑ |

---

## 🛠 トラブルシューティング

### Q: まだ 404 が出る

**A:**
1. `manifest.json` と `sw.js` がリポジトリルートにあるか確認
2. 大文字小文字が正しいか確認（`Manifest.json` ❌ → `manifest.json` ✅）
3. GitHub Pages のビルドが完了するまで 1 分待つ
4. ブラウザキャッシュをクリア（Ctrl+Shift+Delete）

### Q: インストールボタンが出ない

**A:**
1. `manifest.json` が正しく読み込まれているか確認
   - DevTools → Application → Manifest を確認
2. HTTPS が有効か確認
3. Service Worker が登録されているか確認
   - DevTools → Application → Service Workers

### Q: インストール後に Chrome マークが見える

**A:**
- これは Chrome のアプリインストール形式
- 正常な動作です
- ホーム画面のアイコンから起動できればOK

---

## 📋 ファイルの中身確認

### manifest.json が正しく読み込まれた場合

DevTools 開いて：
```
Chrome → DevTools → Application → Manifest
```

↓ こんな感じで表示されるはず：

```
Name: プロンプトの引き出し
Short name: プロンプト
Start URL: /
Display: standalone
Icons: 3個
```

### sw.js が正しく登録された場合

```
Chrome → DevTools → Application → Service Workers
```

↓ こんな感じで表示されるはず：

```
prompt-drawer-20260701v1
Status: activated and running
```

---

## 🎉 完了

全部チェック ✅ なら **PWA 化完成**だ！

疑問あったらいつでも声かけて。俺がサポートする 💪
