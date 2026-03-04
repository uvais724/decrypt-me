import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function CuratedPacks() {
    const navigate = useNavigate();
    const [packs, setPacks] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Color themes for different categories
    const colorThemes = [
        {
            bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
            accent: 'from-blue-400 to-blue-600',
            button: 'btn-primary',
            border: 'border-blue-300',
            text: 'text-blue-900',
        },
        {
            bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
            accent: 'from-purple-400 to-purple-600',
            button: 'btn-secondary',
            border: 'border-purple-300',
            text: 'text-purple-900',
        },
        {
            bg: 'bg-gradient-to-br from-green-50 to-green-100',
            accent: 'from-green-400 to-green-600',
            button: 'btn-success',
            border: 'border-green-300',
            text: 'text-green-900',
        },
        {
            bg: 'bg-gradient-to-br from-pink-50 to-pink-100',
            accent: 'from-pink-400 to-pink-600',
            button: 'btn-accent',
            border: 'border-pink-300',
            text: 'text-pink-900',
        },
        {
            bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
            accent: 'from-amber-400 to-amber-600',
            button: 'btn-warning',
            border: 'border-amber-300',
            text: 'text-amber-900',
        },
        {
            bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
            accent: 'from-cyan-400 to-cyan-600',
            button: 'btn-info',
            border: 'border-cyan-300',
            text: 'text-cyan-900',
        },
    ];

    useEffect(() => {
        const fetchAllPacks = async () => {
            try {
                const { data, error } = await supabase.from('curated_packs').select('*');
                if (error) {
                    throw error;
                } else {
                    console.log("Curated packs fetched successfully:", data);
                    setPacks(data);
                }
            } catch (error) {
                console.error("Error fetching curated packs:", error);
            }
        };
        fetchAllPacks();
    }, []);

    // Group packs by category
    const groupedPacks = packs.reduce((acc, pack) => {
        if (!acc[pack.category]) {
            acc[pack.category] = [];
        }
        acc[pack.category].push(pack);
        return acc;
    }, {});

    const categories = Object.keys(groupedPacks);

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const getThemeForIndex = (index) => {
        return colorThemes[index % colorThemes.length];
    };

    return (
        <>
            <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-white mb-4">Curated Packs</h1>
                        <p className="text-gray-300 text-lg">Explore our collection of curated packs</p>
                    </div>

                    <div className="space-y-4">
                        {categories.map((category, index) => {
                            const theme = getThemeForIndex(index);
                            const isExpanded = expandedCategories[category];

                            return (
                                <div
                                    key={category}
                                    className={`rounded-lg border-2 ${theme.border} overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300`}
                                >
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className={`w-full px-6 py-4 ${theme.bg} flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity`}
                                    >
                                        <h2 className={`text-2xl font-bold ${theme.text}`}>{category}</h2>
                                        <svg
                                            className={`w-6 h-6 ${theme.text} transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 9l6 6 6-6"
                                            />
                                        </svg>
                                    </button>

                                    {isExpanded && (
                                        <div className="bg-white px-6 py-6 space-y-4">
                                            {groupedPacks[category].map((pack) => (
                                                <div
                                                    key={pack.id}
                                                    className={`p-4 rounded-lg ${theme.bg} border-l-4 ${theme.border} flex justify-between items-start gap-4`}
                                                >
                                                    <div className="flex-1">
                                                        <p className={`text-lg ${theme.text} font-medium leading-relaxed`}>
                                                            {pack.message}
                                                        </p>
                                                    </div>
                                                    <button 
                                        onClick={() => navigate('/new-game', { state: { message: pack.message } })}
                                        className={`btn ${theme.button} btn-sm whitespace-nowrap`}
                                    >
                                        Pick
                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {categories.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-300 text-xl">No packs available yet</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
