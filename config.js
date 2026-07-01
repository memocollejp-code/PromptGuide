// config.js - プロンプト引き出し設定
window.APP_CONFIG = {
  "CATEGORIES": {
    "business": { "label": "ビジネス", "color": "#3b82f6" },
    "creative": { "label": "クリエイティブ", "color": "#a855f7" },
    "technical": { "label": "技術", "color": "#ef4444" },
    "daily": { "label": "日常", "color": "#f59e0b" },
    "code": { "label": "コード", "color": "#06b6d4" }
  },
  "SEED": [
    {
      "title": "要件定義ヒアリング",
      "summary": "クライアント要件をまとめるプロンプト",
      "body": "あなたはシステムコンサルタントです。以下のクライアント要件をまとめて、実装仕様書に落とし込んでください。",
      "category": "business"
    },
    {
      "title": "ブレインストーミング",
      "summary": "創造的なアイデア出しに使う",
      "body": "あなたはクリエイティブディレクターです。{topic}についてのアイデアを10個提案してください。質より奇想天外さを重視してください。",
      "category": "creative"
    },
    {
      "title": "コード解析",
      "summary": "既存コードの説明を得る",
      "body": "以下のコードを詳しく説明してください。各関数の役割と全体の流れを含めてください。\n\n```\n{code}\n```",
      "category": "code"
    },
    {
      "title": "文章校正",
      "summary": "誤字脱字・表現の改善",
      "body": "以下の文章を校正してください。誤字脱字、文法の改善、より自然な表現への修正を行ってください。\n\n【原文】\n{text}",
      "category": "daily"
    },
    {
      "title": "マーケティング戦略",
      "summary": "SNS/広告戦略の立案",
      "body": "あなたはマーケティング戦略家です。{product}を対象に、SNS・広告戦略を立案してください。ターゲット、チャネル、メッセージを明確にしてください。",
      "category": "business"
    }
  ]
};

console.log("✅ APP_CONFIG loaded:", window.APP_CONFIG);
