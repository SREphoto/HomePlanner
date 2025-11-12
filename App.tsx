

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppState, Property, Room, ProjectData, RoomType, InteractionMode, Furniture } from './types';
import Sidebar from './components/Sidebar';
import Blueprint from './components/Blueprint';
import Header from './components/Header';
import { generateFurnitureLayout, researchAddress, generateBlueprintLayout, generateRoomDescription, generateDimensionsFromImage, generateRoomVisualization, getRegionalCosts } from './services/geminiService';
import { saveProjectToFile, loadProjectFromFile, exportProjectReport } from './services/fileService';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PIXELS_PER_FOOT, ROOM_COLORS } from './constants';
import SparklesIcon from './components/icons/SparklesIcon';
import EditIcon from './components/icons/EditIcon';
import SearchIcon from './components/icons/SearchIcon';
import CameraView from './components/CameraView';
import CloseIcon from './components/icons/CloseIcon';


export interface GenerateOptions {
    sqft: number;
    floors: number;
    bedrooms: number;
    bathrooms: number;
}


const App = () => {
  const [appState, setAppState] = useState<AppState>('CREATE_PROPERTY');
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [totalFloors, setTotalFloors] = useState(1);
  const [isSnapEnabled, setIsSnapEnabled] = useState(true);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('select');
  const [cameraForRoomId, setCameraForRoomId] = useState<string | null>(null);
  const [visualizationModal, setVisualizationModal] = useState<{imageUrl: string; roomName: string} | null>(null);
  const [sunlight, setSunlight] = useState<{ enabled: boolean; azimuth: number }>({ enabled: false, azimuth: 90 });
  const [history, setHistory] = useState<ProjectData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.theme) {
      return localStorage.theme;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [theme]);

  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedRoomId) || null, [rooms, selectedRoomId]);

  const addToHistory = useCallback((currentProperty: Property, currentRooms: Room[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    const projectData: ProjectData = { property: currentProperty, rooms: currentRooms };
    setHistory([...newHistory, projectData]);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex]);

  useEffect(() => {
    // Add initial state to history if it's a freshly started project with no history.
    if (appState === 'DESIGNING' && property && history.length === 0) {
      addToHistory(property, rooms);
    }
  }, [appState, property, rooms, history.length, addToHistory]);

  const handleCreateProperty = (prop: Property, initialRooms: Room[] = []) => {
    setProperty(prop);
    setRooms(initialRooms);
    setAppState('DESIGNING');

    // Reset history with the new project state
    const projectData: ProjectData = { property: prop, rooms: initialRooms };
    setHistory([projectData]);
    setHistoryIndex(0);
  };

  const handleUpdateRoom = useCallback((updatedRoom: Room, finalize: boolean = true) => {
    const newRooms = rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
    setRooms(newRooms);
    if (finalize && property) {
        addToHistory(property, newRooms);
    }
  }, [rooms, property, addToHistory]);

  const handleUpdateMultipleRooms = useCallback((updatedRooms: Room[], finalize: boolean = true) => {
    const updatedRoomIds = new Set(updatedRooms.map(ur => ur.id));
    const newRooms = rooms.map(r => {
        const updatedRoom = updatedRooms.find(ur => ur.id === r.id);
        return updatedRoom || r;
    });
    setRooms(newRooms);
    if (finalize && property) {
        addToHistory(property, newRooms);
    }
  }, [rooms, property, addToHistory]);

  const handleDeleteRoom = useCallback((roomId: string) => {
    const newRooms = rooms.filter(r => r.id !== roomId);
    if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
    }
    setRooms(newRooms);
    if (property) {
      addToHistory(property, newRooms);
    }
  }, [rooms, property, selectedRoomId, addToHistory]);

  const handleAddRoom = useCallback((roomToAdd?: Omit<Room, 'id' | 'floor' | 'color'>) => {
    const newRoom: Room = {
        id: `room-${Date.now()}`,
        name: roomToAdd?.name || 'New Room',
        type: roomToAdd?.type || RoomType.Custom,
        floor: currentFloor,
        dimensions: roomToAdd?.dimensions || { width: 10, length: 10 },
        position: roomToAdd?.position || { x: 50, y: 50 },
        rotation: 0,
        features: [],
        furniture: [],
        pets: [],
        connections: [],
        color: ROOM_COLORS[roomToAdd?.type || RoomType.Custom],
    };
    const newRooms = [...rooms, newRoom];
    setRooms(newRooms);
    setSelectedRoomId(newRoom.id);
    if (property) {
      addToHistory(property, newRooms);
    }
  }, [rooms, property, currentFloor, addToHistory]);

  const handleGenerateLayout = useCallback(async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    setIsAiLoading(`furniture-${roomId}`);
    try {
      const furniture = await generateFurnitureLayout(room);
      handleUpdateRoom({ ...room, furniture }, true);
    } catch (error) {
      console.error(error);
      alert(`AI layout generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAiLoading(null);
    }
  }, [rooms, handleUpdateRoom]);

  const handleGenerateDescription = useCallback(async (roomId: string) => {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;
      setIsAiLoading(`description-${roomId}`);
      try {
          const description = await generateRoomDescription(room);
          handleUpdateRoom({ ...room, description }, true);
      } catch (error) {
          console.error(error);
          alert(`AI description generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
          setIsAiLoading(null);
      }
  }, [rooms, handleUpdateRoom]);

  const handleMeasureWithAI = useCallback(async (imageData: string) => {
    if (!cameraForRoomId) return;
    setIsAiLoading(`dimensions-${cameraForRoomId}`);
    setCameraForRoomId(null);
    try {
        const dimensions = await generateDimensionsFromImage(imageData);
        const roomToUpdate = rooms.find(r => r.id === cameraForRoomId);
        if(roomToUpdate) {
            handleUpdateRoom({ ...roomToUpdate, dimensions }, true);
        }
    } catch (error) {
        console.error(error);
        alert(`AI measurement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsAiLoading(null);
    }
  }, [cameraForRoomId, rooms, handleUpdateRoom]);

  const handleGenerateVisualization = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    setIsAiLoading(`visualize-${roomId}`);
    try {
        const imageBytes = await generateRoomVisualization(room);
        setVisualizationModal({ imageUrl: `data:image/jpeg;base64,${imageBytes}`, roomName: room.name });
    } catch (error) {
        console.error(error);
        alert(`Failed to generate visualization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsAiLoading(null);
    }
  };

  const handleGetRegionalCosts = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !property) return;

    setIsAiLoading(`costs-${roomId}`);
    try {
        const costs = await getRegionalCosts(property);
        const updatedRoom = { ...room, costEstimates: costs };
        handleUpdateRoom(updatedRoom, true);
    } catch (error) {
        console.error(error);
        alert(`Failed to get regional costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsAiLoading(null);
    }
  };

  const handleSave = () => property && saveProjectToFile({ property, rooms });
  const handleLoad = async () => {
    try {
      const data = await loadProjectFromFile();
      setProperty(data.property);
      setRooms(data.rooms);
      setSelectedRoomId(null);
      const maxFloor = Math.max(1, ...data.rooms.map(r => r.floor || 1));
      setTotalFloors(maxFloor);
      setCurrentFloor(1);
      // Reset history and add the loaded state as the initial entry
      setHistory([]); 
      setHistoryIndex(-1);
      addToHistory(data.property, data.rooms);
    } catch (error) {
      alert(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  const handleExport = () => property && exportProjectReport({ property, rooms });

  const handleNewProject = () => {
    if (window.confirm('Are you sure you want to start a new project? Any unsaved changes will be lost.')) {
        setAppState('CREATE_PROPERTY');
        setProperty(null);
        setRooms([]);
        setSelectedRoomId(null);
        setHistory([]);
        setHistoryIndex(-1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      setHistoryIndex(prevIndex);
      setProperty(prevState.property);
      setRooms(prevState.rooms);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      setHistoryIndex(nextIndex);
      setProperty(nextState.property);
      setRooms(nextState.rooms);
    }
  };

    const handleAddFloor = () => {
        const newTotal = totalFloors + 1;
        setTotalFloors(newTotal);
        setCurrentFloor(newTotal);
    };

  if (appState === 'CREATE_PROPERTY') {
    return <PropertyCreationScreen onPropertyCreate={handleCreateProperty} onProjectLoad={handleLoad} />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen w-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-50 overflow-hidden">
        <Sidebar
          property={property}
          rooms={rooms}
          selectedRoom={selectedRoom}
          onAddRoom={handleAddRoom}
          onSelectRoom={setSelectedRoomId}
          onUpdateRoom={(r) => handleUpdateRoom(r, true)}
          onUpdateMultipleRooms={(rs) => handleUpdateMultipleRooms(rs, true)}
          onDeleteRoom={handleDeleteRoom}
          onGenerateLayout={handleGenerateLayout}
          onGenerateDescription={handleGenerateDescription}
          onMeasureRoom={setCameraForRoomId}
          onGenerateVisualization={handleGenerateVisualization}
          onGetRegionalCosts={handleGetRegionalCosts}
          isAiLoading={isAiLoading}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          totalFloors={totalFloors}
          currentFloor={currentFloor}
          setCurrentFloor={setCurrentFloor}
          onAddFloor={handleAddFloor}
          interactionMode={interactionMode}
          setInteractionMode={setInteractionMode}
        />
        <main className="flex-1 flex flex-col">
          <Header
            property={property}
            rooms={rooms}
            onNewProject={handleNewProject}
            onSave={handleSave}
            onLoad={handleLoad}
            onExportReport={handleExport}
            theme={theme}
            setTheme={setTheme}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isSnapEnabled={isSnapEnabled}
            setIsSnapEnabled={setIsSnapEnabled}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            sunlight={sunlight}
            setSunlight={setSunlight}
          />
          <Blueprint
            rooms={rooms.filter(r => (r.floor || 1) === currentFloor)}
            allRooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={setSelectedRoomId}
            onUpdateRoom={(r) => handleUpdateRoom(r, false)}
            onFinalizeUpdate={(r) => handleUpdateRoom(r, true)}
            onAddRoom={handleAddRoom}
            onDeleteRoom={handleDeleteRoom}
            onGenerateLayout={handleGenerateLayout}
            viewMode={viewMode}
            isSnapEnabled={isSnapEnabled}
            interactionMode={interactionMode}
            setInteractionMode={setInteractionMode}
            currentFloor={currentFloor}
            sunlight={sunlight}
          />
        </main>
      </div>
      {cameraForRoomId && <CameraView onClose={() => setCameraForRoomId(null)} onCapture={handleMeasureWithAI} />}
      {visualizationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in" onClick={() => setVisualizationModal(null)}>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-4 max-w-4xl w-full relative" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Visualization: {visualizationModal.roomName}</h2>
                      <button onClick={() => setVisualizationModal(null)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <CloseIcon />
                      </button>
                  </div>
                  <img src={visualizationModal.imageUrl} alt={`AI visualization of ${visualizationModal.roomName}`} className="w-full h-auto rounded-md object-contain max-h-[80vh]" />
              </div>
          </div>
      )}
    </DndProvider>
  );
};

const PropertyCreationScreen: React.FC<{onPropertyCreate: (property: Property, rooms?: Room[]) => void, onProjectLoad: () => void}> = ({ onPropertyCreate, onProjectLoad }) => {
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
                        onClick={() => onPropertyCreate({name: "New Project", address: ""})}
                        className="w-full flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <EditIcon/> <span>Start Blank Project</span>
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
                        <input type="text" name="name" id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Dream House" />
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Property Address (for AI research)</label>
                        <div className="flex space-x-2 mt-1">
                            <input type="text" name="address" id="address" className="flex-grow" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA" />
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
                            <input type="number" name="sqft" id="sqft" value={generateOptions.sqft} onChange={e => setGenerateOptions({...generateOptions, sqft: parseInt(e.target.value) || 2000})} placeholder="e.g., 2000" />
                        </div>
                        <div>
                            <label htmlFor="floors" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Floors</label>
                            <input type="number" name="floors" id="floors" value={generateOptions.floors} onChange={e => setGenerateOptions({...generateOptions, floors: parseInt(e.target.value) || 1})} placeholder="e.g., 2" />
                        </div>
                        <div>
                            <label htmlFor="bedrooms" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bedrooms</label>
                            <input type="number" name="bedrooms" id="bedrooms" value={generateOptions.bedrooms} onChange={e => setGenerateOptions({...generateOptions, bedrooms: parseInt(e.target.value) || 3})} placeholder="e.g., 3" />
                        </div>
                        <div>
                            <label htmlFor="bathrooms" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bathrooms</label>
                            <input type="number" name="bathrooms" id="bathrooms" value={generateOptions.bathrooms} onChange={e => setGenerateOptions({...generateOptions, bathrooms: parseInt(e.target.value) || 2})} placeholder="e.g., 2" />
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

export default App;
