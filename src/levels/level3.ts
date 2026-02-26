import { LevelData } from './level1';

export const level3: LevelData = {
    // Plate + timed door (open for 5 seconds after pressed).
    // I will encode this in targetPlateId as 'timed:5:plate1'.
    spawn: { x: 100, y: 300 },

    walls: [
        // Outer walls
        { x: 0, y: 0, width: 800, height: 20 },
        { x: 0, y: 580, width: 800, height: 20 },
        { x: 0, y: 0, width: 20, height: 600 },
        { x: 780, y: 0, width: 20, height: 600 },

        // Dividing wall
        { x: 400, y: 0, width: 20, height: 250 },
        { x: 400, y: 350, width: 20, height: 250 }
    ],

    plates: [
        { id: 'plate1', x: 200, y: 500 }
    ],

    doors: [
        { targetPlateId: 'timed:5:plate1', x: 400, y: 250, width: 20, height: 100 }
    ],

    loot: [
        { x: 600, y: 300 }
    ],

    extract: { x: 700, y: 50, width: 60, height: 60 }
};
