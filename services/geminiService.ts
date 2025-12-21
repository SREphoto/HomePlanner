


import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { Room, Furniture, Pet, Property } from '../types';
import { GenerateOptions } from '../types';
import { PIXELS_PER_FOOT, DEFAULT_FURNITURE_COLOR } from '../constants';

// Initial key from env
let apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') || '';

if (!apiKey) {
    console.warn("GEMINI_API_KEY not set. Please provide it in the app settings.");
}

// Lazy initialization or a proxy-like behavior would be better, 
// but for now let's just create a helper to get the instance
export const getAi = () => {
    const currentKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') || '';
    if (!currentKey) {
        throw new Error("API Key is missing. Please set it in the application settings.");
    }
    return new GoogleGenAI({ apiKey: currentKey });
};

// Internal helper for this module
const aiInstance = () => getAi();



export const researchAddress = async (address: string): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("API key is not configured.");
    }
    try {
        const response: GenerateContentResponse = await aiInstance().models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide public information for the address: "${address}". Focus on property details like approximate square footage, number of bedrooms, bathrooms, and a general description of the layout. If you can't find specific details, say so. Keep the response concise. Also, list the URLs of your top sources at the end.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let resultText = response.text;
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
            const sources = groundingMetadata.groundingChunks
                .map((chunk: any) => chunk.web?.uri)
                .filter((uri: string | undefined) => uri);

            const uniqueSources = [...new Set(sources)];

            if (uniqueSources.length > 0) {
                resultText += "\n\nSources:\n- " + uniqueSources.join("\n- ");
            }
        }

        return resultText;

    } catch (error) {
        console.error("Error researching address with Gemini:", error);
        throw new Error("Failed to get information from AI search.");
    }
}


export const generateBlueprintLayout = async (options: GenerateOptions, researchText: string | null): Promise<Room[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }

    const basePrompt = `
    You are an expert architectural designer tasked with creating a floor plan.
    Your task is to produce a JSON array of "Room" objects for a multi-story property.
    The output MUST be a valid JSON array of objects, with no other text, explanation, or markdown fences. Each object must conform to the 'Room' interface:

    {
      "id": "string", // A unique ID for the room, e.g., "room-living-1"
      "name": "string", // A descriptive name, e.g., "Living Room"
      "type": "Living Room" | "Bedroom" | "Kitchen" | "Bathroom" | "Dining Room" | "Office" | "Garage" | "Stairs" | "Hallway" | "Custom",
      "floor": number, // The floor number this room is on (e.g., 1, 2).
      "dimensions": { "width": number, "length": number }, // Size of the room in feet.
      "position": { "x": number, "y": number }, // **CRITICAL**: Top-left corner position in FEET, relative to the floor's (0,0) origin.
      "rotation": 0, // Keep this 0 for the initial layout.
      "features": [], // Leave this as an empty array.
      "furniture": [], // Leave this as an empty array.
      "pets": [], // Leave this as an empty array.
      "connections": [] // Leave this as an empty array.
    }

    **VERY IMPORTANT LAYOUT RULES:**
    1.  **No Overlapping (CRITICAL):** Rooms on the same floor **MUST NOT** overlap. Treat the floor as a 2D grid. The \`position\` object \`{ "x": number, "y": number }\` represents the top-left corner of the room in feet. You MUST calculate \`x\` and \`y\` for each room to ensure it is placed adjacent to another room, not on top of it. For example, if you place a \`15ft\` wide Living Room at \`{"x": 0, "y": 0}\` with a length of 20ft, a Kitchen placed to its right should have \`{"x": 15, "y": 0}\`. A Dining Room placed below the Living Room should have \`{"x": 0, "y": 20}\`. Placing multiple rooms at the same coordinates is a failure.
    2.  **Logical Flow:** Connect rooms logically using 'Hallway' rooms where appropriate. The kitchen should be near the dining room. There should be a clear path from a main entrance.
    3.  **Multi-Floor Logic:** If there are multiple floors, place public spaces like the Living Room, Kitchen, and Dining Room on floor 1. Place private spaces like Bedrooms on the upper floors. You MUST include a 'Stairs' room on each floor, positioned so they would realistically connect to each other.
    4.  **Square Footage:** The total area of all rooms combined should be reasonably close to the specified total square footage.

    Example for a 2-floor house:
    [
      { "id": "room-1", "name": "Living Room", "type": "Living Room", "floor": 1, "dimensions": { "width": 15, "length": 20 }, "position": { "x": 0, "y": 0 }, "rotation": 0, "features": [], "furniture": [], "pets": [], "connections": [] },
      { "id": "room-2", "name": "Kitchen", "type": "Kitchen", "floor": 1, "dimensions": { "width": 12, "length": 15 }, "position": { "x": 15, "y": 0 }, "rotation": 0, "features": [], "furniture": [], "pets": [], "connections": [] },
      { "id": "room-stairs", "name": "Stairs Up", "type": "Stairs", "floor": 1, "dimensions": { "width": 4, "length": 12 }, "position": { "x": 15, "y": 15 }, "rotation": 0, "features": [], "furniture": [], "pets": [], "connections": [] },
      { "id": "room-3", "name": "Master Bedroom", "type": "Bedroom", "floor": 2, "dimensions": { "width": 15, "length": 15 }, "position": { "x": 0, "y": 0 }, "rotation": 0, "features": [], "furniture": [], "pets": [], "connections": [] },
      { "id": "room-4", "name": "Guest Bedroom", "type": "Bedroom", "floor": 2, "dimensions": { "width": 12, "length": 12 }, "position": { "x": 0, "y": 15 }, "rotation": 0, "features": [], "furniture": [], "pets": [], "connections": [] },
      { "id": "room-stairs-2", "name": "Stairs Down", "type": "Stairs", "floor": 2, "dimensions": { "width": 4, "length": 12 }, "position": { "x": 15, "y": 15 }, "rotation": 0, "features": [], "furniture": [], "pets": [], "connections": [] }
    ]
    `;

    let finalPrompt: string;

    if (researchText && researchText.trim().length > 0) {
        finalPrompt = `
        ${basePrompt}

        **Primary Task:** Generate a floor plan based on the following research information about a real property.
        
        **Research Data:**
        ---
        ${researchText}
        ---

        **Guidelines:**
        - Prioritize the details found in the research data (e.g., room count, square footage, layout descriptions).
        - Use these user-specified parameters as a secondary reference or for details not mentioned in the research:
          - Total Square Footage: ${options.sqft}
          - Number of Floors: ${options.floors}
          - Number of Bedrooms: ${options.bedrooms}
          - Number of Bathrooms: ${options.bathrooms}
        - If the research data is vague or insufficient to create a complete plan, use the user-specified parameters to generate a plausible, generic layout. Make your best effort to match any known details.

        Now, generate the layout based on the research.
        `;
    } else {
        finalPrompt = `
        ${basePrompt}

        **Task:** Generate a floor plan based on the following specifications.

        **Specifications:**
        - Total Square Footage: ${options.sqft}
        - Number of Floors: ${options.floors}
        - Number of Bedrooms: ${options.bedrooms}
        - Number of Bathrooms: ${options.bathrooms}

        Now, generate the layout for the specified house.
        `;
    }

    try {
        const response = await aiInstance().models.generateContent({
            model: "gemini-2.5-flash",
            contents: finalPrompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.6,
            }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const layout = JSON.parse(jsonStr);

        if (!Array.isArray(layout)) {
            throw new Error("AI response was not a JSON array.");
        }

        return layout.map((room, index) => ({
            ...room,
            id: room.id || `room-${Date.now()}-${index}`,
            floor: room.floor || 1,
            position: { // Convert position from feet to pixels
                x: (room.position?.x || 0) * PIXELS_PER_FOOT,
                y: (room.position?.y || 0) * PIXELS_PER_FOOT
            },
            connections: [],
            pets: [],
        })) as Room[];

    } catch (error) {
        console.error("Error generating blueprint from Gemini:", error);
        throw new Error("Failed to parse or receive blueprint from AI.");
    }
}


const generateFurniturePrompt = (room: Room): string => {
    // Sanitize room data for the prompt, omitting circular or large properties
    const roomForPrompt = {
        name: room.name,
        type: room.type,
        dimensions: room.dimensions,
        features: room.features,
    };

    return `
    You are an expert interior designer creating a blueprint furniture layout.
    Your task is to generate a functional and aesthetically pleasing furniture arrangement for a given room.

    **Room Details:**
    - Type: ${room.type}
    - Dimensions: ${room.dimensions.width} feet wide by ${room.dimensions.length} feet long.
    - Features (doors, windows, outlets): ${JSON.stringify(room.features, null, 2)}
      - A feature's 'wall' specifies its location ('top', 'bottom', 'left', 'right').
      - 'offset' is the percentage along that wall (e.g., 50 is the center).
      - 'size' is the feature's width in feet.

    **Layout Constraints:**
    1.  **Clearance:** Do not block doors or create layouts that obstruct main pathways. Leave at least 2.5 feet of clearance for major walkways.
    2.  **Functionality:** Place furniture logically. For example, in a bedroom, the head of the bed should be against a solid wall. In a living room, sofas should generally face a focal point like a TV or fireplace.
    3.  **Positioning:** The origin (0,0) is the top-left corner of the room. All furniture positions must be within the room's dimensions. 'position.x' must be between 0 and ${room.dimensions.width}, and 'position.y' must be between 0 and ${room.dimensions.length}.
    4.  **Furniture Sizing:** Provide realistic dimensions for each piece of furniture in feet.

    **Response Format:**
    Respond with ONLY a valid JSON array of furniture objects. Each object must conform to this exact structure:
    {
      "id": "string", // A unique ID for the furniture, e.g., "bed-1"
      "name": "string", // A descriptive name, e.g., "queen_bed"
      "position": { "x": number, "y": number }, // Top-left corner of the furniture in feet, relative to the room's origin.
      "dimensions": { "width": number, "length": number }, // Size of the furniture in feet.
      "rotation": 0 | 90 | 180 | 270 // Rotation in degrees.
    }

    **Example for a bedroom:**
    [
      { "id": "bed-1", "name": "queen_bed", "position": { "x": 5.5, "y": 0.5 }, "dimensions": { "width": 5, "length": 6.7 }, "rotation": 0 },
      { "id": "nightstand-1", "name": "nightstand", "position": { "x": 3, "y": 0.5 }, "dimensions": { "width": 2, "length": 1.5 }, "rotation": 0 },
      { "id": "nightstand-2", "name": "nightstand", "position": { "x": 11, "y": 0.5 }, "dimensions": { "width": 2, "length": 1.5 }, "rotation": 0 },
      { "id": "dresser-1", "name": "dresser", "position": { "x": 1, "y": 12 }, "dimensions": { "width": 5, "length": 1.8 }, "rotation": 90 }
    ]

    Now, generate the layout for the following room:
    ${JSON.stringify(roomForPrompt)}
  `;
};

export const generateFurnitureLayout = async (room: Room): Promise<Furniture[]> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("API key is not configured.");
    }

    const prompt = generateFurniturePrompt(room);

    try {
        const response = await aiInstance().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.5,
            },
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const furnitureData = JSON.parse(jsonStr);

        if (!Array.isArray(furnitureData)) {
            throw new Error("API response is not an array.");
        }

        // Validate and return, ensuring it fits the Furniture[] type
        return furnitureData
            .filter(item =>
                item.id &&
                item.name &&
                item.position && typeof item.position.x === 'number' && typeof item.position.y === 'number' &&
                item.dimensions && typeof item.dimensions.width === 'number' && typeof item.dimensions.length === 'number' &&
                [0, 90, 180, 270].includes(item.rotation)
            )
            .map((item: any) => ({ ...item, color: DEFAULT_FURNITURE_COLOR }));

    } catch (error) {
        console.error("Error generating furniture layout from Gemini:", error);
        throw new Error("Failed to parse or receive layout from AI.");
    }
};


export const generateRoomDescription = async (room: Room): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("API key is not configured.");
    }

    const roomDataForPrompt = {
        name: room.name,
        type: room.type,
        dimensions: room.dimensions,
        features: room.features,
        furniture: room.furniture.map(f => ({ name: f.name.replace(/_/g, ' '), dimensions: f.dimensions })),
        pets: (room.pets || []).map(p => ({ name: p.name, type: p.type })),
    };

    const prompt = `
    You are an eloquent architectural assistant. Your task is to write a human-readable, narrative description of a single room based on its technical data.

    **Instructions:**
    1.  Start by stating the room's name and its dimensions.
    2.  Describe the key features, such as doors and windows. Mention which wall they are on (top, bottom, left, right).
    3.  If there is furniture, describe the general arrangement and what it suggests about the room's function.
    4.  If there are pets listed, mention them briefly (e.g., "The room is also home to Fido, the family dog.").
    5.  Keep the tone professional, descriptive, and concise (2-4 sentences).
    6.  Do not output markdown or any other formatting. Just plain text.

    **Example:**
    "The Master Bedroom is a spacious 15' x 12' retreat. A large window on the top wall provides natural light, while a door on the left wall offers private access. The room is furnished with a queen bed and two nightstands, creating a comfortable and symmetrical sleeping area."

    **Room Data:**
    ${JSON.stringify(roomDataForPrompt, null, 2)}

    Now, generate the description for this room.
    `;

    try {
        const response = await aiInstance().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.6,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating room description from Gemini:", error);
        throw new Error("Failed to generate room description from AI.");
    }
};

export const generateDimensionsFromImage = async (base64ImageData: string): Promise<{ width: number, length: number }> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("API key is not configured.");
    }

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64ImageData,
        },
    };

    const textPart = {
        text: `
        You are an expert spatial analysis AI. Your task is to estimate the dimensions of the room shown in the image.
        - Analyze the image to identify the room's primary width and length.
        - Use common objects for scale. Assume standard doors are ~6.7 feet high and ~2.5-3 feet wide. Assume beds, desks, and other furniture have typical dimensions.
        - Provide your answer in feet.
        - Your output must be ONLY a valid JSON object with two keys: "width" and "length". Do not include any other text, explanations, or markdown.

        Example response:
        {
            "width": 12.5,
            "length": 14.0
        }
        `
    };

    try {
        const response = await aiInstance().models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [imagePart, textPart] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        width: { type: Type.NUMBER, description: 'The estimated width of the room in feet.' },
                        length: { type: Type.NUMBER, description: 'The estimated length of the room in feet.' }
                    },
                    required: ["width", "length"],
                },
            }
        });

        const jsonString = response.text.trim();
        const dimensions = JSON.parse(jsonString);

        if (typeof dimensions.width !== 'number' || typeof dimensions.length !== 'number') {
            throw new Error("AI returned invalid data format for dimensions.");
        }

        return dimensions;

    } catch (error) {
        console.error("Error getting dimensions from Gemini:", error);
        throw new Error("Failed to analyze room image with AI.");
    }
};

export const generateRoomVisualization = async (room: Room): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("API key is not configured.");
    }

    const featuresString = room.features.map(f => {
        if (f.type === 'window') return `There is a ${f.size}-foot wide window on the ${f.wall} wall.`;
        if (f.type === 'door') return `There is a door on the ${f.wall} wall.`;
        return '';
    }).join(' ');

    const furnitureString = room.furniture.map(f => `${f.name.replace(/_/g, ' ')}`).join(', ');

    const prompt = `A photorealistic, high-quality interior photo of a ${room.type}, which is ${room.dimensions.width}' wide and ${room.dimensions.length}' long. The style is modern and bright. The walls are painted with a color similar to hex code ${room.wallColor}. The floor color is similar to hex code ${room.color}. ${featuresString} The room contains the following furniture: ${furnitureString}. The photo is taken from a standing perspective, looking into the room. Use a 35mm lens style. Natural daylight is abundant.`;

    try {
        const response = await aiInstance().models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("AI did not return an image.");
        }

    } catch (error) {
        console.error("Error generating room visualization from Imagen:", error);
        throw new Error("Failed to generate room image with AI.");
    }
};


export const getRegionalCosts = async (property: Property): Promise<{ flooring: number, paint: number, labor: number }> => {
    if (!process.env.API_KEY || !property.address) {
        throw new Error("API key or address is not configured.");
    }

    const prompt = `Based on public data for the location "${property.address}", provide the average home renovation costs per square foot in USD. I need values for 'flooring' (for mid-range hardwood installation), 'paint' (for standard interior wall painting including materials), and 'labor' (for general carpentry or renovation tasks). Provide a single numeric estimate for each, representing the cost per square foot. Respond ONLY with a valid JSON object.`;

    try {
        const response = await aiInstance().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        flooring: { type: Type.NUMBER, description: 'Average cost per square foot for mid-range flooring material and installation.' },
                        paint: { type: Type.NUMBER, description: 'Average cost per square foot for interior painting, including labor and materials.' },
                        labor: { type: Type.NUMBER, description: 'Average cost per square foot for general renovation labor.' }
                    },
                    required: ["flooring", "paint", "labor"],
                },
            }
        });

        const jsonString = response.text.trim();
        const costs = JSON.parse(jsonString);

        if (typeof costs.flooring !== 'number' || typeof costs.paint !== 'number' || typeof costs.labor !== 'number') {
            throw new Error("AI returned invalid data format for costs.");
        }

        return costs;

    } catch (error) {
        console.error("Error getting regional costs from Gemini:", error);
        throw new Error("Failed to retrieve cost data with AI.");
    }
};