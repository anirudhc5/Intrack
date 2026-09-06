"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    Globe,
    BarChart3,
    Settings,
    Search,
    LogOut,
    User,
} from "lucide-react";

export default function Sidebar({ user }: { user: any }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const navLinks = [
        { name: "Tracker", href: "/tracker", icon: LayoutDashboard },
        { name: "Browse Postings", href: "/postings", icon: Globe },
        { name: "Pipeline Overview", href: "/pipeline", icon: BarChart3 },
        { name: "Preferences", href: "/preferences", icon: Settings },
    ];

    return (
        <aside className="fixed left-0 top-0 w-64 h-full bg-white border-r border-[#c3c6d7]/30 flex flex-col">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <Image
                        src="/logo.svg"
                        alt="Intrack Logo"
                        width={32}
                        height={32}
                    />
                    <div>
                        <h1 className="text-xl font-semibold text-[#131b2e]">
                            Intrack
                        </h1>
                        <p className="text-xs text-[#434655]">Candidate OS</p>
                    </div>
                </div>

                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737686]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-12 py-2 bg-[#f2f3ff] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#737686] font-medium bg-white px-1.5 py-0.5 rounded border border-[#c3c6d7]">
                        ⌘K
                    </kbd>
                </div>

                <div className="mb-4">
                    <p className="text-xs font-semibold text-[#737686] mb-3 px-3 uppercase tracking-wider">
                        Pipelines
                    </p>
                    <nav className="flex flex-col gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-[#2563eb] text-white"
                                            : "text-[#434655] hover:bg-[#f2f3ff]"
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-[#c3c6d7]/30">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-[#eaedff] flex items-center justify-center text-[#2563eb] font-semibold text-sm">
                        {user?.email?.charAt(0).toUpperCase() || (
                            <User className="w-4 h-4" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#131b2e] truncate">
                            {user?.user_metadata?.name}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-[#ba1a1a] hover:bg-[#f2f3ff] rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
