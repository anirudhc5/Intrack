"use client";

import React, {
    useMemo,
    useRef,
    useEffect,
    useState,
    useCallback,
} from "react";
import { sankeyCircular, sankeyLeft } from "d3-sankey-circular";
import type { SankeyGraph, SankeyNode, SankeyLink } from "d3-sankey-circular";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
    Application,
    StatusHistoryEntry,
    UserPreferences,
    STATUS_CONFIG,
    CATEGORY_CONFIG,
    RoleCategory,
    ApplicationStatus,
} from "@/lib/types";

interface PipelineChartsProps {
    applications: Application[];
    statusHistory: StatusHistoryEntry[];
    userPreferences: UserPreferences | null;
}

export function PipelineCharts({
    applications,
    statusHistory,
    userPreferences,
}: PipelineChartsProps) {
    const weeklyGoal = userPreferences?.weekly_goal ?? 6;

    // Check empty state
    if (applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-8">
                <BarChart3 className="w-12 h-12 text-[#c3c6d7] mb-4" />
                <h2 className="text-[18px] font-semibold text-[#131b2e] mb-2">
                    No applications yet
                </h2>
                <p className="text-[#434655] text-center max-w-sm">
                    Add your first application to see pipeline analytics.
                </p>
            </div>
        );
    }

    // --- Summary Stats ---
    const totalApps = applications.length;

    const respondedApps = applications.filter(
        (app) => !["saved", "applied", "withdrawn"].includes(app.status),
    );
    const responseRate =
        totalApps > 0 ? (respondedApps.length / totalApps) * 100 : 0;

    const offerApps = applications.filter((app) =>
        ["offer", "accepted"].includes(app.status),
    );
    const offerRate = totalApps > 0 ? (offerApps.length / totalApps) * 100 : 0;

    const activePipelineApps = applications.filter((app) =>
        ["oa", "interview_1", "interview_2", "interview_3+"].includes(
            app.status,
        ),
    );

    // Response rate comparison
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Apps applied this month
    const appsThisMonth = applications.filter((app) => {
        if (!app.applied_at) return false;
        const appliedDate = new Date(app.applied_at);
        return appliedDate >= thisMonthStart;
    });

    // Apps applied last month
    const appsLastMonth = applications.filter((app) => {
        if (!app.applied_at) return false;
        const appliedDate = new Date(app.applied_at);
        return appliedDate >= lastMonthStart && appliedDate < thisMonthStart;
    });

    const responsesThisMonth = appsThisMonth.filter(
        (app) => !["saved", "applied", "withdrawn"].includes(app.status),
    );
    const responsesLastMonth = appsLastMonth.filter(
        (app) => !["saved", "applied", "withdrawn"].includes(app.status),
    );

    const rrThisMonth =
        appsThisMonth.length > 0
            ? (responsesThisMonth.length / appsThisMonth.length) * 100
            : 0;
    const rrLastMonth =
        appsLastMonth.length > 0
            ? (responsesLastMonth.length / appsLastMonth.length) * 100
            : 0;
    const rrDiff = rrThisMonth - rrLastMonth;

    // --- Sankey Diagram Data ---
    // Need actual hex colors for SVG rendering
    const STATUS_COLORS: Record<ApplicationStatus, string> = {
        saved: "#64748b",
        applied: "#64748b",
        oa: "#7c3aed",
        interview_1: "#2563eb",
        interview_2: "#2563eb",
        "interview_3+": "#2563eb",
        offer: "#059669",
        accepted: "#059669",
        rejected: "#e11d48",
        withdrawn: "#94a3b8",
    };

    const sankeyGraphData = useMemo(() => {
        // Build edges from every consecutive pair in each application's status_history
        const edgeCounts = new Map<string, number>();
        const nodeSet = new Set<string>();

        applications.forEach((app) => {
            const history = app.status_history;
            if (!history || history.length === 0) return;

            // Add each distinct status as a node
            history.forEach((entry) => nodeSet.add(entry.status));

            // Create edges from consecutive pairs (ignore self-loops)
            for (let i = 0; i < history.length - 1; i++) {
                const src = history[i].status;
                const tgt = history[i + 1].status;
                if (src === tgt) continue;
                const key = `${src}→${tgt}`;
                edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
            }
        });

        // If no statuses at all, empty graph
        if (nodeSet.size === 0) {
            return { nodes: [], links: [], hasTransitions: false };
        }

        // Build node and link arrays for d3-sankey-circular
        const nodeNames = Array.from(nodeSet);
        const nodeIndexMap = new Map<string, number>();
        nodeNames.forEach((name, i) => nodeIndexMap.set(name, i));

        const nodes = nodeNames.map((name) => ({ name }));
        const links: { source: string; target: string; value: number }[] = [];

        edgeCounts.forEach((value, key) => {
            const [src, tgt] = key.split("→");
            links.push({ source: src, target: tgt, value });
        });

        return {
            nodes,
            links,
            hasTransitions: links.length > 0,
        };
    }, [applications]);

    const CATEGORY_COLORS: Record<RoleCategory, string> = {
        SWE: "#1d4ed8", // blue-700
        MLE_AI: "#6b21a8", // purple-800
        Data_Science: "#0f766e", // teal-700
        PM: "#c2410c", // orange-700
        Quant: "#047857", // emerald-700
        Hardware: "#b91c1c", // red-700
        Design: "#be185d", // pink-700
        Other: "#334155", // slate-700
    };

    // --- Velocity Over Time ---
    // --- Velocity Over Time ---
    const velocityData = useMemo(() => {
        const data = [];
        const now = new Date();

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        for (let i = 7; i >= 0; i--) {
            // End boundary of this 7-day bucket
            const windowEnd = new Date(now);
            windowEnd.setDate(now.getDate() - i * 7);
            windowEnd.setHours(23, 59, 59, 999);

            // Start boundary of this 7-day bucket
            const windowStart = new Date(windowEnd);
            windowStart.setDate(windowEnd.getDate() - 7);
            windowStart.setHours(0, 0, 0, 0);

            // Label reflects the end date so the latest tick lands on Today
            const isCurrentWeek = i === 0;
            const weekLabel = isCurrentWeek
                ? "Today"
                : `${monthNames[windowEnd.getMonth()]} ${windowEnd.getDate()}`;

            const count = applications.filter((app) => {
                // 1. Fall back to status_history or created_at if applied_at is missing
                const dateStr =
                    app.applied_at ||
                    app.status_history?.find((h) => h.status === "applied")
                        ?.changed_at ||
                    (app as any).created_at;

                if (!dateStr) return false;

                // 2. Parse date safely regardless of format (YYYY-MM-DD vs ISO timestamp)
                let appliedDate: Date;
                if (
                    typeof dateStr === "string" &&
                    /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
                ) {
                    const [y, m, d] = dateStr.split("-").map(Number);
                    appliedDate = new Date(y, m - 1, d, 12, 0, 0); // Noon local time to avoid boundary issues
                } else {
                    appliedDate = new Date(dateStr);
                }

                return appliedDate >= windowStart && appliedDate <= windowEnd;
            }).length;

            data.push({
                week: weekLabel,
                actual: count,
                target: weeklyGoal,
            });
        }
        return data;
    }, [applications, weeklyGoal]);

    // --- Category Distribution ---
    const categoryData = useMemo(() => {
        const counts: Partial<Record<RoleCategory, number>> = {};
        applications.forEach((app) => {
            app.categories?.forEach((cat) => {
                counts[cat] = (counts[cat] || 0) + 1;
            });
        });

        return Object.entries(counts)
            .map(([cat, value]) => ({
                category: cat as RoleCategory,
                name: CATEGORY_CONFIG[cat as RoleCategory]?.label || cat,
                value: value || 0,
            }))
            .sort((a, b) => b.value - a.value);
    }, [applications]);

    return (
        <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
                    <div className="text-[12px] font-medium text-[#434655] mb-1">
                        Total Applications
                    </div>
                    <div className="text-[24px] font-semibold text-[#131b2e]">
                        {totalApps}
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
                    <div className="text-[12px] font-medium text-[#434655] mb-1 flex items-center justify-between">
                        Response Rate
                        {rrDiff !== 0 && (
                            <span
                                className={`flex items-center text-[10px] px-1.5 py-0.5 rounded ${rrDiff > 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}
                            >
                                {rrDiff > 0 ? (
                                    <TrendingUp className="w-3 h-3 mr-0.5" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 mr-0.5" />
                                )}
                                {Math.abs(rrDiff).toFixed(1)}% vs last mo
                            </span>
                        )}
                    </div>
                    <div className="text-[24px] font-semibold text-[#131b2e]">
                        {responseRate.toFixed(1)}%
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
                    <div className="text-[12px] font-medium text-[#434655] mb-1">
                        Offer Rate
                    </div>
                    <div className="text-[24px] font-semibold text-[#131b2e]">
                        {offerRate.toFixed(1)}%
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
                    <div className="text-[12px] font-medium text-[#434655] mb-1">
                        Active Pipeline
                    </div>
                    <div className="text-[24px] font-semibold text-[#131b2e]">
                        {activePipelineApps.length}
                    </div>
                </div>
            </div>

            {/* Funnel Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
                <h3 className="text-[16px] font-medium text-[#131b2e] mb-6">
                    Sankey Diagram
                </h3>
                <SankeyDiagram
                    graphData={sankeyGraphData}
                    statusColors={STATUS_COLORS}
                    applications={applications}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Velocity Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
                    <h3 className="text-[16px] font-medium text-[#131b2e] mb-6">
                        Activity Over Time
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={velocityData}
                                margin={{
                                    top: 5,
                                    right: 20,
                                    left: 0,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f2f3ff"
                                />
                                <XAxis
                                    dataKey="week"
                                    tick={{ fill: "#434655", fontSize: 12 }}
                                />
                                <YAxis
                                    tick={{ fill: "#434655", fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "12px",
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{
                                        fontSize: "12px",
                                        color: "#434655",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    name="Applications"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="step"
                                    dataKey="target"
                                    name="Weekly Goal"
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e2e8f0]">
                    <h3 className="text-[16px] font-medium text-[#131b2e] mb-6">
                        Category Distribution
                    </h3>
                    <div className="h-[250px]">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    CATEGORY_COLORS[
                                                        entry.category
                                                    ] || "#334155"
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: "12px" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[#434655] text-[12px]">
                                No categories found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Sankey Diagram Sub-component ---

interface SankeyDiagramProps {
    graphData: {
        nodes: { name: string }[];
        links: {
            source: string | number;
            target: string | number;
            value: number;
        }[];
        hasTransitions: boolean;
    };
    statusColors: Record<ApplicationStatus, string>;
    applications: Application[];
}

function SankeyDiagram({
    graphData,
    statusColors,
    applications,
}: SankeyDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [hoveredLink, setHoveredLink] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        source: string;
        target: string;
        value: number;
    } | null>(null);

    const chartHeight = 350;

    // Measure the container width
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                setDimensions({ width, height: chartHeight });
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Compute Sankey layout
    const sankeyResult = useMemo((): SankeyGraph | null => {
        if (graphData.nodes.length === 0 || dimensions.width === 0) {
            return null;
        }

        // If there are no transitions (single node, no links),
        // we can't run the layout — handle this in rendering
        if (!graphData.hasTransitions) {
            return null;
        }

        try {
            const layout = sankeyCircular()
                .nodeId((d: { name: string }) => d.name)
                .nodeAlign(sankeyLeft)
                .nodeWidth(14)
                .nodePadding(18)
                .circularLinkGap(4)
                .size([dimensions.width, chartHeight - 40]);

            // Deep clone so the layout doesn't mutate our memoized input
            const inputData = {
                nodes: graphData.nodes.map((n) => ({ ...n })),
                links: graphData.links.map((l) => ({ ...l })),
            };

            const result = layout(inputData);
            return result;
        } catch (err) {
            console.error("Sankey layout error:", err);
            return null;
        }
    }, [graphData, dimensions]);

    const handleLinkMouseEnter = useCallback(
        (e: React.MouseEvent, link: SankeyLink, idx: number) => {
            setHoveredLink(idx);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                setTooltip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    source: link.source.name,
                    target: link.target.name,
                    value: link.value,
                });
            }
        },
        [],
    );

    const handleLinkMouseMove = useCallback(
        (e: React.MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect && tooltip) {
                setTooltip((prev) =>
                    prev
                        ? {
                              ...prev,
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                          }
                        : null,
                );
            }
        },
        [tooltip],
    );

    const handleLinkMouseLeave = useCallback(() => {
        setHoveredLink(null);
        setTooltip(null);
    }, []);

    // --- Empty state: no nodes at all ---
    if (graphData.nodes.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-[#434655] text-[13px]">
                <div className="text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No status transitions to display.</p>
                    <p className="text-[11px] text-[#737686] mt-1">
                        Transitions will appear as applications move through
                        stages.
                    </p>
                </div>
            </div>
        );
    }

    // --- Sparse state: single node with no transitions ---
    if (!graphData.hasTransitions) {
        const singleNode = graphData.nodes[0];
        const label =
            STATUS_CONFIG[singleNode.name as ApplicationStatus]?.label ||
            singleNode.name;
        const color =
            statusColors[singleNode.name as ApplicationStatus] || "#64748b";

        return (
            <div
                ref={containerRef}
                className="relative"
                style={{ height: chartHeight }}
            >
                <svg
                    width={dimensions.width || "100%"}
                    height={chartHeight}
                    className="overflow-visible"
                >
                    {/* Single node rect, centered */}
                    <rect
                        x={(dimensions.width || 200) / 2 - 40}
                        y={chartHeight / 2 - 20}
                        width={80}
                        height={40}
                        rx={6}
                        fill={color}
                        opacity={0.85}
                    />
                    <text
                        x={(dimensions.width || 200) / 2}
                        y={chartHeight / 2 + 5}
                        textAnchor="middle"
                        fill="white"
                        fontSize={12}
                        fontWeight={600}
                    >
                        {label}
                    </text>
                </svg>
                <p className="text-center text-[11px] text-[#737686] mt-2">
                    Only one status recorded — transitions will appear as
                    applications progress.
                </p>
            </div>
        );
    }

    // --- Layout computed: render full Sankey ---
    return (
        <div
            ref={containerRef}
            className="relative"
            style={{ height: chartHeight }}
        >
            {dimensions.width > 0 && sankeyResult && (
                <svg
                    width={dimensions.width}
                    height={chartHeight}
                    className="overflow-visible"
                >
                    {/* Links */}
                    <g>
                        {sankeyResult.links.map(
                            (link: SankeyLink, i: number) => {
                                const sourceColor =
                                    statusColors[
                                        link.source.name as ApplicationStatus
                                    ] || "#64748b";
                                const isHovered = hoveredLink === i;

                                return (
                                    <path
                                        key={`link-${i}`}
                                        d={link.path}
                                        fill="none"
                                        stroke={sourceColor}
                                        strokeWidth={Math.max(1, link.width)}
                                        strokeOpacity={isHovered ? 0.7 : 0.25}
                                        onMouseEnter={(e) =>
                                            handleLinkMouseEnter(e, link, i)
                                        }
                                        onMouseMove={handleLinkMouseMove}
                                        onMouseLeave={handleLinkMouseLeave}
                                        style={{
                                            cursor: "pointer",
                                            transition: "stroke-opacity 150ms",
                                        }}
                                    />
                                );
                            },
                        )}
                    </g>

                    {/* Nodes */}
                    <g>
                        {sankeyResult.nodes.map(
                            (node: SankeyNode, i: number) => {
                                const color =
                                    statusColors[
                                        node.name as ApplicationStatus
                                    ] || "#64748b";
                                const label =
                                    STATUS_CONFIG[
                                        node.name as ApplicationStatus
                                    ]?.label || node.name;
                                const nodeHeight = node.y1 - node.y0;
                                const nodeWidth = node.x1 - node.x0;

                                return (
                                    <g key={`node-${i}`}>
                                        <rect
                                            x={node.x0}
                                            y={node.y0}
                                            width={nodeWidth}
                                            height={Math.max(nodeHeight, 2)}
                                            fill={color}
                                            rx={2}
                                            opacity={0.9}
                                        />
                                        {/* Label */}
                                        <text
                                            x={
                                                node.x0 < dimensions.width / 2
                                                    ? node.x1 + 6
                                                    : node.x0 - 6
                                            }
                                            y={
                                                node.y0 +
                                                Math.max(nodeHeight, 2) / 2
                                            }
                                            textAnchor={
                                                node.x0 < dimensions.width / 2
                                                    ? "start"
                                                    : "end"
                                            }
                                            dominantBaseline="central"
                                            fill="#131b2e"
                                            fontSize={11}
                                            fontWeight={500}
                                        >
                                            {label}
                                        </text>
                                        {/* Value count */}
                                        <text
                                            x={
                                                node.x0 < dimensions.width / 2
                                                    ? node.x1 + 6
                                                    : node.x0 - 6
                                            }
                                            y={
                                                node.y0 +
                                                Math.max(nodeHeight, 2) / 2 +
                                                14
                                            }
                                            textAnchor={
                                                node.x0 < dimensions.width / 2
                                                    ? "start"
                                                    : "end"
                                            }
                                            dominantBaseline="central"
                                            fill="#737686"
                                            fontSize={10}
                                        >
                                            {
                                                applications.filter((app) =>
                                                    app.status_history?.some(
                                                        (h) =>
                                                            h.status ===
                                                            node.name,
                                                    ),
                                                ).length
                                            }
                                        </text>
                                    </g>
                                );
                            },
                        )}
                    </g>
                </svg>
            )}

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute pointer-events-none z-10 bg-white border border-[#e2e8f0] rounded-lg px-3 py-2 shadow-md"
                    style={{
                        left: tooltip.x + 12,
                        top: tooltip.y - 10,
                        fontSize: 12,
                        color: "#131b2e",
                    }}
                >
                    <div className="font-medium">
                        {STATUS_CONFIG[tooltip.source as ApplicationStatus]
                            ?.label || tooltip.source}{" "}
                        →{" "}
                        {STATUS_CONFIG[tooltip.target as ApplicationStatus]
                            ?.label || tooltip.target}
                    </div>
                    <div className="text-[#434655]">
                        {tooltip.value} application
                        {tooltip.value !== 1 ? "s" : ""}
                    </div>
                </div>
            )}
        </div>
    );
}
