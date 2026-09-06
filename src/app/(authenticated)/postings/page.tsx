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
        <div className="flex-1 w-full flex flex-col p-8">
            <PostingsGrid initialPostings={(postings as Posting[]) || []} />
        </div>
    );
}
