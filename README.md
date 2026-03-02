# Vision3 - 未来から逆算して今日を設計する

> 夢を入力すると、AIが今日やるべき具体的な行動を3つ提案する行動設計アプリ。

## 技術スタック

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Google Gemini API** (gemini-2.0-flash)
- **LocalStorage** (データ保存)

## ローカル開発

```bash
cd vision3-web
npm install
```

### 環境変数

`.env.local` ファイルを作成:

```
GEMINI_API_KEY=your_api_key_here
```

### 起動

```bash
npm run dev
```

http://localhost:3000 で開きます。

## Vercelデプロイ手順

1. このリポジトリをGitHubにプッシュ
2. [vercel.com](https://vercel.com) でGitHubリポジトリをインポート
3. **Root Directory** を `vision3-web` に設定
4. **Environment Variables** に `GEMINI_API_KEY` を追加
5. Deploy

## 機能

- 🎯 夢（Goal）入力 → AIが3タスク自動生成
- ✏️ タスクの編集・削除・追加
- ✓ ワンタップ完了 → 次のアクション提案
- 🔄 完了後に「発展タスク」or「別案」を選択
- 💚 丸つけ機能（ポジティブフィードバック）
- 📋 履歴ページ（過去のGoalとタスク一覧）
