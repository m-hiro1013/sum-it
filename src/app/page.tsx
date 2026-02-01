import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    sum-it &nbsp;
                    <code className="font-bold">v0.1.0-alpha</code>
                </p>
            </div>

            <div className="relative flex place-items-center mt-12 mb-12">
                <h1 className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-400">
                    Summarize it!
                </h1>
            </div>

            <p className="text-xl text-center mb-12 max-w-2xl text-gray-600 dark:text-gray-300">
                自分だけのAIエージェントを複数作成して、多角的な意見が得られる会議を開催しましょう。
            </p>

            <div className="grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left gap-8">
                <Link
                    href="/agents"
                    className="group rounded-xl border border-transparent px-8 py-10 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 bg-white/50 dark:bg-zinc-900/50 shadow-xl"
                >
                    <h2 className={`mb-3 text-2xl font-semibold`}>
                        Agents{" "}
                        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                            -&gt;
                        </span>
                    </h2>
                    <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
                        エージェントの作成・管理を行います。役割やペルソナを設定できます。
                    </p>
                </Link>

                <Link
                    href="/meetings"
                    className="group rounded-xl border border-transparent px-8 py-10 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 bg-white/50 dark:bg-zinc-900/50 shadow-xl"
                >
                    <h2 className={`mb-3 text-2xl font-semibold`}>
                        Meetings{" "}
                        <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                            -&gt;
                        </span>
                    </h2>
                    <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
                        プロジェクトの議題について、複数のエージェントと会議を開始します。
                    </p>
                </Link>
            </div>
        </main>
    );
}
