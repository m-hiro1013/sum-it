const adminWorkflow = require("firebase-admin");
const pathWorkflow = require("path");

// サービスアカウントのパス
const saPathWork = pathWorkflow.join(process.cwd(), "sum-it-378f8-firebase-adminsdk-fbsvc-de4b9df2ab.json");
const saJsonWork = require(saPathWork);

if (!adminWorkflow.apps.length) {
    adminWorkflow.initializeApp({
        credential: adminWorkflow.credential.cert(saJsonWork),
    });
}

const dbWork = adminWorkflow.firestore();

const testWorkflows = [
    {
        name: "シンプル・ブレインストーミング",
        description: "2人のエージェントが順番に意見を出し、サマリーを作成します。",
        agent_ids: ["AGENT_1", "AGENT_2"],
        steps: [
            { type: "speak", agent_id: "AGENT_1" },
            { type: "speak", agent_id: "AGENT_2" },
            { type: "summary" }
        ],
        start_prompt: "あなたは会議の議長です。参加者の意見を尊重しつつ、議論が議題から逸れないようコントロールしてください。各参加者の発言の核心を突くような問いかけを適宜行ってください。",
        end_prompt: "これまでの議論を振り返り、以下の形式で結論を出してください。1. 決定事項の要約、2. 各参加者の主要な視点、3. 今後の具体的なネクストアクション。簡潔かつ明快にまとめてください。",
        is_active: true,
    },
    {
        name: "徹底議論・並列モード",
        description: "3人が同時に発言し、その後ユーザーが介入して方向性を決める高度なフロー。",
        agent_ids: ["AGENT_1", "AGENT_2", "AGENT_3"],
        steps: [
            { type: "parallel_speak", agent_ids: ["AGENT_1", "AGENT_2", "AGENT_3"] },
            { type: "user_intervention", label: "議論の方向性を確認・修正してください💅✨" },
            { type: "speak", agent_id: "AGENT_1" },
            { type: "summary" }
        ],
        start_prompt: "この会議の目的は精査です。甘い見通しや隠れたリスクを見逃さず、徹底的に批判的な視点で議論を戦わせてください。論理的な矛盾があれば容赦なく指摘し、案の強度を高めてください。",
        end_prompt: "議論を通じて浮かび上がった『致命的なリスク』と『解決すべき課題』をリストアップしてください。現状の案が合格点に達しているか、冷徹な視点で総合評価を最後に述べてください。",
        is_active: true,
    }
];

async function seedWorkflows() {
    console.log("🚀 Starting workflows seed to Firestore...");
    const collectionRef = dbWork.collection("meeting_workflows");

    for (const workflow of testWorkflows) {
        // IDを指定せずに追加（自動生成）
        const docRef = await collectionRef.add({
            ...workflow,
            created_at: adminWorkflow.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Seeded Workflow: ${workflow.name} (ID: ${docRef.id})`);
    }

    console.log("\n✨ Meeting Workflows have been successfully seeded! 💅🌈🚀");
    process.exit(0);
}

seedWorkflows().catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
});
