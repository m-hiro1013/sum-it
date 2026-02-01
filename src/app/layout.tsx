import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "sum-it | AIエージェント会議ツール",
    description: "複数のAIエージェントによる会議シミュレーション＆意見集約ツール",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body>{children}</body>
        </html>
    );
}
