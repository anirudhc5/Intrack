"use client";

import { useState, useEffect } from "react";
import {
    Application,
    ALL_CATEGORIES,
    ALL_STATUSES,
    RoleCategory,
    ApplicationStatus,
    CATEGORY_CONFIG,
    STATUS_CONFIG,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface AddApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editingApplication?: Application;
    prefillFromPosting?: {
        posting_id?: string;
        company?: string;
        title?: string;
        location?: string | null;
        salary_text?: string | null;
        url?: string | null;
        categories?: RoleCategory[];
    } | null;
}

export default function AddApplicationModal({
    isOpen,
    onClose,
    onSaved,
    editingApplication,
    prefillFromPosting,
}: AddApplicationModalProps) {
    const [loading, setLoading] = useState(false);

    const [companyName, setCompanyName] = useState("");
    const [roleTitle, setRoleTitle] = useState("");
    const [location, setLocation] = useState("");
    const [salaryText, setSalaryText] = useState("");
    const [url, setUrl] = useState("");
    const [jd_text, setJdText] = useState("");
    const [categories, setCategories] = useState<RoleCategory[]>([]);
    const [status, setStatus] = useState<ApplicationStatus>("applied");
    const [statusDetail, setStatusDetail] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (editingApplication) {
                setCompanyName(editingApplication.company || "");
                setRoleTitle(editingApplication.title || "");
                setLocation(editingApplication.location || "");
                setSalaryText(editingApplication.salary_text || "");
                setUrl(editingApplication.url || "");
                setJdText(editingApplication.jd_text || "");
                setCategories(editingApplication.categories || []);
                setStatus(editingApplication.status || "applied");
                setStatusDetail(editingApplication.status_detail || "");
                setNotes(editingApplication.notes || "");
            } else if (prefillFromPosting) {
                setCompanyName(prefillFromPosting.company || "");
                setRoleTitle(prefillFromPosting.title || "");
                setLocation(prefillFromPosting.location || "");
                setSalaryText(prefillFromPosting.salary_text || "");
                setUrl(prefillFromPosting.url || "");
                setJdText("");
                setCategories(prefillFromPosting.categories || []);
                setStatus("applied");
                setStatusDetail("");
                setNotes("");
            } else {
                setCompanyName("");
                setRoleTitle("");
                setLocation("");
                setSalaryText("");
                setUrl("");
                setJdText("");
                setCategories([]);
                setStatus("applied");
                setStatusDetail("");
                setNotes("");
            }
        }
    }, [isOpen, editingApplication]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const toggleCategory = (cat: RoleCategory) => {
        if (categories.includes(cat)) {
            setCategories(categories.filter((c) => c !== cat));
        } else {
            setCategories([...categories, cat]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const supabase = createClient();

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        if (!userId) {
            setLoading(false);
            return;
        }

        const basePayload = {
            user_id: userId,
            posting_id:
                editingApplication?.posting_id ||
                prefillFromPosting?.posting_id ||
                null,
            company: companyName,
            title: roleTitle,
            location: location || null,
            salary_text: salaryText || null,
            url: url || null,
            jd_text: jd_text || null,
            status,
            status_detail: statusDetail || null,
            categories,
            notes: notes || null,
        };

        if (editingApplication) {
            const statusChanged = editingApplication.status !== status;
            const newHistory = statusChanged
                ? [
                      ...(editingApplication.status_history ?? []),
                      {
                          status,
                          status_detail: statusDetail || null,
                          changed_at: new Date().toISOString(),
                      },
                  ]
                : editingApplication.status_history;

            const { error } = await supabase
                .from("applications")
                .update({ ...basePayload, status_history: newHistory })
                .eq("id", editingApplication.id);

            if (error) console.error("Failed to update application:", error);
        } else {
            const initialHistory = [
                {
                    status,
                    status_detail: statusDetail || null,
                    changed_at: new Date().toISOString(),
                },
            ];

            const { error } = await supabase
                .from("applications")
                .insert({ ...basePayload, status_history: initialHistory });

            if (error) console.error("Failed to create application:", error);
        }

        setLoading(false);
        onSaved();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-xl font-semibold text-[#131b2e]">
                        {editingApplication
                            ? "Edit Application"
                            : "Add Application"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Company *
                            </label>
                            <input
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                                placeholder="Acme Corp"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Role Title *
                            </label>
                            <input
                                value={roleTitle}
                                onChange={(e) => setRoleTitle(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                                placeholder="Software Engineer"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Location
                            </label>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                                placeholder="San Francisco, CA"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Salary / Rate
                            </label>
                            <input
                                value={salaryText}
                                onChange={(e) => setSalaryText(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                                placeholder="$120,000"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Posting URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Job Description
                        </label>
                        <textarea
                            value={jd_text}
                            onChange={(e) => setJdText(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 min-h-[100px] text-sm"
                            placeholder="Paste the job description here..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {ALL_CATEGORIES.map((cat) => {
                                const isSelected = categories.includes(cat);
                                const config =
                                    CATEGORY_CONFIG[cat] ||
                                    CATEGORY_CONFIG["Other"];
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                            isSelected
                                                ? `${config.bgColor} ${config.color} ${config.borderColor}`
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) =>
                                    setStatus(
                                        e.target.value as ApplicationStatus,
                                    )
                                }
                                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                            >
                                {ALL_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {STATUS_CONFIG[s]?.label || s}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Status Detail
                            </label>
                            <input
                                value={statusDetail}
                                onChange={(e) =>
                                    setStatusDetail(e.target.value)
                                }
                                className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm"
                                placeholder="e.g. Round 2 System Design"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 min-h-[100px] text-sm"
                            placeholder="Any additional notes..."
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!companyName || !roleTitle || loading}
                        className="px-4 py-2 text-sm bg-[#2563eb] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Saving..." : "Save Application"}
                    </button>
                </div>
            </div>
        </div>
    );
}
