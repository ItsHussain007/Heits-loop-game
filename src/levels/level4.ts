import { ExtendedLevelData } from '../types';

export const level4: ExtendedLevelData = {
    // Camera Hallway
    spawn: { x: 100, y: 100 },

    walls: [
        // Outer walls
        { x: 0, y: 0, width: 800, height: 20 },
        { x: 0, y: 580, width: 800, height: 20 },
        { x: 0, y: 0, width: 20, height: 600 },
        { x: 780, y: 0, width: 20, height: 600 },

        // Hallway walls
        { x: 200, y: 200, width: 400, height: 20 },
        { x: 200, y: 400, width: 400, height: 20 }
    ],

    plates: [],
    doors: [],

    cameras: [
        { x: 600, y: 300, angle: 180, fov: 60, range: 400, rotationSpeed: 2, rotationBounds: [150, 210] }
    ],

    loot: [
        { x: 700, y: 300 }
    ],

    extract: { x: 700, y: 50, width: 60, height: 60 }
};
