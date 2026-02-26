export interface LevelData {
    spawn: { x: number; y: number };
    walls: { x: number; y: number; width: number; height: number }[];
    plates: { id: string; x: number; y: number }[];
    doors: { targetPlateId: string; x: number; y: number; width: number; height: number }[];
    loot: { x: number; y: number }[];
    extract: { x: number; y: number; width: number; height: number };
}

export const level1: LevelData = {
    // Level layout overview:
    // Left side is spawn. Right side is vault.
    // Door blocks the path from left to right.
    // Plate activates the door.
    spawn: { x: 100, y: 300 },

    walls: [
        // Outer walls
        { x: 0, y: 0, width: 800, height: 20 },
        { x: 0, y: 580, width: 800, height: 20 },
        { x: 0, y: 0, width: 20, height: 600 },
        { x: 780, y: 0, width: 20, height: 600 },

        // Dividing wall (door goes here)
        { x: 400, y: 0, width: 20, height: 250 },
        { x: 400, y: 350, width: 20, height: 250 }
    ],

    plates: [
        { id: 'plate1', x: 200, y: 500 }
    ],

    doors: [
        // Door fills the gap between the two dividing walls
        { targetPlateId: 'plate1', x: 400, y: 250, width: 20, height: 100 }
    ],

    loot: [
        { x: 600, y: 300 }
    ],

    extract: { x: 700, y: 50, width: 60, height: 60 }
};
