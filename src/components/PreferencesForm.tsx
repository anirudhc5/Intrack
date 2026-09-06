"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
    type UserPreferences,
    type RoleCategory,
    ALL_CATEGORIES,
    CATEGORY_CONFIG,
    parseSalaryNumeric,
} from "@/lib/types";
import {
    Save,
    Minus,
    Plus,
    Bell,
    BellOff,
    DollarSign,
    Target,
    Check,
    User,
    Mail,
    Trash2,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface PreferencesFormProps {
    preferences: UserPreferences | null;
    postings: { salary_text: string | null }[];
    userId: string;
    user?: SupabaseUser | null;
    notificationEmails?: string[];
}

export default function PreferencesForm({
    preferences,
    postings,
    userId,
    user,
    notificationEmails: initialNotificationEmails,
}: PreferencesFormProps) {
    const router = useRouter();
    const supabase = createClient();

    // Profile Information state
    const [fullName, setFullName] = useState(user?.user_metadata?.name || "");
    const [notificationEmails, setNotificationEmails] = useState<string[]>(
        initialNotificationEmails ?? preferences?.notification_emails ?? [],
    );
    const [newEmailInput, setNewEmailInput] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);

    const [categories, setCategories] = useState<RoleCategory[]>(
        (preferences?.categories as RoleCategory[]) || [],
    );
    const [weeklyGoal, setWeeklyGoal] = useState(preferences?.weekly_goal ?? 6);
    const [notifyEmail, setNotifyEmail] = useState(
        preferences?.notify_email ?? true,
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
        "idle",
    );

    const toggleCategory = (cat: RoleCategory) => {
        setCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
        );
    };

    const handleAddEmail = () => {
        const trimmed = newEmailInput.trim();
        if (!trimmed) return;

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            setEmailError("Please enter a valid email address.");
            return;
        }

        if (
            trimmed.toLowerCase() === (user?.email || "").toLowerCase() ||
            notificationEmails
                .map((e) => e.toLowerCase())
                .includes(trimmed.toLowerCase())
        ) {
            setEmailError("This email is already added.");
            return;
        }

        setNotificationEmails([...notificationEmails, trimmed]);
        setNewEmailInput("");
        setEmailError(null);
    };

    const handleRemoveEmail = (indexToRemove: number) => {
        setNotificationEmails(
            notificationEmails.filter((_, idx) => idx !== indexToRemove),
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus("idle");

        const [userUpdateRes, prefUpdateRes] = await Promise.all([
            supabase.auth.updateUser({
                data: {
                    name: fullName,
                },
            }),
            supabase.from("user_preferences").upsert(
                {
                    user_id: userId,
                    categories,
                    notify_email: notifyEmail,
                    weekly_goal: weeklyGoal,
                    notification_emails: notificationEmails,
                },
                { onConflict: "user_id" },
            ),
        ]);

        setIsSaving(false);
        if (userUpdateRes.error || prefUpdateRes.error) {
            setSaveStatus("error");
            console.error(
                "Save error:",
                userUpdateRes.error || prefUpdateRes.error,
            );
        } else {
            setSaveStatus("success");
            router.refresh();
            setTimeout(() => setSaveStatus("idle"), 3000);
        }
    };

    // Build salary histogram data
    const salaryValues = postings
        .map((p) => parseSalaryNumeric(p.salary_text))
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b);

    const salaryBuckets = buildSalaryBuckets(salaryValues);

    return (
        <div className="space-y-6">
            {/* Save Status Banner */}
            {saveStatus === "success" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
                    <Check className="w-4 h-4" />
                    Preferences saved successfully.
                </div>
            )}
            {saveStatus === "error" && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                    Failed to save preferences. Please try again.
                </div>
            )}

            {/* Profile Information */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
                <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-[#2563eb]" />
                    <h2 className="text-[15px] font-semibold text-[#131b2e]">
                        Profile Information
                    </h2>
                </div>
                <p className="text-[12px] text-[#434655] mb-5">
                    Update your personal details and manage notification email
                    addresses.
                </p>

                {/* Identity Row */}
                <div className="space-y-4 mb-6">
                    <div className="space-y-1.5 max-w-md">
                        <label className="text-sm font-medium text-slate-700">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm text-[#131b2e] outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Email Management Sub-section */}
                <div className="pt-5 border-t border-[#f2f3ff] space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 block">
                            Email Addresses
                        </label>
                        <p className="text-[12px] text-[#434655] mt-0.5">
                            Configure the email addresses where you want to
                            receive alerts and notifications.
                        </p>
                    </div>

                    <div className="space-y-2.5 max-w-lg">
                        {/* Primary Email */}
                        {user?.email && (
                            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] ">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Mail className="w-4 h-4 text-[#737686] shrink-0" />
                                    <span className="text-sm text-[#131b2e] font-medium truncate">
                                        {user.email}
                                    </span>
                                </div>
                                <span className="shrink-0 px-2 py-0.5 bg-[#dbe1ff] text-[#003ea8] text-[11px] font-medium rounded-full">
                                    Primary
                                </span>
                            </div>
                        )}

                        {/* Notification Email List */}
                        {notificationEmails.map((email, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white border border-[#e2e8f0] group hover:border-[#c3c6d7] transition-colors"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Mail className="w-4 h-4 text-[#737686] shrink-0" />
                                    <span className="text-sm text-[#131b2e] truncate">
                                        {email}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveEmail(idx)}
                                    className="p-1 text-[#737686] hover:text-[#ba1a1a] hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="Remove email"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {/* Add New Email Row */}
                        <div className="pt-1">
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={newEmailInput}
                                    onChange={(e) => {
                                        setNewEmailInput(e.target.value);
                                        if (emailError) setEmailError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddEmail();
                                        }
                                    }}
                                    placeholder="alternate.email@example.com"
                                    className="flex-1 h-9 px-3 rounded-lg bg-white border border-[#c3c6d7] focus:ring-2 focus:ring-blue-500/20 text-sm text-[#131b2e] outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddEmail}
                                    className="flex items-center gap-1.5 px-3.5 h-9 text-xs font-medium text-[#2563eb] bg-[#eff3ff] hover:bg-[#dbe4ff] rounded-lg transition-colors shrink-0 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Email
                                </button>
                            </div>
                            {emailError && (
                                <p className="text-xs text-red-600 mt-1.5">
                                    {emailError}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Role Category Preferences */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
                <h2 className="text-[15px] font-semibold text-[#131b2e] mb-1">
                    Preferred Role Categories
                </h2>
                <p className="text-[12px] text-[#434655] mb-4">
                    Select the types of roles you&apos;re interested in
                </p>
                <div className="flex flex-wrap gap-2">
                    {ALL_CATEGORIES.map((cat) => {
                        const isActive = categories.includes(cat);
                        const config = CATEGORY_CONFIG[cat];
                        return (
                            <button
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors cursor-pointer ${
                                    isActive
                                        ? `${config.bgColor} ${config.color} ${config.borderColor}`
                                        : "bg-white text-[#434655] border-[#c3c6d7] hover:bg-[#f2f3ff]"
                                }`}
                            >
                                {config?.label || cat}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Weekly Application Goal */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
                <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-[#2563eb]" />
                    <h2 className="text-[15px] font-semibold text-[#131b2e]">
                        Weekly Application Goal
                    </h2>
                </div>
                <p className="text-[12px] text-[#434655] mb-4">
                    Set your target for applications per week. This appears as
                    the target line in Pipeline Overview.
                </p>
                <div className="flex items-center gap-4">
                    <div className="inline-flex items-stretch border border-[#c3c6d7] rounded-lg overflow-hidden h-10">
                        <button
                            type="button"
                            onClick={() =>
                                setWeeklyGoal(Math.max(1, weeklyGoal - 1))
                            }
                            className="w-10 h-full flex items-center justify-center text-[#434655] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 flex items-center justify-center text-[15px] font-semibold text-[#131b2e] min-w-[3rem] text-center border-x border-[#c3c6d7] select-none">
                            {weeklyGoal}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                setWeeklyGoal(Math.min(50, weeklyGoal + 1))
                            }
                            className="w-10 h-full flex items-center justify-center text-[#434655] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <span className="text-[13px] text-[#434655]">
                        applications per week
                    </span>
                </div>
            </section>

            {/* Notification Settings */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
                <div className="flex items-center gap-2 mb-1">
                    {notifyEmail ? (
                        <Bell className="w-4 h-4 text-[#2563eb]" />
                    ) : (
                        <BellOff className="w-4 h-4 text-[#737686]" />
                    )}
                    <h2 className="text-[15px] font-semibold text-[#131b2e]">
                        Email Notifications
                    </h2>
                </div>
                <p className="text-[12px] text-[#434655] mb-4">
                    Get notified about status changes and deadlines
                </p>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setNotifyEmail(!notifyEmail)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            notifyEmail ? "bg-[#2563eb]" : "bg-[#c3c6d7]"
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                                notifyEmail ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                    </button>
                    <span className="text-[13px] text-[#131b2e]">
                        {notifyEmail
                            ? "Notifications enabled"
                            : "Notifications disabled"}
                    </span>
                </div>
            </section>

            {/* Salary Distribution */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
                <h2 className="text-[15px] font-semibold text-[#131b2e] mb-1">
                    Market Salary Distribution
                </h2>
                <p className="text-[12px] text-[#434655] mb-4">
                    Based on {salaryValues.length} postings with salary data
                    (regex-parsed, no AI)
                </p>
                {salaryValues.length === 0 ? (
                    <div className="text-center py-8 text-[#737686]">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-[13px]">
                            No salary data available yet
                        </p>
                        <p className="text-[11px]">
                            Salary distribution will appear once postings with
                            compensation data are ingested.
                        </p>
                    </div>
                ) : (
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={salaryBuckets}
                                margin={{
                                    top: 5,
                                    right: 5,
                                    left: 5,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#eaedff"
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: "#434655" }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#c3c6d7" }}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: "#434655" }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#c3c6d7" }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        fontSize: 12,
                                        borderRadius: 8,
                                        border: "1px solid #e2e8f0",
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#2563eb"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            {/* Save Button */}
            <div className="flex justify-start pt-2 pb-8">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-[#2563eb] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#1d4ed8] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Preferences
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// Utility: Build salary histogram buckets
function buildSalaryBuckets(
    values: number[],
): { label: string; count: number; min: number; max: number }[] {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const bucketCount = Math.min(6, Math.max(3, Math.ceil(values.length / 3)));
    const bucketSize = range / bucketCount || 1;

    const buckets: {
        label: string;
        count: number;
        min: number;
        max: number;
    }[] = [];
    for (let i = 0; i < bucketCount; i++) {
        const bucketMin = min + i * bucketSize;
        const bucketMax =
            i === bucketCount - 1 ? max + 1 : min + (i + 1) * bucketSize;
        const count = values.filter(
            (v) => v >= bucketMin && v < bucketMax,
        ).length;
        buckets.push({
            label: `$${formatSalaryK(bucketMin)}–${formatSalaryK(bucketMax)}`,
            count,
            min: bucketMin,
            max: bucketMax,
        });
    }
    return buckets;
}

function formatSalaryK(value: number): string {
    if (value >= 1000) {
        return `${Math.round(value / 1000)}k`;
    }
    return `${Math.round(value)}`;
}
