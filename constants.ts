
import { RoomType } from "./types";

// The number of pixels that represent one foot in the blueprint.
export const PIXELS_PER_FOOT = 15;

// The increment for grid snapping, in feet.
export const GRID_SNAP_FEET = 0.5;

// Default colors for each room type for visual organization.
export const ROOM_COLORS: Record<RoomType, string> = {
    [RoomType.LivingRoom]: '#fef08a', // yellow-200
    [RoomType.Bedroom]: '#bfdbfe', // blue-200
    [RoomType.Kitchen]: '#fed7aa', // orange-200
    [RoomType.Bathroom]: '#bbf7d0', // green-200
    [RoomType.DiningRoom]: '#fecaca', // red-200
    [RoomType.Office]: '#e0e7ff', // indigo-100
    [RoomType.Garage]: '#d1d5db', // gray-300
    [RoomType.Stairs]: '#e5e7eb', // gray-200
    [RoomType.Hallway]: '#f3f4f6', // gray-100
    [RoomType.Custom]: '#e9d5ff', // purple-200
};

export const DEFAULT_WALL_COLOR = '#E2E8F0'; // gray-200
export const DEFAULT_FURNITURE_COLOR = '#A0522D'; // saddlebrown
