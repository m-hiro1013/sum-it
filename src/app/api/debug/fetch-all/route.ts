import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * 🆕 DBの全データを取得して返すデバッグ用API
 */
export async function GET() {
    try {
        const collections = [
            "agents",
            "llm_models",
            "output_styles",
            "meeting_workflows",
            "meetings"
        ];

        const dbSnapshot: any = {};

        for (const colName of collections) {
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);
            dbSnapshot[colName] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: dbSnapshot
        });

    } catch (error: any) {
        console.error("Fetch DB Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
