
import { ProjectData } from '../types';
import { generateTextDiagram } from './diagramService';

/**
 * Saves the project data to a JSON file on the user's local machine.
 * @param projectData - The project data to save.
 */
export const saveProjectToFile = async (projectData: ProjectData): Promise<void> => {
    try {
        const diagram = generateTextDiagram(projectData.rooms);
        const dataToSave: ProjectData = {
            ...projectData,
            diagram,
        };

        const fileName = `${dataToSave.property.name.replace(/ /g, '_') || 'home-plan'}.json`;
        const jsonString = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = href;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    } catch (error) {
        console.error("Error saving file:", error);
        throw new Error("Could not create save file.");
    }
};

/**
 * Loads a project from a local JSON file.
 * @returns A promise that resolves with the loaded ProjectData, or rejects with an error.
 */
export const loadProjectFromFile = (): Promise<ProjectData> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.onchange = (event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) {
                reject(new Error("No file selected."));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const result = e.target?.result;
                    if (typeof result === 'string') {
                        const projectData: ProjectData = JSON.parse(result);
                        // Basic validation to ensure it's a valid project file
                        if (projectData.property && Array.isArray(projectData.rooms)) {
                            resolve(projectData);
                        } else {
                            reject(new Error("Invalid project file format."));
                        }
                    } else {
                        reject(new Error("Failed to read file content."));
                    }
                } catch (error) {
                    console.error("Error parsing project file:", error);
                    reject(new Error("Could not parse the selected file. Make sure it's a valid project JSON file."));
                }
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                reject(new Error("An error occurred while reading the file."));
            };

            reader.readAsText(file);
        };
        
        input.click();
    });
};

/**
 * Generates and downloads a comprehensive text report of the project.
 * @param projectData - The project data to report on.
 */
export const exportProjectReport = (projectData: ProjectData): void => {
    let report = `Project Report\n`;
    report += `====================\n\n`;
    report += `Project Name: ${projectData.property.name}\n`;
    if (projectData.property.address) {
        report += `Address: ${projectData.property.address}\n`;
    }
    report += `\n`;

    report += `Full Layout Diagram\n`;
    report += `-------------------\n`;
    report += generateTextDiagram(projectData.rooms) + '\n\n';
    
    report += `Room Details\n`;
    report += `============\n\n`;

    const sortedRooms = [...projectData.rooms].sort((a, b) => {
        if ((a.floor || 1) !== (b.floor || 1)) {
            return (a.floor || 1) - (b.floor || 1);
        }
        return a.name.localeCompare(b.name);
    });

    for (const room of sortedRooms) {
        report += `------------------------------------------------------------\n`;
        report += `ROOM: ${room.name}\n`;
        report += `------------------------------------------------------------\n`;
        report += `- Type: ${room.type}\n`;
        report += `- Floor: ${room.floor || 1}\n`;
        report += `- Dimensions: ${room.dimensions.width} ft (Width) x ${room.dimensions.length} ft (Length)\n`;
        report += `- Area: ${(room.dimensions.width * room.dimensions.length).toFixed(2)} sq. ft.\n`;
        if (room.description) {
             report += `\n- AI Description:\n  ${room.description.replace(/\n/g, '\n  ')}\n`;
        }
        
        if (room.features.length > 0) {
            report += `\n- Features:\n`;
            for (const feature of room.features) {
                const featureName = feature.type.replace(/_/g, ' ');
                report += `  - ${featureName.charAt(0).toUpperCase() + featureName.slice(1)}: on ${feature.wall} wall, ${feature.size} ft wide, offset at ${feature.offset.toFixed(0)}%.\n`;
            }
        }

        if (room.furniture.length > 0) {
            report += `\n- Furniture Layout:\n`;
            for (const item of room.furniture) {
                report += `  - ${item.name.replace(/_/g, ' ')} (${item.dimensions.width}' x ${item.dimensions.length}')\n`;
            }
        }
        
        if ((room.pets || []).length > 0) {
            report += `\n- Pets in this room:\n`;
            for (const pet of room.pets) {
                report += `  - ${pet.name} (the ${pet.type})\n`;
            }
        }

        report += `\n`;
    }

    try {
        const fileName = `${projectData.property.name.replace(/ /g, '_') || 'home-plan'}_Report.txt`;
        const blob = new Blob([report], { type: 'text/plain' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(href);

    } catch (error) {
        console.error("Error exporting report:", error);
        alert("Could not export the report.");
    }
};
