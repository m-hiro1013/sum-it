const adminSeeder = require("firebase-admin");
const pathSeeder = require("path");

// サービスアカウントのパス (一意な変数名に変更して衝突回避)
const saPath = pathSeeder.join(process.cwd(), "sum-it-378f8-firebase-adminsdk-fbsvc-de4b9df2ab.json");
const saJson = require(saPath);

if (!adminSeeder.apps.length) {
    adminSeeder.initializeApp({
        credential: adminSeeder.credential.cert(saJson),
    });
}

const dbSeeder = adminSeeder.firestore();

const latestModels = [
    // --- OpenAI ---
    { id: "openai-gpt-5-2-pro", provider: "openai", model_id: "gpt-5.2-pro", name: "GPT-5.2 Pro", tier: "expensive", description: "究極。OpenAI最高峰のプロフェッショナルモデル。", is_active: true },
    { id: "openai-gpt-5-2", provider: "openai", model_id: "gpt-5.2", name: "GPT-5.2 Reg", tier: "latest", description: "最新フラッグシップ。推論と創造の融合。", is_active: true },
    { id: "openai-gpt-5-mini", provider: "openai", model_id: "gpt-5-mini", name: "GPT-5 mini", tier: "cheap", description: "安価爆速。次世代標準の軽量モデル。", is_active: true },
    // --- Anthropic ---
    { id: "anthropic-c4-5-opus", provider: "anthropic", model_id: "claude-4.5-opus", name: "Claude 4.5 Opus", tier: "expensive", description: "帝王。最も深く賢い最高峰モデル。", is_active: true },
    { id: "anthropic-c4-5-sonnet", provider: "anthropic", model_id: "claude-4.5-sonnet", name: "Claude 4.5 Sonnet", tier: "latest", description: "次世代標準。スピードと賢さの究極バランス。", is_active: true },
    { id: "anthropic-c4-5-haiku", provider: "anthropic", model_id: "claude-4.5-haiku", name: "Claude 4.5 Haiku", tier: "cheap", description: "爆速。一瞬でレスポンスを返す軽量モデル。", is_active: true },
    // --- Google ---
    { id: "google-gemini-3-pro", provider: "google", model_id: "gemini-3-pro", name: "Gemini 3 Pro", tier: "latest", description: "Google最新最強。マルチモーダル推論の鬼。", is_active: true },
    { id: "google-gemini-3-flash", provider: "google", model_id: "gemini-3-flash", name: "Gemini 3 Flash", tier: "recommended", description: "コスパ神。Googleのスピードお化け。", is_active: true },
    { id: "google-gemini-2-5-pro", provider: "google", model_id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tier: "recommended", description: "長文脈処理のスペシャリスト。", is_active: true },
];

async function runSeed() {
    console.log("🚀 Seeding latest models...");
    const colRef = dbSeeder.collection("llm_models");
    for (const m of latestModels) {
        await colRef.doc(m.id).set(m);
        console.log(`✅ ${m.name}`);
    }
    console.log("\n✨ Done! 💅🌈");
    process.exit(0);
}

runSeed().catch(e => { console.error(e); process.exit(1); });
