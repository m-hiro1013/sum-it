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
        description: "2人のエージェントが順番に意見を出し、議長がまとめます。",
        facilitator_id: "fac-summary", // 既存の要約型議長
        agent_ids: ["AGENT_1", "AGENT_2"], // 実際には会議作成時に上書きされる想定
        steps: [
            { type: "speak", agent_id: "AGENT_1" },
            { type: "speak", agent_id: "AGENT_2" },
            { type: "summary" }
        ],
        is_active: true,
    },
    {
        name: "徹底議論・並列モード",
        description: "3人が同時に発言し、その後ユーザーが介入して方向性を決める高度なフロー。",
        facilitator_id: "fac-critique", // 既存の検証型議長
        agent_ids: ["AGENT_1", "AGENT_2", "AGENT_3"],
        steps: [
            { type: "parallel_speak", agent_ids: ["AGENT_1", "AGENT_2", "AGENT_3"] },
            { type: "user_intervention", label: "議論の方向性を確認・修正してください💅✨" },
            { type: "speak", agent_id: "AGENT_1" },
            { type: "summary" }
        ],
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
