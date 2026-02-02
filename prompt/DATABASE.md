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
| `temperature` | number | LLMの創造性（0〜1.0、デフォルト0.7） | 🆕
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

### 4. `meeting_workflows` (ワークフロー定義 - 進行ロジックの核)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `name` | string | ワークフロー名 |
| `description` | string | ワークフローの説明文 |
| `start_prompt` | string | 会議開始時に全エージェントに提示するルール（旧議長から統合） |
| `end_prompt` | string | 結論（サマリー）作成時の具体的な指示（旧議長から統合） |
| `agent_ids` | array[string] | 使用する参加エージェントID一覧 |
| `steps` | array[WorkflowStep] | 実行ステップの配列 |
| `is_active` | boolean | 選択肢に表示するか |
| `created_at` | timestamp | 作成日時 |

#### WorkflowStep Types
| Type | Fields | Description |
|------|--------|-------------|
| `speak` | `agent_id: string` | 1人が発言 |
| `parallel_speak` | `agent_ids: string[]` | 複数人が同時発言 |
| `summary` | `agent_id: string` | 指定エージェントがまとめ（会議完了） | 🔄
| `user_intervention` | `label?: string` | ユーザー介入（一時停止） |

### 5. `meetings` (会議室 - ログと設定)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `title` | string | 会議タイトル (保存用) |
| `topic` | string | 会議のメインテーマ |
| `whiteboard` | string | ホワイトボード（全エージェントの共通認識） |
| `workflow_id` | string | 使用するワークフローのID |
| `current_step` | number | 現在のステップ番号（0始まり） |
| `start_prompt_override`| string | 会議単位で開始プロンプトを上書きする場合の値 |
| `end_prompt_override` | string | 会議単位で終了プロンプトを上書きする場合の値 |
| `status` | string | 状態 (pending, in_progress, waiting, completed, error) |
| `final_conclusion` | string | 議長が作成したまとめ（結論） |
| `created_at` | timestamp | 開始日時 |
| `completed_at" | timestamp | 完了日時 |

### 6. `messages` (会議の発言履歴)
| Field | Type | Description |
|-------|------|-------------|
| `id" | string | Document ID |
| `meeting_id" | string | 会議ID |
| `agent_id` | string | エージェントID (system, facilitator, or real agent id) |
| `agent_name` | string | 表示名 |
| `agent_role` | string | 発言時のエージェントの役割 | 🆕 
| `step_number` | number | 発言時のステップ番号 | 🆕
| `content` | string | 発言内容 |
| `created_at` | timestamp | 発言日時 |

## Relationships
- `agents.style_id" → `output_styles.id"
- `meetings.workflow_id" → `meeting_workflows.id"
- `meeting_workflows.agent_ids" → `agents.id" (array)
- `messages.meeting_id" → `meetings.id"
- `messages.agent_id" → `agents.id" (or "system", "facilitator")
