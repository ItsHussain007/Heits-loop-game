import { LevelData } from './level1';

export const level2: LevelData = {
    // Two plates + one door (requires 2 clones, meaning 3 loops total)
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
        { id: 'plate1', x: 200, y: 100 },
        { id: 'plate2', x: 200, y: 500 }
    ],

    doors: [
        // Door logic in GameScene will be updated to handle AND logic if multiple plates have the same target, or I can specify a combined requirement.
        // Wait, the door should require BOTH plates. Let's use targetPlateId: 'plate1,plate2'.
        { targetPlateId: 'plate1,plate2', x: 400, y: 250, width: 20, height: 100 }
    ],

    loot: [
        { x: 600, y: 300 }
    ],

    extract: { x: 700, y: 50, width: 60, height: 60 }
};
