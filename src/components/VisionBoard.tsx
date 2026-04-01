"use client";

import React, { useState, useEffect } from "react";
import { VisionCard } from "@/lib/types";
import { getVisionCards, saveVisionCard, toggleVisionCardAchievement, deleteVisionCard, generateId } from "@/lib/storage";

export default function VisionBoard() {
    const [cards, setCards] = useState<VisionCard[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newCategory, setNewCategory] = useState("Life");

    useEffect(() => {
        setCards(getVisionCards());
    }, []);

    const handleAddCard = () => {
        if (!newTitle) return;
        const newCard: VisionCard = {
            id: generateId(),
            title: newTitle,
            description: newDesc,
            category: newCategory,
            isAchieved: false,
            createdAt: new Date().toISOString(),
        };
        saveVisionCard(newCard);
        setCards(getVisionCards());
        setShowAddModal(false);
        setNewTitle("");
        setNewDesc("");
    };

    const handleToggle = (id: string) => {
        toggleVisionCardAchievement(id);
        setCards(getVisionCards());
    };

    const handleDelete = (id: string) => {
        if (confirm("このカードを削除しますか？")) {
            deleteVisionCard(id);
            setCards(getVisionCards());
        }
    };

    const achievedCount = cards.filter(c => c.isAchieved).length;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header Stats */}
            <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-[2rem] flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white">Vision Stock</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">積み上がった理想の数</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black text-indigo-400">{achievedCount}</span>
                    <span className="text-xs font-bold text-zinc-600 ml-1">/ {cards.length}</span>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        className={`group relative aspect-[3/4] p-5 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between overflow-hidden ${
                            card.isAchieved 
                            ? "bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10" 
                            : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                        }`}
                    >
                        {card.isAchieved && (
                            <div className="absolute top-3 right-3 text-indigo-400 animate-pulse">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        
                        <div>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                card.isAchieved ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-800 text-zinc-500"
                            }`}>
                                {card.category}
                            </span>
                            <h4 className={`text-sm font-bold mt-3 leading-tight ${card.isAchieved ? "text-white" : "text-zinc-300"}`}>
                                {card.title}
                            </h4>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                                {card.description || "No description"}
                            </p>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleToggle(card.id)}
                                    className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-colors ${
                                        card.isAchieved ? "bg-indigo-500/30 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    }`}
                                >
                                    {card.isAchieved ? "Undo" : "Achieve"}
                                </button>
                                <button 
                                    onClick={() => handleDelete(card.id)}
                                    className="p-2 bg-red-950/20 text-red-500 rounded-xl hover:bg-red-950/40 transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Button Card */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="aspect-[3/4] flex flex-col items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-zinc-800 text-zinc-600 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all duration-300"
                >
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Vision</span>
                </button>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                        <h3 className="text-xl font-black text-white tracking-tight">New Vision Card</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Title</label>
                                <input 
                                    type="text" 
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="なりたい姿・目標"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {["Life", "Work", "Body", "Mind", "Money"].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setNewCategory(cat)}
                                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                                newCategory === cat ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-zinc-950 text-zinc-600 border border-zinc-800"
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Description</label>
                                <textarea 
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="具体的なイメージや理由"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors min-h-[100px] no-scrollbar"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAddCard}
                                className="flex-[2] py-4 bg-white text-zinc-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                            >
                                Create Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
