"use client";

import { KPI, Action } from "@/lib/types";
import { useState } from "react";

type Props = {
    kpi: KPI;
    completedActionIds: string[];
    onToggleAction: (actionId: string) => void;
    onEditAction: (actionId: string, newTitle: string, newScore: number) => void;
    onAddUserAction: () => void;
};

export default function ActionList({
    kpi,
    completedActionIds,
    onToggleAction,
    onEditAction,
    onAddUserAction
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [editScore, setEditScore] = useState(3);

    const startEditing = (action: Action) => {
        setEditingId(action.id);
        setEditValue(action.title);
        setEditScore(action.score);
    };

    const saveEdit = () => {
        if (editingId && editValue.trim()) {
            onEditAction(editingId, editValue.trim(), editScore);
            setEditingId(null);
        }
    };

    const completedCount = kpi.actions.filter(a => completedActionIds.includes(a.id)).length;
    const totalCount = kpi.actions.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-3">
            {/* KPI Section Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">{kpi.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-zinc-600">{completedCount}/{totalCount}</span>
                    <button
                        onClick={onAddUserAction}
                        className="text-[10px] font-black text-zinc-600 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                    >
                        + Add
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-zinc-900 rounded-full mx-1 overflow-hidden">
                <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Action List */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
                {kpi.actions.map((action, idx) => {
                    const isCompleted = completedActionIds.includes(action.id);
                    const isEditing = editingId === action.id;
                    const isLast = idx === kpi.actions.length - 1;

                    return (
                        <div
                            key={action.id}
                            className={`${!isLast ? "border-b border-zinc-800/40" : ""}`}
                        >
                            {isEditing ? (
                                <div className="p-4 space-y-3">
                                    <input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        autoFocus
                                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Score</span>
                                            <input
                                                type="number"
                                                value={editScore}
                                                onChange={(e) => setEditScore(Number(e.target.value))}
                                                className="w-12 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-indigo-400 font-bold"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1.5 text-zinc-500 text-[10px] font-black rounded-full uppercase transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={saveEdit}
                                                className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase transition-all active:scale-95"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-3 px-4 py-3.5 transition-all duration-300 ${isCompleted ? "opacity-50" : ""}`}>
                                    {/* Checkbox toggle */}
                                    <button
                                        onClick={() => onToggleAction(action.id)}
                                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isCompleted
                                            ? "bg-indigo-500 border-indigo-500 animate-check-pop"
                                            : "border-zinc-700 hover:border-indigo-500"
                                            }`}
                                    >
                                        {isCompleted && (
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Action title */}
                                    <span className={`flex-1 text-sm font-medium leading-snug ${isCompleted ? "line-through text-zinc-600" : "text-zinc-200"}`}>
                                        {action.title}
                                    </span>

                                    {/* Score + Edit */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-[10px] font-black ${isCompleted ? "text-indigo-500" : "text-zinc-600"}`}>
                                            +{action.score}
                                        </span>
                                        <button
                                            onClick={() => startEditing(action)}
                                            className="p-1 text-zinc-700 hover:text-zinc-400 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
