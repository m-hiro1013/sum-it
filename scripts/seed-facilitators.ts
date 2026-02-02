const adminFacilitator = require("firebase-admin");
const pathFacilitator = require("path");

// サービスアカウントのパス
const saPathFac = pathFacilitator.join(process.cwd(), "sum-it-378f8-firebase-adminsdk-fbsvc-de4b9df2ab.json");
const saJsonFac = require(saPathFac);

if (!adminFacilitator.apps.length) {
    adminFacilitator.initializeApp({
        credential: adminFacilitator.credential.cert(saJsonFac),
    });
}

const dbFac = adminFacilitator.firestore();

const facilitators = [
    {
        id: "fac-summary",
        name: "要約・意思決定型",
        description: "議論の要点を整理し、最後に「何が決まったか」を明確にします。",
        start_prompt: "あなたは会議の議長です。参加者の意見を尊重しつつ、議論が議題から逸れないようコントロールしてください。各参加者の発言の核心を突くような問いかけを適宜行ってください。",
        end_prompt: "これまでの議論を振り返り、以下の形式で結論を出してください。1. 決定事項の要約、2. 各参加者の主要な視点、3. 今後の具体的なネクストアクション。簡潔かつ明快にまとめてください。",
        is_active: true,
    },
    {
        id: "fac-brainstorm",
        name: "アイデア発散型",
        description: "批判を禁止し、とにかく斬新なアイデアをたくさん引き出すことに特化します。",
        start_prompt: "今回はブレーンストーミングです。実現可能性は一旦度外視して、とにかく突飛で独創的なアイデアを歓迎します。他の参加者の意見を否定せず、『Yes, and...』の精神でアイデアを膨らませてください。",
        end_prompt: "出されたアイデアの中から、特に『面白い』『可能性がある』と感じたものをピックアップし、夢のあるグランドデザインとしてまとめてください。具体的な実行計画よりも、ビジョンの大きさを重視したサマリーにしてください。",
        is_active: true,
    },
    {
        id: "fac-critique",
        name: "徹底検証・冷徹型",
        description: "議論の矛盾やリスクを徹底的に洗い出し、穴のない案に磨き上げます。",
        start_prompt: "この会議の目的は精査です。甘い見通しや隠れたリスクを見逃さず、徹底的に批判的な視点で議論を戦わせてください。論理的な矛盾があれば容赦なく指摘し、案の強度を高めてください。",
        end_prompt: "議論を通じて浮かび上がった『致命的なリスク』と『解決すべき課題』をリストアップしてください。現状の案が合格点に達しているか、冷徹な視点で総合評価を最後に述べてください。",
        is_active: true,
    },
];

async function seedFacilitators() {
    console.log("🚀 Starting facilitators seed to Firestore...");
    const collectionRef = dbFac.collection("facilitators");

    for (const fac of facilitators) {
        await collectionRef.doc(fac.id).set({
            ...fac,
            created_at: adminFacilitator.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Seeded Facilitator: ${fac.name}`);
    }

    console.log("\n✨ Facilitators have been successfully seeded! 💅🌈🚀");
    process.exit(0);
}

seedFacilitators().catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
});
