import { ExtendedLevelData } from '../types';

export const level5: ExtendedLevelData = {
    // Camera + Plate
    spawn: { x: 100, y: 300 },

    walls: [
        // Outer walls
        { x: 0, y: 0, width: 1000, height: 20 },
        { x: 0, y: 580, width: 1000, height: 20 },
        { x: 0, y: 0, width: 20, height: 600 },
        { x: 980, y: 0, width: 20, height: 600 },

        // Dividing wall
        { x: 400, y: 0, width: 20, height: 250 },
        { x: 400, y: 350, width: 20, height: 250 }
    ],

    plates: [
        { id: 'plate1', x: 200, y: 500 }
    ],

    doors: [
        { targetPlateId: 'plate1', x: 400, y: 250, width: 20, height: 100 }
    ],

    cameras: [
        // Camera watches the plate area (moved y to 40 so it doesn't clip into the top wall)
        { x: 200, y: 40, angle: 90, fov: 45, range: 600, rotationSpeed: 1, rotationBounds: [60, 120] }
    ],

    loot: [
        { x: 600, y: 300 }
    ],

    extract: { x: 700, y: 50, width: 60, height: 60 }
};
