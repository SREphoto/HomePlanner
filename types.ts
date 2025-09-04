

export interface Vector2 {
  x: number;
  y: number;
}

export interface Dimension {
  width: number;
  length: number;
}

export enum FeatureType {
  Door = 'door',
  Window = 'window',
  Outlet = 'outlet',
  Opening = 'opening',
  SlidingDoor = 'sliding_door',
  FrenchDoor = 'french_door',
  GarageDoor = 'garage_door',
}

export type Wall = 'top' | 'bottom' | 'left' | 'right';

export interface Feature {
  id: string;
  type: FeatureType;
  wall: Wall;
  offset: number; // Percentage from the start of the wall (e.g., 50 for center)
  size: number; // width in feet
}

export enum RoomType {
  LivingRoom = 'Living Room',
  Bedroom = 'Bedroom',
  Kitchen = 'Kitchen',
  Bathroom = 'Bathroom',
  DiningRoom = 'Dining Room',
  Office = 'Office',
  Garage = 'Garage',
  Stairs = 'Stairs',
  Hallway = 'Hallway',
  Custom = 'Custom',
}

// Ensure the enum values match the keys for easy iteration if needed
export const ROOM_TYPES: RoomType[] = [
    RoomType.LivingRoom,
    RoomType.Bedroom,
    RoomType.Kitchen,
    RoomType.Bathroom,
    RoomType.DiningRoom,
    RoomType.Office,
    RoomType.Garage,
    RoomType.Stairs,
    RoomType.Hallway,
    RoomType.Custom,
]

export enum PetType {
    Dog = 'Dog',
    Cat = 'Cat',
    Bird = 'Bird',
    Fish = 'Fish',
    SmallAnimal = 'Small Animal',
}

export const PET_TYPES: PetType[] = [
    PetType.Dog,
    PetType.Cat,
    PetType.Bird,
    PetType.Fish,
    PetType.SmallAnimal,
];

export interface Pet {
    id: string;
    name: string;
    type: PetType;
    position: Vector2; // relative to room's top-left corner in FEET
}

export interface Furniture {
  id: string;
  name: string;
  position: Vector2; // relative to room's top-left corner
  dimensions: Dimension;
  rotation: 0 | 90 | 180 | 270;
  color?: string;
}

export interface RoomConnection {
    roomId: string;
    wall: Wall;
}

export interface Room {
  id:string;
  name: string;
  type: RoomType;
  dimensions: Dimension;
  position: Vector2; // position on the main blueprint IN PIXELS
  rotation: 0 | 90 | 180 | 270;
  features: Feature[];
  furniture: Furniture[];
  pets: Pet[];
  connections: RoomConnection[];
  floor: number;
  color?: string; // Floor color
  wallColor?: string;
  description?: string;
  costEstimates?: {
    flooring: number;
    paint: number;
    labor: number;
  };
}

export interface Property {
  name: string;
  address: string;
}

export type AppState = 'CREATE_PROPERTY' | 'DESIGNING';

export type InteractionMode = 'select' | 'draw_hallway';

export interface ProjectData {
    property: Property;
    rooms: Room[];
    diagram?: string;
}

export const ItemTypes = {
  FURNITURE: 'furniture',
  ROOM: 'room',
  PET: 'pet',
};