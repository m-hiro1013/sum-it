"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Users, Settings, Terminal, Sparkles, LayoutGrid } from "lucide-react";

export default function Header() {
    const pathname = usePathname();

    const navItems = [
        { name: "Meetings", href: "/meetings", icon: MessageSquare },
        { name: "Agents", href: "/agents", icon: Users },
    ];

    const adminItems = [
        { name: "Output Styles", href: "/settings/styles", icon: LayoutGrid },
        { name: "Workflows", href: "/settings/workflows", icon: Terminal },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-black/80">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            <Sparkles className="text-white h-6 w-6" />
                        </div>
                        <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
                            sum-it
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === item.href
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.name}
                            </Link>
                        ))}

                        <div className="h-4 w-[1px] bg-gray-200 dark:bg-zinc-800 mx-2" />

                        {adminItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname.startsWith(item.href)
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                    : "text-gray-400 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                <item.icon size={16} />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex h-9 items-center gap-2 px-3 rounded-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 group">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">System Online</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
