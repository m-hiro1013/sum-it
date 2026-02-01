# 🗄️ DATABASE.md

## sum-it データモデル設計

### 1. agents コレクション
AIエージェントの基本情報を定義するよ。

| フィールド | 型 | 説明 |
|-----------|---|------|
| name | string | エージェント名 |
| role | string | 役割（critic, optimist, etc.） |
| persona | string | 性格・キャラ設定 |
| prompt | string | システムプロンプト |
| output_style | string | 出力スタイル |
| llm | string | プロバイダー (openai, anthropic, google) |
| model | string | モデル名 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### 2. meetings コレクション
開催される会議の情報を管理。

| フィールド | 型 | 説明 |
|-----------|---|------|
| title | string | 会議タイトル |
| topic | string | 議題 |
| agent_ids | array<string> | 参加エージェントのID配列 |
| status | string | pending / in_progress / completed / error |
| summary | string | 集約サマリー |
| created_at | timestamp | 開始日時 |
| completed_at | timestamp | 終了日時 |

### 3. messages コレクション
会議中の実際の発言履歴。

| フィールド | 型 | 説明 |
|-----------|---|------|
| meeting_id | string | 会議ID（参照） |
| agent_id | string | エージェントID（参照） |
| agent_name | string | エージェント名（非正規化） |
| content | string | 発言内容 |
| order | number | 発言順序 |
| created_at | timestamp | 発言日時 |
