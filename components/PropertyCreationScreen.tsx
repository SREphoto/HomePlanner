import React, { useState } from 'react';
import { Property, Room, GenerateOptions } from '../types';
import { researchAddress, generateBlueprintLayout } from '../services/geminiService';
import EditIcon from './icons/EditIcon';
import SearchIcon from './icons/SearchIcon';
import SparklesIcon from './icons/SparklesIcon';

interface PropertyCreationScreenProps {
    onPropertyCreate: (property: Property, rooms?: Room[]) => void;
    onProjectLoad: () => void;
}

const PropertyCreationScreen: React.FC<PropertyCreationScreenProps> = ({ onPropertyCreate, onProjectLoad }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [researchText, setResearchText] = useState<string | null>(null);
    const [isResearching, setIsResearching] = useState(false);
    const [generateOptions, setGenerateOptions] = useState<GenerateOptions>({
        sqft: 2000,
        floors: 1,
        bedrooms: 3,
        bathrooms: 2,
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleResearch = async () => {
        if (!address) return;
        setIsResearching(true);
        try {
            const result = await researchAddress(address);
            setResearchText(result);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsResearching(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const newRooms = await generateBlueprintLayout(generateOptions, researchText);
            const property: Property = { name: name || "AI Generated Plan", address };
            onPropertyCreate(property, newRooms);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-screen h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-100">Welcome to AI Home Planner</h1>
                    <p className="text-center text-slate-500 dark:text-slate-400 mt-2">Start a new project or load an existing one.</p>
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={() => onPropertyCreate({ name: "New Project", address: "" })}
                        className="w-full flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <EditIcon /> <span>Start Blank Project</span>
                    </button>
                    <button onClick={onProjectLoad} className="w-full flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Load Project...
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-300 dark:border-slate-600"></span></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or Generate a Layout with AI</span></div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Name</label>
                        <input type="text" name="name" id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Dream House" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Property Address (for AI research)</label>
                        <div className="flex space-x-2 mt-1">
                            <input type="text" name="address" id="address" className="flex-grow mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm p-2 border" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA" />
                            <button onClick={handleResearch} disabled={!address || isResearching} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md text-sm font-medium disabled:opacity-50">
                                {isResearching ? '...' : <SearchIcon />}
                            </button>
                        </div>
                    </div>

                    {isResearching && <div className="text-center p-4 text-slate-500">Researching address...</div>}

                    {researchText && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">AI Research Results:</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{researchText}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="sqft" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Sq. Footage</label>
                            <input type="number" name="sqft" id="sqft" value={generateOptions.sqft} onChange={e => setGenerateOptions({ ...generateOptions, sqft: parseInt(e.target.value) || 2000 })} placeholder="e.g., 2000" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm p-2 border" />
                        </div>
                        <div>
                            <label htmlFor="floors" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Floors</label>
                            <input type="number" name="floors" id="floors" value={generateOptions.floors} onChange={e => setGenerateOptions({ ...generateOptions, floors: parseInt(e.target.value) || 1 })} placeholder="e.g., 2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm p-2 border" />
                        </div>
                        <div>
                            <label htmlFor="bedrooms" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bedrooms</label>
                            <input type="number" name="bedrooms" id="bedrooms" value={generateOptions.bedrooms} onChange={e => setGenerateOptions({ ...generateOptions, bedrooms: parseInt(e.target.value) || 3 })} placeholder="e.g., 3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm p-2 border" />
                        </div>
                        <div>
                            <label htmlFor="bathrooms" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bathrooms</label>
                            <input type="number" name="bathrooms" id="bathrooms" value={generateOptions.bathrooms} onChange={e => setGenerateOptions({ ...generateOptions, bathrooms: parseInt(e.target.value) || 2 })} placeholder="e.g., 2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:text-sm p-2 border" />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {isGenerating ? 'Generating...' : <><SparklesIcon /> <span>Generate AI Blueprint</span> </>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PropertyCreationScreen;
