
import React, { useEffect, useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { Room, Furniture, Feature, FeatureType, Wall, Vector2, ItemTypes, RoomType, InteractionMode, Pet, PetType } from '../types';
import { PIXELS_PER_FOOT, GRID_SNAP_FEET, DEFAULT_FURNITURE_COLOR, DEFAULT_WALL_COLOR } from '../constants';
import OutletIcon from './icons/OutletIcon';
import DragHandleIcon from './icons/DragHandleIcon';
import ContextMenu from './ContextMenu';
import './Blueprint.css';

const WALL_HEIGHT_PIXELS = 70;

interface BlueprintProps {
  rooms: Room[];
  allRooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (id: string | null) => void;
  onUpdateRoom: (room: Room) => void;
  onFinalizeUpdate: (room: Room) => void;
  onAddRoom: (room: Omit<Room, 'id' | 'floor' | 'color'>) => void;
  onDeleteRoom: (roomId: string) => void;
  onGenerateLayout: (roomId: string) => void;
  viewMode: '2d' | '3d';
  isSnapEnabled: boolean;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  currentFloor: number;
  sunlight: { enabled: boolean; azimuth: number };
}

const Blueprint: React.FC<BlueprintProps> = ({
  rooms, allRooms, onSelectRoom, selectedRoomId, onUpdateRoom, onFinalizeUpdate, onAddRoom,
  onDeleteRoom, onGenerateLayout, viewMode, isSnapEnabled, interactionMode, setInteractionMode, currentFloor, sunlight
}) => {

  const [drawStartPoint, setDrawStartPoint] = useState<Vector2 | null>(null);
  const [drawPreview, setDrawPreview] = useState<Omit<Room, 'id' | 'floor' | 'color'> | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, roomId: string } | null>(null);

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.ROOM,
    drop: (item: Room, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;

      const gridSnapPx = PIXELS_PER_FOOT * GRID_SNAP_FEET;

      let newX = item.position.x + delta.x;
      let newY = item.position.y + delta.y;

      if (isSnapEnabled) {
        newX = Math.round(newX / gridSnapPx) * gridSnapPx;
        newY = Math.round(newY / gridSnapPx) * gridSnapPx;
      }

      onFinalizeUpdate({ ...item, position: { x: Math.round(newX), y: Math.round(newY) } });
      return undefined;
    }
  }), [isSnapEnabled, onFinalizeUpdate]);

  const PADDING = 200;
  const blueprintWidth = rooms.length > 0
    ? rooms.reduce((max, r) => Math.max(max, r.position.x + r.dimensions.width * PIXELS_PER_FOOT), 0) + PADDING
    : 500;
  const blueprintHeight = rooms.length > 0
    ? rooms.reduce((max, r) => Math.max(max, r.position.y + r.dimensions.length * PIXELS_PER_FOOT), 0) + PADDING
    : 500;

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const getBlueprintCoords = (e: React.MouseEvent): Vector2 => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollLeft = e.currentTarget.parentElement!.scrollLeft;
    const scrollTop = e.currentTarget.parentElement!.scrollTop;
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top + scrollTop;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (interactionMode !== 'draw_hallway') return;
    e.preventDefault();
    e.stopPropagation();
    setDrawStartPoint(getBlueprintCoords(e));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawStartPoint) return;
    e.preventDefault();
    e.stopPropagation();
    const currentPoint = getBlueprintCoords(e);
    const x1 = drawStartPoint.x;
    const y1 = drawStartPoint.y;
    const x2 = currentPoint.x;
    const y2 = currentPoint.y;

    setDrawPreview({
      name: 'Hallway',
      type: RoomType.Hallway,
      position: { x: Math.min(x1, x2), y: Math.min(y1, y2) },
      dimensions: {
        width: Math.abs(x2 - x1) / PIXELS_PER_FOOT,
        length: Math.abs(y2 - y1) / PIXELS_PER_FOOT
      },
      rotation: 0,
      features: [],
      furniture: [],
      pets: [],
      connections: [],
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawStartPoint || !drawPreview) return;
    e.preventDefault();
    e.stopPropagation();

    const gridSnapPx = PIXELS_PER_FOOT * GRID_SNAP_FEET;

    const snappedX = Math.round(drawPreview.position.x / gridSnapPx) * gridSnapPx;
    const snappedY = Math.round(drawPreview.position.y / gridSnapPx) * gridSnapPx;
    const snappedWidthPx = Math.round((drawPreview.dimensions.width * PIXELS_PER_FOOT) / gridSnapPx) * gridSnapPx;
    const snappedLengthPx = Math.round((drawPreview.dimensions.length * PIXELS_PER_FOOT) / gridSnapPx) * gridSnapPx;

    if (snappedWidthPx > gridSnapPx / 2 && snappedLengthPx > gridSnapPx / 2) {
      onAddRoom({
        ...drawPreview,
        position: { x: snappedX, y: snappedY },
        dimensions: {
          width: snappedWidthPx / PIXELS_PER_FOOT,
          length: snappedLengthPx / PIXELS_PER_FOOT
        }
      });
    }

    setDrawStartPoint(null);
    setDrawPreview(null);
    setInteractionMode('select');
  };

  const gridColor = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)';
  const gridSnapPx = PIXELS_PER_FOOT * GRID_SNAP_FEET;
  const gridStyle = viewMode === '2d' ? {
    '--grid-color': gridColor,
    '--grid-size': `${gridSnapPx}px`
  } as React.CSSProperties : {};
  const gridClass = viewMode === '2d' ? 'blueprint-grid-2d' : '';

  return (
    <div
      className="w-full h-full p-4 bg-slate-200 dark:bg-slate-900 relative transition-colors overflow-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && interactionMode === 'select') {
          onSelectRoom(null);
        }
        setContextMenu(null);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={(node) => { drop(node) }}
        className={`transition-transform duration-500 ${gridClass}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          width: `${blueprintWidth}px`,
          height: `${blueprintHeight}px`,
          ...gridStyle,
          transform: viewMode === '3d' ? 'perspective(2000px) rotateX(50deg) rotateZ(-45deg)' : 'none',
          transformStyle: 'preserve-3d',
          cursor: interactionMode === 'draw_hallway' ? 'crosshair' : 'default',
        }}
      >
        {sunlight.enabled && viewMode === '2d' && (
          <SunlightOverlay rooms={rooms} azimuth={sunlight.azimuth} />
        )}
        {rooms.map(room => (
          <RoomComponent
            key={room.id}
            room={room}
            isSelected={room.id === selectedRoomId}
            onSelect={onSelectRoom}
            onUpdateRoom={onUpdateRoom}
            onFinalizeUpdate={onFinalizeUpdate}
            viewMode={viewMode}
            isDarkMode={isDarkMode}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, roomId: room.id });
            }}
          />
        ))}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            actions={[
              { label: 'Generate Furniture', action: () => onGenerateLayout(contextMenu.roomId) },
              { label: 'Delete Room', action: () => onDeleteRoom(contextMenu.roomId) },
            ]}
          />
        )}
        {drawPreview && (
          <div
            className="draw-preview"
            style={{
              left: drawPreview.position.x,
              top: drawPreview.position.y,
              width: drawPreview.dimensions.width * PIXELS_PER_FOOT,
              height: drawPreview.dimensions.length * PIXELS_PER_FOOT,
            }}
          />
        )}
      </div>
    </div>
  );
};

interface RoomComponentProps {
  room: Room;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdateRoom: (room: Room) => void;
  onFinalizeUpdate: (room: Room) => void;
  viewMode: '2d' | '3d';
  isDarkMode: boolean;
  onContextMenu: (event: React.MouseEvent) => void;
}


interface ResizeHandleProps {
  position: 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
  room: Room;
  onUpdateRoom: (room: Room) => void;
  onFinalizeUpdate: (room: Room) => void;
}

const useResize = (
  room: Room,
  position: ResizeHandleProps['position'],
  onUpdateRoom: (room: Room) => void,
  onFinalizeUpdate: (room: Room) => void
) => {
  const [, drag] = useDrag(() => ({
    type: `${ItemTypes.ROOM}_resize_${position}`,
    item: { id: room.id, ...room },
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;
      onFinalizeUpdate(item);
    },
    collect: monitor => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (monitor.isDragging() && delta) {
        let newX = room.position.x;
        let newY = room.position.y;
        let newWidth = room.dimensions.width;
        let newLength = room.dimensions.length;

        if (position.includes('left')) {
          newX += delta.x;
          newWidth -= delta.x / PIXELS_PER_FOOT;
        }
        if (position.includes('right')) {
          newWidth += delta.x / PIXELS_PER_FOOT;
        }
        if (position.includes('top')) {
          newY += delta.y;
          newLength -= delta.y / PIXELS_PER_FOOT;
        }
        if (position.includes('bottom')) {
          newLength += delta.y / PIXELS_PER_FOOT;
        }

        const MIN_SIZE_FEET = 2;
        if (newWidth < MIN_SIZE_FEET) {
          newWidth = MIN_SIZE_FEET;
          if (position.includes('left')) newX = room.position.x + (room.dimensions.width - MIN_SIZE_FEET) * PIXELS_PER_FOOT;
        }
        if (newLength < MIN_SIZE_FEET) {
          newLength = MIN_SIZE_FEET;
          if (position.includes('top')) newY = room.position.y + (room.dimensions.length - MIN_SIZE_FEET) * PIXELS_PER_FOOT;
        }

        onUpdateRoom({
          ...room,
          position: { x: newX, y: newY },
          dimensions: { width: newWidth, length: newLength },
        });
      }
    },
  }), [room, position, onUpdateRoom, onFinalizeUpdate]);

  return drag;
};

const ResizeHandle: React.FC<ResizeHandleProps> = ({ position, room, onUpdateRoom, onFinalizeUpdate }) => {
  let positionClass = '';
  let cursorClass = '';
  const drag = useResize(room, position, onUpdateRoom, onFinalizeUpdate);

  switch (position) {
    case 'top-left': positionClass = '-top-1.5 -left-1.5'; cursorClass = 'resize-handle-nwse'; break;
    case 'top': positionClass = '-top-1.5 left-1/2 -ml-1.5'; cursorClass = 'resize-handle-ns'; break;
    case 'top-right': positionClass = '-top-1.5 -right-1.5'; cursorClass = 'resize-handle-nesw'; break;
    case 'left': positionClass = 'top-1/2 -mt-1.5 -left-1.5'; cursorClass = 'resize-handle-ew'; break;
    case 'right': positionClass = 'top-1/2 -mt-1.5 -right-1.5'; cursorClass = 'resize-handle-ew'; break;
    case 'bottom-left': positionClass = '-bottom-1.5 -left-1.5'; cursorClass = 'resize-handle-nesw'; break;
    case 'bottom': positionClass = '-bottom-1.5 left-1/2 -ml-1.5'; cursorClass = 'resize-handle-ns'; break;
    case 'bottom-right': positionClass = '-bottom-1.5 -right-1.5'; cursorClass = 'resize-handle-nwse'; break;
  }

  return <div ref={drag as any} className={`resize-handle ${positionClass} ${cursorClass}`} onClick={e => e.stopPropagation()} />;
};

const RoomComponent: React.FC<RoomComponentProps> = ({ room, isSelected, onSelect, onUpdateRoom, onFinalizeUpdate, viewMode, isDarkMode, onContextMenu }) => {
  const roomWidthPx = room.dimensions.width * PIXELS_PER_FOOT;
  const roomLengthPx = room.dimensions.length * PIXELS_PER_FOOT;

  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: ItemTypes.ROOM,
    item: room,
    // Update position on drag for immediate feedback without polluting history
    collect: monitor => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (monitor.isDragging() && delta) {
        onUpdateRoom({ ...room, position: { x: room.position.x + delta.x, y: room.position.y + delta.y } });
      }
      return {
        isDragging: !!monitor.isDragging(),
      }
    },
    end: (item, monitor) => {
      // This is handled by the Blueprint's drop handler, but could be used
      // if we needed to finalize here. The drop on the container is better for snapping.
    }
  }), [room, onUpdateRoom]);

  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.FURNITURE, ItemTypes.PET],
  }), [room, onFinalizeUpdate]);

  const hasOpening = (wall: Wall) => {
    return room.features.some(f => f.wall === wall && f.type === FeatureType.Opening && f.size > room.dimensions[wall === 'top' || wall === 'bottom' ? 'width' : 'length'] * 0.8);
  }

  // In 3D mode, if the room is selected, we want to see inside.
  // This calculates if a wall is "front-facing" to the camera to hide it.
  const isFrontFacing = (wall: Wall) => {
    if (!isSelected || viewMode !== '3d') return false;

    // This is a simplification based on the fixed 3D camera angle.
    // The camera looks from bottom-right. So bottom and right walls are "front".
    const rotation = room.rotation;
    if (rotation === 0) return wall === 'bottom' || wall === 'right';
    if (rotation === 90) return wall === 'left' || wall === 'bottom';
    if (rotation === 180) return wall === 'top' || wall === 'left';
    if (rotation === 270) return wall === 'right' || wall === 'top';
    return false;
  }

  const renderFeature = (feature: Feature) => {
    if (viewMode === '3d' && feature.type !== FeatureType.Outlet) return null;

    const style: React.CSSProperties = { position: 'absolute', display: 'flex', justifyContent: 'space-around', alignItems: 'center' };

    const sizePx = feature.size * PIXELS_PER_FOOT;
    const offsetPx = (feature.offset / 100);

    let featureClass = '';
    let children = null;

    switch (feature.type) {
      case FeatureType.Door: featureClass = 'bg-[#a0522d]'; break;
      case FeatureType.SlidingDoor:
        featureClass = 'bg-transparent border-x-2 border-[#a0522d]/80';
        children = (
          <div className="w-1/2 h-full absolute top-0 left-0 bg-[#a0522d]/50"></div>
        );
        break;
      case FeatureType.FrenchDoor:
        featureClass = 'bg-transparent';
        children = (
          <>
            <div className="french-door-panel"></div>
            <div className="french-door-panel"></div>
          </>
        );
        break;
      case FeatureType.GarageDoor:
        featureClass = 'bg-[#c0c0c0] dark:bg-[#5a5a5a]';
        children = (
          <div className="w-full h-full flex flex-col justify-around py-0.5">
            <div className="h-[1px] bg-slate-500/50 dark:bg-slate-400/50"></div>
            <div className="h-[1px] bg-slate-500/50 dark:bg-slate-400/50"></div>
            <div className="h-[1px] bg-slate-500/50 dark:bg-slate-400/50"></div>
          </div>
        );
        break;
      case FeatureType.Window: featureClass = 'bg-[#87ceeb]'; break;
      case FeatureType.Opening: featureClass = 'bg-slate-200/80 dark:bg-slate-900/80 border-t-2 border-b-2 border-dashed border-slate-400/50 dark:border-slate-600/50'; break;
    }

    switch (feature.wall) {
      case 'top':
        style.top = '-2px'; style.left = `calc(${offsetPx * 100}% - ${sizePx / 2}px)`; style.width = `${sizePx}px`; style.height = `4px`;
        break;
      case 'bottom':
        style.bottom = '-2px'; style.left = `calc(${offsetPx * 100}% - ${sizePx / 2}px)`; style.width = `${sizePx}px`; style.height = `4px`;
        break;
      case 'left':
        style.left = '-2px'; style.top = `calc(${offsetPx * 100}% - ${sizePx / 2}px)`; style.height = `${sizePx}px`; style.width = `4px`;
        style.flexDirection = 'column';
        break;
      case 'right':
        style.right = '-2px'; style.top = `calc(${offsetPx * 100}% - ${sizePx / 2}px)`; style.height = `${sizePx}px`; style.width = `4px`;
        style.flexDirection = 'column';
        break;
    }

    if (feature.type === FeatureType.Outlet) {
      const iconStyle: React.CSSProperties = {};
      if (feature.wall === 'top') { iconStyle.left = `${offsetPx * 100}%`; }
      if (feature.wall === 'bottom') { iconStyle.left = `${offsetPx * 100}%`; }
      if (feature.wall === 'left') { iconStyle.top = `${offsetPx * 100}%`; }
      if (feature.wall === 'right') { iconStyle.top = `${offsetPx * 100}%`; }

      const outletClass = `feature-outlet-${feature.wall}`;
      return <div key={feature.id} style={iconStyle} className={`feature-outlet-container ${outletClass} text-slate-600 dark:text-slate-400 z-10`}><OutletIcon size={12} /></div>
    }

    return <div key={feature.id} style={style} className={`feature-item ${featureClass}`}>{children}</div>
  }

  const defaultBg = isDarkMode ? 'rgba(51, 65, 85, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  // Use 'B3' for ~70% alpha which works well for both light and dark backgrounds
  const roomColorWithAlpha = room.color ? `${room.color}B3` : defaultBg;
  const wallColor = room.wallColor || DEFAULT_WALL_COLOR;
  const wall3DStyle = { backgroundColor: wallColor, transition: 'opacity 0.3s' };


  const textRotationStyle: React.CSSProperties = {
    transform: `rotate(-${room.rotation}deg)`,
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0
  };

  return (
    <div
      ref={(node) => { dragPreview(node) }}
      className="room-container"
      style={{
        left: room.position.x,
        top: room.position.y,
        width: roomWidthPx,
        height: roomLengthPx,
        opacity: isDragging ? 0.7 : 1,
        transform: `rotate(${room.rotation}deg)`,
        zIndex: 10
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(room.id); }}
      onContextMenu={onContextMenu}
    >
      <div
        ref={(node) => { drop(node) }}
        className={`room-border w-full h-full backdrop-blur-sm transition-all duration-200 relative border-2 overflow-hidden ${isSelected ? 'shadow-2xl ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 ring-offset-slate-200 dark:ring-offset-slate-900 border-blue-500 dark:border-blue-400' : 'shadow-lg border-slate-300 dark:border-slate-600'}`}
        style={{
          backgroundColor: roomColorWithAlpha,
        }}
      >
        {room.type === RoomType.Stairs && viewMode === '2d' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="room-stairs-2d" />
          </div>
        )}
        {viewMode === '3d' && (
          <>
            <div className="wall-3d-side bg-slate-300 dark:bg-slate-800 absolute inset-0" style={{ transform: `translateZ(-${WALL_HEIGHT_PIXELS}px)` }}></div>

            {room.type === RoomType.Stairs ? (
              <div className="absolute inset-0 bg-slate-400 dark:bg-slate-600 room-stairs-3d"></div>
            ) : (
              <>
                {!hasOpening('top') && <div className="wall wall-3d-side" style={{ ...wall3DStyle, opacity: isFrontFacing('top') ? 0 : 1, width: roomWidthPx, height: WALL_HEIGHT_PIXELS, transform: `rotateX(90deg)` }}></div>}
                {!hasOpening('bottom') && <div className="wall wall-3d-side" style={{ ...wall3DStyle, opacity: isFrontFacing('bottom') ? 0 : 1, width: roomWidthPx, height: WALL_HEIGHT_PIXELS, transform: `rotateX(-90deg)`, transformOrigin: 'bottom' }}></div>}
                {!hasOpening('left') && <div className="wall wall-3d-side" style={{ ...wall3DStyle, opacity: isFrontFacing('left') ? 0 : 1, width: roomLengthPx, height: WALL_HEIGHT_PIXELS, transform: `rotateY(-90deg)`, transformOrigin: 'left' }}></div>}
                {!hasOpening('right') && <div className="wall wall-3d-side" style={{ ...wall3DStyle, opacity: isFrontFacing('right') ? 0 : 1, width: roomLengthPx, height: WALL_HEIGHT_PIXELS, transform: `rotateY(90deg)`, transformOrigin: 'right' }}></div>}
              </>
            )}
          </>
        )}

        {isSelected && viewMode === '2d' && (
          <div
            ref={(node) => { drag(node) }}
            className="absolute -top-4 -right-4 z-20 p-1 bg-white dark:bg-slate-600 rounded-full shadow-lg cursor-grab active:cursor-grabbing border-2 border-blue-500 dark:border-blue-400"
            onClick={(e) => e.stopPropagation()}
            title="Move Room"
          >
            <DragHandleIcon />
          </div>
        )}
        {isSelected && viewMode === '2d' && (
          <>
            <ResizeHandle position="top-left" room={room} onUpdateRoom={onUpdateRoom} onFinalizeUpdate={onFinalizeUpdate} />
            <ResizeHandle position="top" room={room} onUpdateRoom={onUpdateRoom} onFinalizeUpdate={onFinalizeUpdate} />
            <ResizeHandle position="top-right" room={room} onUpdateRoom={onUpdateRoom} onFinalizeUpdate={onFinalizeUpdate} />
            <ResizeHandle position="left" room={room} onUpdateRoom={onUpdateRoom} onFinalizeUpdate={onFinalizeUpdate} />
            <ResizeHandle position="right" room={room} onUpdateRoom={onUpdateRoom} onFinalizeUpdate={onFinalizeUpdate} />
            <ResizeHandle position="bottom-left" room={room} onUpdateRoom={onUpdateRoom} onFinalizeUpdate={onFinalizeUpdate} />
            <ResizeHandle position="bottom" room={room} onUpdateRoom={onUpdateRoom} onFinalizeUpdate={onFinalizeUpdate} />
            <ResizeHandle position="bottom-right" room={room} onUpdateRoom={onUpdateRoom} onFinalizeUpdate={onFinalizeUpdate} />
          </>
        )}
        {isSelected && viewMode === '3d' && (
          <div
            ref={(node) => { drag(node) }}
            className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
          ></div>
        )}

        <div style={textRotationStyle}>
          <div className="room-dimensions-text p-2 text-center select-none">
            <p className="font-bold text-slate-800 dark:text-slate-200">{room.name}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{room.dimensions.width}' x {room.dimensions.length}'</p>
          </div>
        </div>

        {room.features.map(f => renderFeature(f))}
        {room.furniture.map(item => (
          <FurnitureComponent key={item.id} furniture={item} viewMode={viewMode} onFinalizeUpdate={onFinalizeUpdate} room={room} />
        ))}
        {(room.pets || []).map(pet => (
          <PetComponent key={pet.id} pet={pet} viewMode={viewMode} onFinalizeUpdate={onFinalizeUpdate} room={room} />
        ))}
      </div>
    </div>
  );
}

interface FurnitureComponentProps {
  furniture: Furniture;
  viewMode: '2d' | '3d';
  onFinalizeUpdate: (room: Room) => void;
  room: Room;
}

const FurnitureComponent: React.FC<FurnitureComponentProps> = ({ furniture, viewMode, onFinalizeUpdate, room }) => {
  const furnitureWidthPx = furniture.dimensions.width * PIXELS_PER_FOOT;
  const furnitureLengthPx = furniture.dimensions.length * PIXELS_PER_FOOT;
  const furnitureHeightPx = 2 * PIXELS_PER_FOOT; // Assume furniture is 2ft high for 3d view

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FURNITURE,
    item: furniture,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;

      const newPosition = {
        x: item.position.x + delta.x / PIXELS_PER_FOOT,
        y: item.position.y + delta.y / PIXELS_PER_FOOT,
      };
      const updatedFurniture = { ...item, position: newPosition };
      const updatedRoom = {
        ...room,
        furniture: room.furniture.map(f => f.id === item.id ? updatedFurniture : f)
      };
      onFinalizeUpdate(updatedRoom);
    }
  }));

  const furnitureColor = furniture.color || DEFAULT_FURNITURE_COLOR;
  const furnitureDarkerColor = furniture.color ? `${furniture.color}E6` : '#8B4513'; // ~90% opacity or darker brown


  return (
    <div
      ref={(node) => { drag(node) }}
      style={{
        position: 'absolute',
        left: furniture.position.x * PIXELS_PER_FOOT,
        top: furniture.position.y * PIXELS_PER_FOOT,
        width: furnitureWidthPx,
        height: furnitureLengthPx,
        transform: `rotate(${furniture.rotation}deg) ${viewMode === '3d' ? `translateZ(1px)` : ''}`,
        opacity: isDragging ? 0.7 : 1,
        zIndex: 20,
      }}
      className="cursor-move shadow-md furniture-wrapper"
    >
      <div
        className="furniture-inner absolute inset-0 border-2 border-black/20 rounded-sm flex items-center justify-center"
        style={{ backgroundColor: furnitureColor }}
      >
        <div className="furniture-text-rotation" style={{ transform: `rotate(-${furniture.rotation}deg)` }}>
          <p className="furniture-label" style={{ writingMode: furnitureWidthPx < 40 ? 'vertical-rl' : 'horizontal-tb' }}>
            {furniture.name.replace(/_/g, ' ')}
          </p>
        </div>
      </div>
      {viewMode === '3d' && (
        <>
          <div className="furniture-3d-top" style={{ backgroundColor: furnitureDarkerColor, transform: `translateZ(-${furnitureHeightPx}px)` }}></div>
          <div className="wall-3d-side wall-3d-front" style={{ backgroundColor: `${furnitureDarkerColor}B3`, width: furnitureWidthPx, height: furnitureHeightPx }}></div>
          <div className="wall-3d-side wall-3d-back" style={{ backgroundColor: `${furnitureDarkerColor}B3`, width: furnitureWidthPx, height: furnitureHeightPx }}></div>
          <div className="wall-3d-side wall-3d-left" style={{ backgroundColor: `${furnitureDarkerColor}B3`, width: furnitureLengthPx, height: furnitureHeightPx }}></div>
          <div className="wall-3d-side wall-3d-right" style={{ backgroundColor: `${furnitureDarkerColor}B3`, width: furnitureLengthPx, height: furnitureHeightPx }}></div>
        </>
      )}
    </div>
  );
};

interface PetComponentProps {
  pet: Pet;
  viewMode: '2d' | '3d';
  onFinalizeUpdate: (room: Room) => void;
  room: Room;
}

const getPetEmoji = (type: PetType): string => {
  switch (type) {
    case PetType.Dog: return '🐕';
    case PetType.Cat: return '🐈';
    case PetType.Bird: return '🦜';
    case PetType.Fish: return '🐠';
    case PetType.SmallAnimal: return '🐹';
    default: return '🐾';
  }
}

const PetComponent: React.FC<PetComponentProps> = ({ pet, viewMode, onFinalizeUpdate, room }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PET,
    item: pet,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;

      const newPosition = {
        x: item.position.x + delta.x / PIXELS_PER_FOOT,
        y: item.position.y + delta.y / PIXELS_PER_FOOT,
      };
      const updatedPet = { ...item, position: newPosition };
      const updatedRoom = {
        ...room,
        pets: (room.pets || []).map(p => p.id === item.id ? updatedPet : p)
      };
      onFinalizeUpdate(updatedRoom);
    }
  }));

  return (
    <div
      ref={(node) => { drag(node); }}
      style={{
        left: pet.position.x * PIXELS_PER_FOOT,
        top: pet.position.y * PIXELS_PER_FOOT,
        transform: `translate(-50%, -50%) ${viewMode === '3d' ? `translateZ(1px)` : ''}`,
        opacity: isDragging ? 0.7 : 1,
      }}
      className="pet-container cursor-move"
      title={pet.name}
    >
      <div className="pet-emoji">
        {getPetEmoji(pet.type)}
      </div>
    </div>
  );
};


const SunlightOverlay: React.FC<{ rooms: Room[]; azimuth: number }> = ({ rooms, azimuth }) => {
  const lightRays: React.ReactNode[] = [];
  const LIGHT_RAY_LENGTH = 500; // a long distance in pixels

  const azimuthRad = (azimuth * Math.PI) / 180;
  // Vector pointing FROM the sun
  const sunVector = { x: Math.sin(azimuthRad), y: -Math.cos(azimuthRad) };

  rooms.forEach(room => {
    const roomRotationRad = (room.rotation * Math.PI) / 180;

    room.features.forEach(feature => {
      if (feature.type !== FeatureType.Window) return;

      const wallNormalVectors: Record<Wall, Vector2> = {
        top: { x: 0, y: 1 },
        bottom: { x: 0, y: -1 },
        left: { x: 1, y: 0 },
        right: { x: -1, y: 0 },
      };

      // Rotate wall normal by room rotation
      const normal = wallNormalVectors[feature.wall];
      const rotatedNormal = {
        x: normal.x * Math.cos(roomRotationRad) - normal.y * Math.sin(roomRotationRad),
        y: normal.x * Math.sin(roomRotationRad) + normal.y * Math.cos(roomRotationRad)
      };

      // Check if sun is shining on this wall (dot product > 0)
      const dotProduct = sunVector.x * rotatedNormal.x + sunVector.y * rotatedNormal.y;
      if (dotProduct <= 0) return;

      const windowSizePx = feature.size * PIXELS_PER_FOOT;
      const roomWidthPx = room.dimensions.width * PIXELS_PER_FOOT;
      const roomLengthPx = room.dimensions.length * PIXELS_PER_FOOT;

      // Find window's two endpoints in room's local coordinates
      let p1: Vector2, p2: Vector2;
      const offsetPx = (roomWidthPx * feature.offset) / 100; // for top/bottom
      const offsetPy = (roomLengthPx * feature.offset) / 100; // for left/right

      switch (feature.wall) {
        case 'top':
          p1 = { x: offsetPx - windowSizePx / 2, y: 0 };
          p2 = { x: offsetPx + windowSizePx / 2, y: 0 };
          break;
        case 'bottom':
          p1 = { x: offsetPx - windowSizePx / 2, y: roomLengthPx };
          p2 = { x: offsetPx + windowSizePx / 2, y: roomLengthPx };
          break;
        case 'left':
          p1 = { x: 0, y: offsetPy - windowSizePx / 2 };
          p2 = { x: 0, y: offsetPy + windowSizePx / 2 };
          break;
        case 'right':
          p1 = { x: roomWidthPx, y: offsetPy - windowSizePx / 2 };
          p2 = { x: roomWidthPx, y: offsetPy + windowSizePx / 2 };
          break;
      }

      // Rotate points by sun direction vector, NOT room rotation
      const projectedSunVector = {
        x: LIGHT_RAY_LENGTH * sunVector.x,
        y: LIGHT_RAY_LENGTH * sunVector.y
      };

      const p3 = { x: p1.x + projectedSunVector.x, y: p1.y + projectedSunVector.y };
      const p4 = { x: p2.x + projectedSunVector.x, y: p2.y + projectedSunVector.y };

      const polygonPoints = `${p1.x}px ${p1.y}px, ${p2.x}px ${p2.y}px, ${p4.x}px ${p4.y}px, ${p3.x}px ${p3.y}px`;

      lightRays.push(
        <div
          key={`${room.id}-${feature.id}`}
          className="light-ray-container"
          style={{
            left: room.position.x,
            top: room.position.y,
            width: roomWidthPx,
            height: roomLengthPx,
            transform: `rotate(${room.rotation}deg)`,
          }}
        >
          <div className="light-ray-inner" style={{
            clipPath: `polygon(${polygonPoints})`,
          }}></div>
        </div>
      );
    });
  });

  return <>{lightRays}</>;
};

export default Blueprint;