# sum-it Database Design (Firestore)

## Collections

### 1. `agents` (AIエージェント設定)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `name` | string | エージェント名 |
| `role` | string | 役割 |
| `avatar_url` | string | アイコン画像URL |
| `persona` | string | 性格・基本設定 |
| `prompt` | string | 詳細なシステムプロンプト |
| `style_id` | string | 選択された出力形式のID |
| `llm` | string | LLMプロバイダー |
| `model` | string | LLMモデルID |
| `created_at` | timestamp | 作成日時 |
| `updated_at` | timestamp | 更新日時 |

### 2. `llm_models` (使用可能なLLMモデル一覧)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `provider` | string | 提供元 |
| `model_id` | string | API呼び出し用ID |
| `name` | string | 表示名 |
| `tier` | string | ティアラベル |
| `description` | string | 特徴説明 |
| `is_active` | boolean | アクティブ状態 |

### 3. `output_styles` (出力形式のカスタマイズ管理)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `name` | string | 形式名 (例: 「詳細かつ論理的」) |
| `prompt_segment` | string | 出力指示プロンプトの断片 |
| `description` | string | 形式の説明文 |
| `is_active` | boolean | 選択肢に表示するか |
| `created_at` | timestamp | 作成日時 |

### 4. `facilitators` (議長の設定 - 開始/結論のロジック)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `name` | string | 議長スタイル名 (例: 「要旨まとめ型」「次のアクション決定型」) |
| `description` | string | 議長の特徴説明 |
| `start_prompt` | string | 会議開始時に全エージェントに提示するルール |
| `end_prompt` | string | 結論（サマリー）作成時の具体的な指示 |
| `is_active` | boolean | 選択肢に表示するか |
| `created_at` | timestamp | 作成日時 |

### 5. `meeting_templates` (🆕 会議構成テンプレート)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `name` | string | テンプレート名 (例: 「コードレビュー」「リサーチ」) |
| `description` | string | テンプレートの説明文 |
| `facilitator_id` | string | デフォルトの議長ID |
| `agent_ids` | array[string] | デフォルトの参加エージェントID一覧 |
| `is_active` | boolean | 選択肢に表示するか |
| `created_at` | timestamp | 作成日時 |

### 6. `meeting_workflows` (🆕 ワークフロー定義)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `name` | string | ワークフロー名 |
| `description` | string | 説明文 |
| `facilitator_id` | string | 議長ID |
| `agent_ids` | array[string] | 参加エージェントID一覧 |
| `steps` | array[WorkflowStep] | 実行ステップの配列 |
| `is_active` | boolean | 有効/無効 |
| `created_at` | timestamp | 作成日時 |

#### WorkflowStep Types
| Type | Fields | Description |
|------|--------|-------------|
| `speak` | `agent_id: string` | 1人が発言 |
| `parallel_speak` | `agent_ids: string[]` | 複数人が同時発言 |
| `summary` | - | 議長がまとめ（会議完了） |
| `user_intervention` | `label?: string` | ユーザー介入（一時停止） |

### 6. `meetings` (会議室 - ログと設定)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `title` | string | 会議タイトル (保存用) |
| `topic` | string | 会議のメインテーマ |
| `whiteboard` | string | ホワイトボード（全エージェントの共通認識） |
| `facilitator_id` | string | 使用された議長ID |
| `agent_ids` | array[string] | 参加エージェントのID一覧 |
| `workflow_id` | string | 🆕 使用するワークフローID（オプション） |
| `current_step` | number | 🆕 現在のステップ番号（0始まり） |
| `status` | string | 状態 (pending, in_progress, waiting, completed, error) |
| `final_conclusion` | string | 議長が作成したまとめ（結論） |
| `created_at` | timestamp | 開始日時 |
| `completed_at` | timestamp | 完了日時 |

### 7. `messages` (会議の発言履歴)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `meeting_id` | string | 会議ID |
| `agent_id` | string | エージェントID |
| `agent_name` | string | 表示名 |
| `content` | string | 発言内容 |
| `created_at` | timestamp | 発言日時 |

## Relationships
- `agents.style_id` → `output_styles.id`
- `meetings.facilitator_id` → `facilitators.id`
- `meetings.agent_ids` → `agents.id` (array)
- `messages.meeting_id` → `meetings.id`
- `messages.agent_id` → `agents.id` (or "system")
- `meeting_templates.agent_ids` → `agents.id` (array)
- `meetings.workflow_id` → `meeting_workflows.id`
- `meeting_workflows.facilitator_id` → `facilitators.id`
- `meeting_workflows.agent_ids` → `agents.id` (array)
