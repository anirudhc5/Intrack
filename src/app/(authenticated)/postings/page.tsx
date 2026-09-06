import { createClient } from "@/lib/supabase/server";
import PostingsGrid from "@/components/PostingsGrid";
import { Posting } from "@/lib/types";

export const metadata = {
    title: "Browse Postings - Intrack",
};

export default async function PostingsPage() {
    const supabase = await createClient();
    const { data: postings, error } = await supabase
        .from("postings")
        .select("*")
        .eq("is_active", true)
        .order("first_seen_at", { ascending: false });

    if (error) {
        console.error("Error fetching postings:", error);
    }

    return (
        <div className="relative flex-1 w-full flex flex-col min-h-[500px]">
            {/* Blurred background content */}
            <div className="flex-1 w-full flex flex-col filter blur-sm pointer-events-none select-none" aria-hidden="true">
                <PostingsGrid initialPostings={(postings as Posting[]) || []} />
            </div>

            {/* Centered Coming Soon Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-[#e2e8f0]">
                    <div className="w-12 h-12 rounded-full bg-[#eff3ff] text-[#2563eb] flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-[#131b2e] mb-2">
                        Coming Soon
                    </h2>
                    <p className="text-sm text-[#434655] leading-relaxed">
                        Automated job discovery is currently in development to bring you real-time internship opportunities.
                    </p>
                </div>
            </div>
        </div>
    );
}
