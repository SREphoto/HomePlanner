
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Property, Room, RoomType, Feature, FeatureType, Wall, ROOM_TYPES, Furniture, Pet, PetType, PET_TYPES, InteractionMode } from '../types';
import PlusIcon from './icons/PlusIcon';
import SparklesIcon from './icons/SparklesIcon';
import DoorIcon from './icons/DoorIcon';
import WindowIcon from './icons/WindowIcon';
import OutletIcon from './icons/OutletIcon';
import TrashIcon from './icons/TrashIcon';
import RotateIcon from './icons/RotateIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import DragHandleIcon from './icons/DragHandleIcon';
import OpeningIcon from './icons/OpeningIcon';
import PencilIcon from './icons/PencilIcon';
import { PIXELS_PER_FOOT, GRID_SNAP_FEET, ROOM_COLORS, DEFAULT_WALL_COLOR, DEFAULT_FURNITURE_COLOR } from '../constants';
import MagicWandIcon from './icons/MagicWandIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import CameraIcon from './icons/CameraIcon';
import ImageIcon from './icons/ImageIcon';
import SearchIcon from './icons/SearchIcon';


interface FloorSelectorProps {
    totalFloors: number;
    currentFloor: number;
    setCurrentFloor: (floor: number) => void;
    onAddFloor: () => void;
    isCollapsed: boolean;
}

const FloorSelector: React.FC<FloorSelectorProps> = ({ totalFloors, currentFloor, setCurrentFloor, onAddFloor, isCollapsed }) => {
    if (isCollapsed) {
        return (
            <div className="py-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-center space-y-2">
                    {Array.from({ length: totalFloors }, (_, i) => i + 1).map(floor => (
                        <button
                            key={floor}
                            onClick={() => setCurrentFloor(floor)}
                            title={`View Floor ${floor}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                                currentFloor === floor 
                                ? 'bg-blue-500 text-white shadow-md' 
                                : 'bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200'
                            }`}
                        >
                            {floor}
                        </button>
                    ))}
                    <button 
                        onClick={onAddFloor} 
                        title="Add New Floor" 
                        className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-colors bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 border-2 border-dashed border-slate-400 dark:border-slate-500 text-slate-500 dark:text-slate-400"
                    >
                        <PlusIcon />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Floors</h3>
                <button onClick={onAddFloor} title="Add New Floor" className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600 transition-colors">
                    <PlusIcon />
                </button>
            </div>
            <nav className="flex flex-wrap gap-2">
                {Array.from({ length: totalFloors }, (_, i) => i + 1).map(floor => (
                    <button
                        key={floor}
                        onClick={() => setCurrentFloor(floor)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 ${
                            currentFloor === floor 
                            ? 'bg-blue-500 text-white shadow' 
                            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'
                        }`}
                    >
                        Floor {floor}
                    </button>
                ))}
            </nav>
        </div>
    );
};


interface SidebarProps {
  property: Property | null;
  rooms: Room[];
  selectedRoom: Room | null;
  onAddRoom: (roomToAdd?: Omit<Room, 'id' | 'floor' | 'color'>) => void;
  onSelectRoom: (id: string | null) => void;
  onUpdateRoom: (room: Room) => void;
  onUpdateMultipleRooms: (rooms: Room[]) => void;
  onDeleteRoom: (roomId: string) => void;
  onGenerateLayout: (roomId: string) => void;
  onGenerateDescription: (roomId: string) => void;
  onMeasureRoom: (roomId: string) => void;
  onGenerateVisualization: (roomId: string) => void;
  onGetRegionalCosts: (roomId: string) => void;
  isAiLoading: string | null;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  totalFloors: number;
  currentFloor: number;
  setCurrentFloor: (floor: number) => void;
  onAddFloor: () => void;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  property,
  rooms,
  selectedRoom,
  onAddRoom,
  onSelectRoom,
  onUpdateRoom,
  onUpdateMultipleRooms,
  onDeleteRoom,
  onGenerateLayout,
  onGenerateDescription,
  onMeasureRoom,
  onGenerateVisualization,
  onGetRegionalCosts,
  isAiLoading,
  isCollapsed,
  setIsCollapsed,
  totalFloors,
  currentFloor,
  setCurrentFloor,
  onAddFloor,
  interactionMode,
  setInteractionMode
}) => {
  const visibleRooms = rooms.filter(r => (r.floor || 1) === currentFloor);
  
  return (
    <aside className={`bg-white dark:bg-slate-800 shadow-lg flex flex-col h-full border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-96'}`}>
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center h-[65px]">
        <div className={`overflow-hidden transition-all ${isCollapsed ? 'w-0' : 'w-auto'}`}>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">{property?.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{property?.address}</p>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                {isCollapsed ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
            </button>
        </div>
      </div>
      
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'overflow-hidden' : ''}`}>
        <div className={`p-3 space-y-2 border-b border-slate-200 dark:border-slate-700 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            <div className={`w-full flex ${isCollapsed ? 'flex-col space-y-2' : 'space-x-2'}`}>
              <button onClick={() => onAddRoom()} title="Add Room" className={`flex-1 flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
                <PlusIcon /> <span className={isCollapsed ? 'hidden' : ''}>Add Room</span>
              </button>
              <button 
                  onClick={() => setInteractionMode('draw_hallway')} 
                  title="Draw Hallway" 
                  className={`flex-1 flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${interactionMode === 'draw_hallway' ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-100' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                >
                <PencilIcon /> <span className={isCollapsed ? 'hidden' : ''}>Draw Hallway</span>
              </button>
            </div>
        </div>
        
        <FloorSelector 
            totalFloors={totalFloors}
            currentFloor={currentFloor}
            setCurrentFloor={setCurrentFloor}
            onAddFloor={onAddFloor}
            isCollapsed={isCollapsed}
        />

        <div className={isCollapsed ? 'hidden' : ''}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Rooms on Floor {currentFloor}</h2>
              </div>
              <ul className="space-y-2">
                {visibleRooms.map(room => (
                  <li key={room.id}>
                    <button
                      onClick={() => onSelectRoom(room.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                        selectedRoom?.id === room.id
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" style={{ backgroundColor: room.color }}></span>
                      <span>{room.name}</span>
                    </button>
                  </li>
                ))}
                 {visibleRooms.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No rooms on this floor. Add one to get started!</p>}
              </ul>
            </div>
            {selectedRoom && (selectedRoom.floor || 1) === currentFloor && (
              <RoomEditor
                key={selectedRoom.id}
                room={selectedRoom}
                allRooms={rooms}
                onUpdate={onUpdateRoom}
                onUpdateMultipleRooms={onUpdateMultipleRooms}
                onGenerateLayout={onGenerateLayout}
                onGenerateDescription={onGenerateDescription}
                onMeasureRoom={onMeasureRoom}
                onGenerateVisualization={onGenerateVisualization}
                onGetRegionalCosts={onGetRegionalCosts}
                onDelete={onDeleteRoom}
                isAiLoading={isAiLoading}
              />
            )}
        </div>
      </div>
    </aside>
  );
};

interface RoomEditorProps {
    room: Room;
    allRooms: Room[];
    onUpdate: (room: Room) => void;
    onUpdateMultipleRooms: (rooms: Room[]) => void;
    onGenerateLayout: (roomId: string) => void;
    onGenerateDescription: (roomId: string) => void;
    onMeasureRoom: (roomId: string) => void;
    onGenerateVisualization: (roomId: string) => void;
    onGetRegionalCosts: (roomId: string) => void;
    onDelete: (roomId: string) => void;
    isAiLoading: string | null;
}

const findAdjacentSegments = (currentRoom: Room, allRooms: Room[]) => {
    const adjacentData: {
        adjacentRoom: Room;
        wallOnCurrent: Wall;
        wallOnAdjacent: Wall;
        segment: [number, number];
    }[] = [];
    
    const SNAP_THRESHOLD = 5; // in pixels

    const r1_left = currentRoom.position.x;
    const r1_right = currentRoom.position.x + currentRoom.dimensions.width * PIXELS_PER_FOOT;
    const r1_top = currentRoom.position.y;
    const r1_bottom = currentRoom.position.y + currentRoom.dimensions.length * PIXELS_PER_FOOT;

    for (const otherRoom of allRooms) {
        if (otherRoom.id === currentRoom.id || (otherRoom.floor || 1) !== (currentRoom.floor || 1)) continue;

        const r2_left = otherRoom.position.x;
        const r2_right = otherRoom.position.x + otherRoom.dimensions.width * PIXELS_PER_FOOT;
        const r2_top = otherRoom.position.y;
        const r2_bottom = otherRoom.position.y + otherRoom.dimensions.length * PIXELS_PER_FOOT;

        // Check my right against their left
        if (Math.abs(r1_right - r2_left) < SNAP_THRESHOLD) {
            const overlap_start = Math.max(r1_top, r2_top);
            const overlap_end = Math.min(r1_bottom, r2_bottom);
            if (overlap_end > overlap_start) {
                const segment = [overlap_start - r1_top, overlap_end - r1_top].map(v => v / PIXELS_PER_FOOT) as [number, number];
                adjacentData.push({ adjacentRoom: otherRoom, wallOnCurrent: 'right', wallOnAdjacent: 'left', segment });
            }
        }

        // Check my left against their right
        if (Math.abs(r1_left - r2_right) < SNAP_THRESHOLD) {
            const overlap_start = Math.max(r1_top, r2_top);
            const overlap_end = Math.min(r1_bottom, r2_bottom);
            if (overlap_end > overlap_start) {
                const segment = [overlap_start - r1_top, overlap_end - r1_top].map(v => v / PIXELS_PER_FOOT) as [number, number];
                adjacentData.push({ adjacentRoom: otherRoom, wallOnCurrent: 'left', wallOnAdjacent: 'right', segment });
            }
        }
        
        // Check my bottom against their top
        if (Math.abs(r1_bottom - r2_top) < SNAP_THRESHOLD) {
            const overlap_start = Math.max(r1_left, r2_left);
            const overlap_end = Math.min(r1_right, r2_right);
            if (overlap_end > overlap_start) {
                const segment = [overlap_start - r1_left, overlap_end - r1_left].map(v => v / PIXELS_PER_FOOT) as [number, number];
                adjacentData.push({ adjacentRoom: otherRoom, wallOnCurrent: 'bottom', wallOnAdjacent: 'top', segment });
            }
        }

        // Check my top against their bottom
        if (Math.abs(r1_top - r2_bottom) < SNAP_THRESHOLD) {
            const overlap_start = Math.max(r1_left, r2_left);
            const overlap_end = Math.min(r1_right, r2_right);
             if (overlap_end > overlap_start) {
                const segment = [overlap_start - r1_left, overlap_end - r1_left].map(v => v / PIXELS_PER_FOOT) as [number, number];
                adjacentData.push({ adjacentRoom: otherRoom, wallOnCurrent: 'top', wallOnAdjacent: 'bottom', segment });
            }
        }
    }
    return adjacentData;
};

const RoomEditor: React.FC<RoomEditorProps> = ({ room, allRooms, onUpdate, onUpdateMultipleRooms, onGenerateLayout, onGenerateDescription, onMeasureRoom, onGenerateVisualization, onGetRegionalCosts, onDelete, isAiLoading }) => {
    
    const [nudgeAmount, setNudgeAmount] = useState(GRID_SNAP_FEET);
    const [isFeatureMenuOpen, setIsFeatureMenuOpen] = useState(false);
    const featureMenuRef = useRef<HTMLDivElement>(null);
    const adjacentRooms = useMemo(() => findAdjacentSegments(room, allRooms), [room, allRooms]);
    
    // Pet state
    const [isPetFormVisible, setIsPetFormVisible] = useState(false);
    const [newPetName, setNewPetName] = useState('');
    const [newPetType, setNewPetType] = useState<PetType>(PetType.Dog);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (featureMenuRef.current && !featureMenuRef.current.contains(event.target as Node)) {
                setIsFeatureMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'type') {
            const roomType = value as RoomType;
            onUpdate({ ...room, type: roomType, color: ROOM_COLORS[roomType] });
        } else {
            onUpdate({ ...room, [name]: value });
        }
    };

    const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const snappedValue = Math.round(parseFloat(value) / GRID_SNAP_FEET) * GRID_SNAP_FEET;
        const updatedRoom = {
            ...room,
            dimensions: { ...room.dimensions, [name]: isNaN(snappedValue) ? 0 : snappedValue },
        };
        onUpdate(updatedRoom);
    };

    const handleCostEstimateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedCosts = { ...room.costEstimates, [name]: parseFloat(value) || 0 };
        onUpdate({ ...room, costEstimates: updatedCosts });
    }

    const handleAddFeature = (type: FeatureType) => {
        let size = 3; // Default door size
        if (type === FeatureType.Window) size = 4;
        if (type === FeatureType.Outlet) size = 0.5;
        if (type === FeatureType.GarageDoor) size = 8;
        if (type === FeatureType.SlidingDoor) size = 6;
        if (type === FeatureType.FrenchDoor) size = 5;

        const newFeature: Feature = {
            id: `feature-${Date.now()}`,
            type,
            wall: 'top',
            offset: 50,
            size
        };
        const updatedRoom = { ...room, features: [...room.features, newFeature] };
        onUpdate(updatedRoom);
        setIsFeatureMenuOpen(false);
    }
    
    const handleUpdateFeature = (updatedFeature: Feature) => {
        const updatedFeatures = room.features.map(f => f.id === updatedFeature.id ? updatedFeature : f);
        onUpdate({ ...room, features: updatedFeatures });
    }

    const handleRemoveFeature = (featureId: string) => {
        const updatedFeatures = room.features.filter(f => f.id !== featureId);
        onUpdate({ ...room, features: updatedFeatures });
    }
    
    const handleCreateOpening = (adjData: ReturnType<typeof findAdjacentSegments>[0]) => {
        const { adjacentRoom, wallOnCurrent, wallOnAdjacent, segment } = adjData;
        
        const size = segment[1] - segment[0];
        const offsetPercent = ((segment[0] + size / 2) / (wallOnCurrent === 'left' || wallOnCurrent === 'right' ? room.dimensions.length : room.dimensions.width)) * 100;

        const newFeatureCurrent: Feature = {
            id: `feature-${Date.now()}`,
            type: FeatureType.Opening,
            wall: wallOnCurrent,
            offset: offsetPercent,
            size: size
        };

        const adjacentWallLength = wallOnAdjacent === 'left' || wallOnAdjacent === 'right' ? adjacentRoom.dimensions.length : adjacentRoom.dimensions.width;
        let adjacentOffsetFt;
        if (wallOnCurrent === 'right') { // my right, their left
             adjacentOffsetFt = (room.position.y + (segment[0] * PIXELS_PER_FOOT)) - adjacentRoom.position.y;
        } else if (wallOnCurrent === 'left') { // my left, their right
             adjacentOffsetFt = (room.position.y + (segment[0] * PIXELS_PER_FOOT)) - adjacentRoom.position.y;
        } else if (wallOnCurrent === 'bottom') { // my bottom, their top
            adjacentOffsetFt = (room.position.x + (segment[0] * PIXELS_PER_FOOT)) - adjacentRoom.position.x;
        } else { // my top, their bottom
            adjacentOffsetFt = (room.position.x + (segment[0] * PIXELS_PER_FOOT)) - adjacentRoom.position.x;
        }
        
        const adjacentOffsetPercent = ((adjacentOffsetFt / PIXELS_PER_FOOT + size / 2) / adjacentWallLength) * 100;
        
        const newFeatureAdjacent: Feature = {
            id: `feature-${Date.now() + 1}`,
            type: FeatureType.Opening,
            wall: wallOnAdjacent,
            offset: adjacentOffsetPercent,
            size: size,
        }

        const updatedCurrentRoom = { ...room, features: [...room.features, newFeatureCurrent] };
        const updatedAdjacentRoom = { ...adjacentRoom, features: [...adjacentRoom.features, newFeatureAdjacent] };

        onUpdateMultipleRooms([updatedCurrentRoom, updatedAdjacentRoom]);
    };

    const handleUpdateFurniture = (updatedFurniture: Furniture) => {
        const updatedFurnitureList = room.furniture.map(f => f.id === updatedFurniture.id ? updatedFurniture : f);
        onUpdate({ ...room, furniture: updatedFurnitureList });
    };

    const handleDeleteFurniture = (furnitureId: string) => {
        const updatedFurnitureList = room.furniture.filter(f => f.id !== furnitureId);
        onUpdate({ ...room, furniture: updatedFurnitureList });
    };
    
    const handleAddPet = () => {
        if (!newPetName.trim()) {
            alert("Please enter a name for the pet.");
            return;
        }

        const newPet: Pet = {
            id: `pet-${Date.now()}`,
            name: newPetName,
            type: newPetType,
            // Place pet near the center of the room initially
            position: { 
                x: room.dimensions.width / 2, 
                y: room.dimensions.length / 2 
            },
        };

        const updatedRoom = { ...room, pets: [...(room.pets || []), newPet] };
        onUpdate(updatedRoom);

        // Reset form
        setNewPetName('');
        setNewPetType(PetType.Dog);
        setIsPetFormVisible(false);
    };

    const handleDeletePet = (petId: string) => {
        const updatedPets = (room.pets || []).filter(p => p.id !== petId);
        onUpdate({ ...room, pets: updatedPets });
    };

    const handleNudge = (direction: 'up' | 'down' | 'left' | 'right') => {
        const NUDGE_AMOUNT_PX = nudgeAmount * PIXELS_PER_FOOT;
        const newPosition = { ...room.position };
        if (direction === 'up') newPosition.y -= NUDGE_AMOUNT_PX;
        if (direction === 'down') newPosition.y += NUDGE_AMOUNT_PX;
        if (direction === 'left') newPosition.x -= NUDGE_AMOUNT_PX;
        if (direction === 'right') newPosition.x += NUDGE_AMOUNT_PX;
        onUpdate({ ...room, position: newPosition });
    };

    const handleRotate = () => {
        const newRotation = (room.rotation + 90) % 360;
        onUpdate({ ...room, rotation: newRotation as Room['rotation'] });
    };

    const isMeasuring = isAiLoading === `dimensions-${room.id}`;
    const roomArea = room.dimensions.width * room.dimensions.length;

    return (
        <div className="p-5 space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Room Name</label>
                <input type="text" name="name" id="name" value={room.name} onChange={handleInputChange} />
            </div>

            <div className="flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Room Type</label>
                    <select id="type" name="type" value={room.type} onChange={handleInputChange}>
                       {ROOM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="floorColor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Floor Color</label>
                    <input 
                        type="color" 
                        id="floorColor"
                        value={room.color || '#ffffff'} 
                        onChange={e => onUpdate({ ...room, color: e.target.value })} 
                        className="mt-1 w-full h-10 p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer"
                        title="Change floor color"
                    />
                </div>
                 <div>
                    <label htmlFor="wallColor" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Wall Color</label>
                    <input 
                        type="color" 
                        id="wallColor"
                        value={room.wallColor || DEFAULT_WALL_COLOR} 
                        onChange={e => onUpdate({ ...room, wallColor: e.target.value })} 
                        className="mt-1 w-full h-10 p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer"
                        title="Change wall color"
                    />
                </div>
            </div>
            <div>
                <button
                    onClick={() => onMeasureRoom(room.id)}
                    disabled={isMeasuring}
                    className="w-full mb-3 flex items-center justify-center space-x-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md text-sm transition-colors text-slate-700 dark:text-slate-200 disabled:opacity-50"
                >
                    <CameraIcon /> <span>Scan Room with AI</span>
                </button>
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <label htmlFor="width" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Width (ft)</label>
                        <input type="number" name="width" id="width" value={room.dimensions.width} onChange={handleDimensionChange} step={GRID_SNAP_FEET} disabled={isMeasuring} />
                        {isMeasuring && <div className="absolute inset-y-0 right-3 top-6 flex items-center"><svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                    </div>
                    <div className="relative">
                        <label htmlFor="length" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Length (ft)</label>
                        <input type="number" name="length" id="length" value={room.dimensions.length} onChange={handleDimensionChange} step={GRID_SNAP_FEET} disabled={isMeasuring} />
                         {isMeasuring && <div className="absolute inset-y-0 right-3 top-6 flex items-center"><svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                    </div>
                </div>
            </div>

             <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Position & Orientation</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nudge (ft)</label>
                            <div className="flex items-center bg-slate-200 dark:bg-slate-700/50 p-0.5 rounded-md space-x-0.5">
                                {[0.5, 1, 5, 10].map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setNudgeAmount(amount)}
                                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                            nudgeAmount === amount
                                            ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300 font-bold'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-500'
                                        }`}
                                    >
                                        {amount}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
                            <div></div>
                            <button onClick={() => handleNudge('up')} title={`Nudge Up (${nudgeAmount}ft)`} className="flex items-center justify-center p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors"><ArrowUpIcon /></button>
                            <div></div>
                            <button onClick={() => handleNudge('left')} title={`Nudge Left (${nudgeAmount}ft)`} className="flex items-center justify-center p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors"><ArrowLeftIcon /></button>
                            <div className="flex items-center justify-center text-slate-400 dark:text-slate-500" title="Move room"><DragHandleIcon /></div>
                            <button onClick={() => handleNudge('right')} title={`Nudge Right (${nudgeAmount}ft)`} className="flex items-center justify-center p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors"><ArrowRightIcon /></button>
                            <div></div>
                            <button onClick={() => handleNudge('down')} title={`Nudge Down (${nudgeAmount}ft)`} className="flex items-center justify-center p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors"><ArrowDownIcon /></button>
                            <div></div>
                        </div>
                    </div>
                     <div className="p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex flex-col items-center justify-center">
                         <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rotation</label>
                         <button onClick={handleRotate} title="Rotate Room 90°" className="flex items-center justify-center p-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full transition-colors aspect-square">
                           <RotateIcon/>
                         </button>
                         <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">{room.rotation}°</span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Features</h3>
                 <div className="relative" ref={featureMenuRef}>
                    <button
                        onClick={() => setIsFeatureMenuOpen(!isFeatureMenuOpen)}
                        className="flex w-full items-center justify-center space-x-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md text-sm transition-colors"
                    >
                        <PlusIcon /> <span>Add Feature</span> <ChevronDownIcon />
                    </button>
                    {isFeatureMenuOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 shadow-lg rounded-md border border-slate-200 dark:border-slate-600">
                           <ul className="py-1 text-sm text-slate-700 dark:text-slate-200">
                                <li className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase">Doors</li>
                                <FeatureMenuItem icon={<DoorIcon />} text="Standard Door" onClick={() => handleAddFeature(FeatureType.Door)} />
                                <FeatureMenuItem icon={<DoorIcon />} text="Sliding Door" onClick={() => handleAddFeature(FeatureType.SlidingDoor)} />
                                <FeatureMenuItem icon={<DoorIcon />} text="French Door" onClick={() => handleAddFeature(FeatureType.FrenchDoor)} />
                                <FeatureMenuItem icon={<DoorIcon />} text="Garage Door" onClick={() => handleAddFeature(FeatureType.GarageDoor)} />
                                <div className="my-1 h-px bg-slate-100 dark:bg-slate-600"></div>
                                <li className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase">Other</li>
                                <FeatureMenuItem icon={<WindowIcon />} text="Window" onClick={() => handleAddFeature(FeatureType.Window)} />
                                <FeatureMenuItem icon={<OutletIcon />} text="Outlet" onClick={() => handleAddFeature(FeatureType.Outlet)} />
                           </ul>
                        </div>
                    )}
                </div>
                <div className="space-y-2 mt-3">
                    {room.features.filter(f => f.type !== FeatureType.Opening).map(feature => (
                        <div key={feature.id} className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                             <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold capitalize text-slate-600 dark:text-slate-300 text-sm">{feature.type.replace(/_/g, ' ')}</p>
                                <button onClick={() => handleRemoveFeature(feature.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 text-xs font-bold">REMOVE</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                               <div>
                                  <label className="text-xs text-slate-500 dark:text-slate-400">Wall</label>
                                  <select value={feature.wall} onChange={e => handleUpdateFeature({...feature, wall: e.target.value as Wall})}>
                                    <option value="top">Top</option>
                                    <option value="bottom">Bottom</option>
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                  </select>
                               </div>
                               <div>
                                  <label className="text-xs text-slate-500 dark:text-slate-400">Offset ({feature.offset.toFixed(0)}%)</label>
                                  <div className="h-5 flex items-center mt-1">
                                      <input type="range" min="0" max="100" value={feature.offset} onChange={e => handleUpdateFeature({...feature, offset: parseInt(e.target.value)})} className="w-full"/>
                                  </div>
                               </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div>
                <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Pets</h3>
                <div className="space-y-2">
                    {(room.pets || []).map(pet => (
                        <div key={pet.id} className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <p className="font-semibold capitalize text-slate-600 dark:text-slate-300 text-sm">{pet.name} <span className="text-xs text-slate-500 dark:text-slate-400">({pet.type})</span></p>
                            <button onClick={() => handleDeletePet(pet.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 text-xs font-bold">REMOVE</button>
                        </div>
                    ))}
                    {(!room.pets || room.pets.length === 0) && !isPetFormVisible && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">This room has no pets.</p>
                    )}
                </div>
                
                {isPetFormVisible ? (
                    <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg space-y-3 animate-fade-in">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Add a New Pet</h4>
                        <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400">Pet Name</label>
                            <input type="text" value={newPetName} onChange={(e) => setNewPetName(e.target.value)} placeholder="e.g., Fido" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400">Pet Type</label>
                            <select value={newPetType} onChange={e => setNewPetType(e.target.value as PetType)}>
                                {PET_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={handleAddPet} className="flex-1 px-3 py-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded-md text-xs font-medium transition-colors">Confirm Add</button>
                            <button onClick={() => setIsPetFormVisible(false)} className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md text-xs transition-colors">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsPetFormVisible(true)} className="w-full mt-3 flex items-center justify-center space-x-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md text-sm transition-colors">
                        <PlusIcon/> <span>Add Pet</span>
                    </button>
                )}
            </div>

             {adjacentRooms.length > 0 && (
                 <div>
                    <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Adjacency</h3>
                     <div className="space-y-2">
                        {adjacentRooms.map(adjData => (
                           <div key={adjData.adjacentRoom.id} className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="text-sm">
                                    <p className="font-semibold text-slate-600 dark:text-slate-300">{adjData.adjacentRoom.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Shares {(adjData.segment[1] - adjData.segment[0]).toFixed(1)}ft on your <span className="capitalize">{adjData.wallOnCurrent}</span> wall.</p>
                                </div>
                                <button onClick={() => handleCreateOpening(adjData)} title="Create a full opening between these rooms" className="flex items-center space-x-2 px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md text-sm transition-colors text-slate-700 dark:text-slate-200">
                                    <OpeningIcon />
                                    <span>Opening</span>
                                </button>
                           </div>
                        ))}
                     </div>
                 </div>
            )}
            
            <div>
                <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Cost Estimation</h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Flooring ($/sqft)</label>
                            <input type="number" name="flooring" value={room.costEstimates?.flooring ?? ''} onChange={handleCostEstimateChange} placeholder="e.g., 8.50" />
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Est. Total</p>
                             <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">${((room.costEstimates?.flooring || 0) * roomArea).toFixed(2)}</p>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Paint ($/sqft)</label>
                            <input type="number" name="paint" value={room.costEstimates?.paint ?? ''} onChange={handleCostEstimateChange} placeholder="e.g., 2.00" />
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Est. Total</p>
                             <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">${((room.costEstimates?.paint || 0) * roomArea).toFixed(2)}</p>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Labor ($/sqft)</label>
                            <input type="number" name="labor" value={room.costEstimates?.labor ?? ''} onChange={handleCostEstimateChange} placeholder="e.g., 5.00" />
                        </div>
                         <div className="text-right">
                             <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Est. Total</p>
                             <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">${((room.costEstimates?.labor || 0) * roomArea).toFixed(2)}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onGetRegionalCosts(room.id)}
                        disabled={isAiLoading === `costs-${room.id}`}
                        className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80 transition-colors disabled:opacity-50"
                    >
                       {isAiLoading === `costs-${room.id}` ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Searching...
                            </>
                        ) : (
                           <> <SearchIcon /> <span>Get Regional Averages</span></>
                        )}
                    </button>
                </div>
            </div>

             <div>
                <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">AI Tools</h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <textarea 
                        name="description"
                        rows={5}
                        value={room.description || ''}
                        onChange={handleInputChange}
                        placeholder="Click 'Generate Description' to have the AI analyze this room, or write your own notes here."
                        className="w-full bg-transparent p-0 border-0 focus:ring-0 resize-none dark:placeholder-slate-500"
                    />
                     <button
                        onClick={() => onGenerateDescription(room.id)}
                        disabled={isAiLoading === `description-${room.id}`}
                        className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/80 transition-colors disabled:opacity-50"
                    >
                        {isAiLoading === `description-${room.id}` ? (
                             <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <MagicWandIcon />
                                <span>Generate Description</span>
                            </>
                        )}
                    </button>
                </div>
            </div>


             {room.furniture.length > 0 && (
                <div>
                    <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Furniture</h3>
                    <div className="space-y-3">
                        {room.furniture.map(item => (
                            <FurnitureItemEditor 
                                key={item.id}
                                furniture={item}
                                onUpdate={handleUpdateFurniture}
                                onDelete={() => handleDeleteFurniture(item.id)}
                            />
                        ))}
                    </div>
                </div>
            )}


            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onGenerateLayout(room.id)}
                        disabled={!!isAiLoading}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 dark:disabled:bg-green-800 disabled:cursor-not-allowed"
                    >
                        {isAiLoading === `furniture-${room.id}` ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <SparklesIcon />
                        )}
                        <span className="truncate">AI Furniture</span>
                    </button>
                     <button
                        onClick={() => onGenerateVisualization(room.id)}
                        disabled={!!isAiLoading}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                        {isAiLoading === `visualize-${room.id}` ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <ImageIcon />
                        )}
                        <span className="truncate">Visualize AI</span>
                    </button>
                </div>
                 <button
                    onClick={() => onDelete(room.id)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900/80 transition-colors"
                >
                    <TrashIcon />
                    <span>Delete Room</span>
                </button>
            </div>
        </div>
    );
};

const FeatureMenuItem: React.FC<{icon: React.ReactNode, text: string, onClick: () => void}> = ({ icon, text, onClick }) => (
    <li>
        <button onClick={onClick} className="w-full text-left flex items-center space-x-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600">
            {icon}
            <span>{text}</span>
        </button>
    </li>
);

interface FurnitureItemEditorProps {
    furniture: Furniture;
    onUpdate: (furniture: Furniture) => void;
    onDelete: () => void;
}

const FurnitureItemEditor: React.FC<FurnitureItemEditorProps> = ({ furniture, onUpdate, onDelete }) => {
    
    const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({
            ...furniture,
            dimensions: { ...furniture.dimensions, [e.target.name]: parseFloat(e.target.value) || 0 }
        });
    };

    const handleRotate = () => {
        const newRotation = (furniture.rotation + 90) % 360;
        onUpdate({ ...furniture, rotation: newRotation as Furniture['rotation'] });
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2">
                <p className="font-semibold capitalize text-slate-700 dark:text-slate-200 text-sm truncate">{furniture.name.replace(/_/g, ' ')}</p>
                <button onClick={onDelete} className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"><TrashIcon/></button>
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Width (ft)</label>
                    <input type="number" name="width" value={furniture.dimensions.width} onChange={handleDimensionChange} step="0.1" />
                </div>
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Length (ft)</label>
                    <input type="number" name="length" value={furniture.dimensions.length} onChange={handleDimensionChange} step="0.1" />
                </div>
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Color</label>
                    <input 
                        type="color" 
                        value={furniture.color || DEFAULT_FURNITURE_COLOR} 
                        onChange={e => onUpdate({ ...furniture, color: e.target.value })}
                        className="mt-1 w-full h-8 p-0 bg-transparent border-none rounded-md cursor-pointer"
                        title="Change furniture color"
                    />
                </div>
                 <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Rotate</label>
                    <button onClick={handleRotate} className="mt-1 w-full h-8 flex items-center justify-center p-1 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors">
                        <RotateIcon/> <span className="text-xs ml-1">{furniture.rotation}°</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Sidebar;