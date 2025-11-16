

import React, { useState, useRef, useEffect } from 'react';
import SaveIcon from './icons/SaveIcon';
import UploadIcon from './icons/UploadIcon';
import CubeIcon from './icons/CubeIcon';
import SquareIcon from './icons/SquareIcon';
import CogIcon from './icons/CogIcon';
import UndoIcon from './icons/UndoIcon';
import RedoIcon from './icons/RedoIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import PlusIcon from './icons/PlusIcon';
import { Property, Room } from '../types';

interface HeaderProps {
    property: Property | null;
    rooms: Room[];
    onNewProject: () => void;
    onSave: () => void;
    onLoad: () => void;
    onExportReport: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    viewMode: '2d' | '3d';
    setViewMode: (mode: '2d' | '3d') => void;
    isSnapEnabled: boolean;
    setIsSnapEnabled: (enabled: boolean) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    sunlight: { enabled: boolean; azimuth: number };
    setSunlight: (value: { enabled: boolean; azimuth: number }) => void;
}

const Header: React.FC<HeaderProps> = ({
    property, rooms, onNewProject, onSave, onLoad, onExportReport, theme, setTheme, viewMode, setViewMode, isSnapEnabled, setIsSnapEnabled,
    onUndo, onRedo, canUndo, canRedo, sunlight, setSunlight
}) => {
    return (
        <header className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-md h-[65px] px-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 z-30">
            <div className="flex items-center space-x-2">
                 <button onClick={onUndo} disabled={!canUndo} title="Undo" className="flex items-center space-x-2 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-slate-700 dark:text-slate-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><UndoIcon/></button>
                 <button onClick={onRedo} disabled={!canRedo} title="Redo" className="flex items-center space-x-2 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-slate-700 dark:text-slate-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><RedoIcon/></button>
            </div>
            <div className="flex items-center space-x-2">
                <SunlightControl sunlight={sunlight} setSunlight={setSunlight} />
                <div className="h-6 border-l border-slate-300 dark:border-slate-600 mx-1"></div>
                <button onClick={onNewProject} title="New Project" className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 font-medium transition-colors"><PlusIcon/> <span className="hidden sm:inline">New</span></button>
                <button onClick={onSave} title="Save Project" className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 font-medium transition-colors"><SaveIcon/> <span className="hidden sm:inline">Save</span></button>
                <button onClick={onNewProject} title="New Project" className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 font-medium transition-colors"><PlusIcon/> <span className="hidden sm:inline">New</span></button>
                <button onClick={onLoad} title="Load Project" className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 font-medium transition-colors"><UploadIcon/> <span className="hidden sm:inline">Load</span></button>
                 <button onClick={onExportReport} title="Export Text Report" className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 font-medium transition-colors"><DocumentTextIcon/> <span className="hidden sm:inline">Report</span></button>
                <div className="h-6 border-l border-slate-300 dark:border-slate-600 mx-1"></div>
                <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
                <SettingsPopover 
                    theme={theme}
                    setTheme={setTheme}
                    isSnapEnabled={isSnapEnabled}
                    setIsSnapEnabled={setIsSnapEnabled}
                />
            </div>
        </header>
    );
};


const SunIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);

const MoonIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);


interface SettingsPopoverProps {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    isSnapEnabled: boolean;
    setIsSnapEnabled: (enabled: boolean) => void;
}

const SettingsPopover: React.FC<SettingsPopoverProps> = ({ theme, setTheme, isSnapEnabled, setIsSnapEnabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button onClick={() => setIsOpen(!isOpen)} title="Settings" className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors">
                <CogIcon />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-40 animate-fade-in">
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="theme-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</label>
                            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                {theme === 'light' ? <MoonIcon/> : <SunIcon/>}
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="snap-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">Snap to Grid</label>
                            <Switch enabled={isSnapEnabled} setEnabled={setIsSnapEnabled} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

interface SwitchProps {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ enabled, setEnabled }) => {
  return (
    <button
      type="button"
      className={`${
        enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-slate-800`}
      role="switch"
      aria-checked={enabled}
      onClick={() => setEnabled(!enabled)}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};


interface ViewModeToggleProps {
    viewMode: '2d' | '3d';
    setViewMode: (mode: '2d' | '3d') => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, setViewMode }) => {
    return (
        <div className="flex items-center space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-full">
            <button onClick={() => setViewMode('2d')} title="2D Blueprint View" className={`p-1.5 rounded-full transition-colors ${viewMode === '2d' ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                <SquareIcon />
            </button>
            <button onClick={() => setViewMode('3d')} title="3D Dollhouse View" className={`p-1.5 rounded-full transition-colors ${viewMode === '3d' ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                <CubeIcon />
            </button>
        </div>
    )
}

interface SunlightControlProps {
    sunlight: { enabled: boolean; azimuth: number };
    setSunlight: (value: { enabled: boolean; azimuth: number }) => void;
}

const SunlightControl: React.FC<SunlightControlProps> = ({ sunlight, setSunlight }) => {
    return (
        <div className="flex items-center space-x-2 p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <button onClick={() => setSunlight({ ...sunlight, enabled: !sunlight.enabled })} title="Toggle Sunlight Simulation" className={`p-1.5 rounded-full transition-colors ${sunlight.enabled ? 'bg-amber-400 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                <SunIcon />
            </button>
            {sunlight.enabled && (
                <div className="flex items-center space-x-2 animate-fade-in w-32">
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={sunlight.azimuth}
                        onChange={(e) => setSunlight({ ...sunlight, azimuth: parseInt(e.target.value) })}
                        className="w-full"
                        title={`Sun Angle: ${sunlight.azimuth}°`}
                    />
                </div>
            )}
        </div>
    )
}

export default Header;