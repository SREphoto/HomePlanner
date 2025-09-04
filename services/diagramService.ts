import { Room, FeatureType } from '../types';
import { PIXELS_PER_FOOT } from '../constants';

const SCALE_FACTOR_X = 2; // characters per foot horizontally
const SCALE_FACTOR_Y = 1; // characters per foot vertically

const generateSingleFloorDiagram = (rooms: Room[]): string => {
    if (rooms.length === 0) {
        return "No rooms on this floor.";
    }

    // Determine grid boundaries in feet
    const minXFt = Math.min(...rooms.map(r => r.position.x / PIXELS_PER_FOOT));
    const minYFt = Math.min(...rooms.map(r => r.position.y / PIXELS_PER_FOOT));
    const maxXFt = Math.max(...rooms.map(r => (r.position.x / PIXELS_PER_FOOT) + r.dimensions.width));
    const maxYFt = Math.max(...rooms.map(r => (r.position.y / PIXELS_PER_FOOT) + r.dimensions.length));

    const gridWidth = Math.ceil((maxXFt - minXFt) * SCALE_FACTOR_X);
    const gridHeight = Math.ceil((maxYFt - minYFt) * SCALE_FACTOR_Y);
    
    const PADDING = 1;
    const grid = Array(gridHeight + PADDING * 2).fill(null).map(() => Array(gridWidth + PADDING * 2).fill(' '));

    const offsetX = -minXFt * SCALE_FACTOR_X + PADDING;
    const offsetY = -minYFt * SCALE_FACTOR_Y + PADDING;

    // Draw room borders
    for (const room of rooms) {
        const x = Math.round(room.position.x / PIXELS_PER_FOOT * SCALE_FACTOR_X + offsetX);
        const y = Math.round(room.position.y / PIXELS_PER_FOOT * SCALE_FACTOR_Y + offsetY);
        const w = Math.round(room.dimensions.width * SCALE_FACTOR_X);
        const h = Math.round(room.dimensions.length * SCALE_FACTOR_Y);

        for (let j = y; j < y + h; j++) {
            for (let i = x; i < x + w; i++) {
                if (j < 0 || j >= grid.length || i < 0 || i >= grid[0].length) continue;
                
                const isTop = j === y;
                const isBottom = j === y + h - 1;
                const isLeft = i === x;
                const isRight = i === x + w - 1;

                let char = ' ';
                if (isTop && isLeft || isTop && isRight || isBottom && isLeft || isBottom && isRight) {
                    char = '+';
                } else if (isTop || isBottom) {
                    char = '-';
                } else if (isLeft || isRight) {
                    char = '|';
                }

                if (char !== ' ') {
                    const existing = grid[j][i];
                    if (existing !== ' ' && existing !== char && (existing === '|' || existing === '-')) {
                        grid[j][i] = '+';
                    } else if (existing === ' ') {
                        grid[j][i] = char;
                    }
                }
            }
        }
    }

    // Draw features on walls
    for (const room of rooms) {
        const x = Math.round(room.position.x / PIXELS_PER_FOOT * SCALE_FACTOR_X + offsetX);
        const y = Math.round(room.position.y / PIXELS_PER_FOOT * SCALE_FACTOR_Y + offsetY);
        const w = Math.round(room.dimensions.width * SCALE_FACTOR_X);
        const h = Math.round(room.dimensions.length * SCALE_FACTOR_Y);

        for (const feature of room.features) {
            let char = '?';
            switch (feature.type) {
                case FeatureType.Door: char = 'D'; break;
                case FeatureType.Window: char = 'W'; break;
                case FeatureType.Opening: char = '='; break;
                default: continue; // Skip outlets etc.
            }
            
            const offset = (feature.offset / 100);
            
            try {
                if (feature.wall === 'top') {
                    const featX = x + Math.round(w * offset);
                    if (grid[y][featX] === '-') grid[y][featX] = char;
                } else if (feature.wall === 'bottom') {
                    const featX = x + Math.round(w * offset);
                    if (grid[y + h - 1][featX] === '-') grid[y + h - 1][featX] = char;
                } else if (feature.wall === 'left') {
                    const featY = y + Math.round(h * offset);
                    if (grid[featY][x] === '|') grid[featY][x] = char;
                } else if (feature.wall === 'right') {
                    const featY = y + Math.round(h * offset);
                    if (grid[featY][x + w - 1] === '|') grid[featY][x + w - 1] = char;
                }
            } catch (e) {
                // Ignore features that might draw out of bounds
            }
        }
    }

    // Write room names and dimensions
    for (const room of rooms) {
        const x = Math.round(room.position.x / PIXELS_PER_FOOT * SCALE_FACTOR_X + offsetX);
        const y = Math.round(room.position.y / PIXELS_PER_FOOT * SCALE_FACTOR_Y + offsetY);
        const w = Math.round(room.dimensions.width * SCALE_FACTOR_X);
        const h = Math.round(room.dimensions.length * SCALE_FACTOR_Y);
        
        const line1 = room.name;
        const line2 = `${room.dimensions.width}'x${room.dimensions.length}'`;

        const centerX = x + Math.floor(w / 2);
        const centerY = y + Math.floor(h / 2);
        
        if (h > 2 && w > line1.length) {
            const startX = centerX - Math.floor(line1.length / 2);
            for (let i = 0; i < line1.length; i++) {
                if(grid[centerY - 1][startX + i] === ' '){
                    grid[centerY - 1][startX + i] = line1[i];
                }
            }
        }
        
        if (h > 2 && w > line2.length) {
            const startX = centerX - Math.floor(line2.length / 2);
             for (let i = 0; i < line2.length; i++) {
                if(grid[centerY][startX + i] === ' '){
                    grid[centerY][startX + i] = line2[i];
                }
            }
        }
    }
    
    const trimmedGrid = grid
        .map(row => row.join('').trimEnd())
        .filter(row => row.trim().length > 0);

    return trimmedGrid.join('\n');
};

export const generateTextDiagram = (allRooms: Room[]): string => {
    if (allRooms.length === 0) return "This project is empty.";

    const roomsByFloor: { [floor: number]: Room[] } = {};
    for (const room of allRooms) {
        const floor = room.floor || 1;
        if (!roomsByFloor[floor]) {
            roomsByFloor[floor] = [];
        }
        roomsByFloor[floor].push(room);
    }
    
    const sortedFloors = Object.keys(roomsByFloor).map(Number).sort((a, b) => a - b);
    let fullDiagram = '';

    for (const floor of sortedFloors) {
        fullDiagram += `--- Floor ${floor} Diagram ---\n\n`;
        const diagramForFloor = generateSingleFloorDiagram(roomsByFloor[floor]);
        fullDiagram += diagramForFloor + '\n\n';
    }

    return fullDiagram.trim();
};