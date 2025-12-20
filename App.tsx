import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppState, Property, Room, ProjectData, RoomType, InteractionMode, Furniture } from './types';
import Sidebar from './components/Sidebar';
import Blueprint from './components/Blueprint';
import Header from './components/Header';
import { generateFurnitureLayout, generateRoomDescription, generateDimensionsFromImage, generateRoomVisualization, getRegionalCosts } from './services/geminiService';
import { saveProjectToFile, loadProjectFromFile, exportProjectReport } from './services/fileService';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PIXELS_PER_FOOT, ROOM_COLORS } from './constants';
import CameraView from './components/CameraView';
import CloseIcon from './components/icons/CloseIcon';
import ConfirmModal from './components/ConfirmModal';
import PropertyCreationScreen from './components/PropertyCreationScreen';

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
  const [visualizationModal, setVisualizationModal] = useState<{ imageUrl: string; roomName: string } | null>(null);
  const [sunlight, setSunlight] = useState<{ enabled: boolean; azimuth: number }>({ enabled: false, azimuth: 90 });
  const [history, setHistory] = useState<ProjectData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

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
      if (roomToUpdate) {
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
    setIsNewProjectModalOpen(true);
  };

  const handleConfirmNewProject = () => {
    setAppState('CREATE_PROPERTY');
    setProperty(null);
    setRooms([]);
    setSelectedRoomId(null);
    setHistory([]);
    setHistoryIndex(-1);
    setIsNewProjectModalOpen(false);
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
              <button onClick={() => setVisualizationModal(null)} aria-label="Close visualization" className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <CloseIcon />
              </button>
            </div>
            <img src={visualizationModal.imageUrl} alt={`AI visualization of ${visualizationModal.roomName}`} className="w-full h-auto rounded-md object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isNewProjectModalOpen}
        title="Start New Project"
        message="Are you sure you want to start a new project? Any unsaved changes will be lost."
        onConfirm={handleConfirmNewProject}
        onCancel={() => setIsNewProjectModalOpen(false)}
      />
    </DndProvider>
  );
};

export default App;
