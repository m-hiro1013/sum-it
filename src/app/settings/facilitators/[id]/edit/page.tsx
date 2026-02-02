"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import FacilitatorForm from "@/components/FacilitatorForm";
import { getFacilitators, updateFacilitator } from "@/lib/firestore";
import { Facilitator, FacilitatorInput } from "@/types/facilitator";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditFacilitatorPage() {
    const router = useRouter();
    const { id } = useParams();
    const [facilitator, setFacilitator] = useState<Facilitator | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        const fetchFacilitator = async () => {
            try {
                const data = await getFacilitators(false);
                const found = data.find((f) => f.id === id);
                if (found) {
                    setFacilitator(found);
                } else {
                    router.push("/settings/facilitators");
                }
            } catch (error) {
                console.error("Failed to fetch facilitator", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchFacilitator();
    }, [id, router]);

    const handleSubmit = async (data: FacilitatorInput) => {
        setIsLoading(true);
        try {
            if (typeof id === "string") {
                await updateFacilitator(id, data);
                router.push("/settings/facilitators");
            }
        } catch (error) {
            console.error("Failed to update facilitator", error);
            alert("更新に失敗しました😭");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <Header />
            <main className="container mx-auto py-12 px-4 sm:px-8 max-w-2xl">
                <div className="mb-10 flex items-center gap-4">
                    <Link
                        href="/settings/facilitators"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    >
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">議長の編集</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">進行ロジックを微調整します。</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-neutral-800">
                    <FacilitatorForm
                        initialData={facilitator || undefined}
                        onSubmit={handleSubmit}
                        onCancel={() => router.push("/settings/facilitators")}
                        isLoading={isLoading}
                    />
                </div>
            </main>
        </div>
    );
}
