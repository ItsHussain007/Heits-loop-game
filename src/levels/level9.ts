import { ExtendedLevelData } from '../types';

export const level9: ExtendedLevelData = {
    // Two guards intersecting
    spawn: { x: 100, y: 300 },

    walls: [
        // Outer walls
        { x: 0, y: 0, width: 1000, height: 20 },
        { x: 0, y: 580, width: 1000, height: 20 },
        { x: 0, y: 0, width: 20, height: 600 },
        { x: 980, y: 0, width: 20, height: 600 },

        // Center obstacle
        { x: 400, y: 200, width: 200, height: 200 }
    ],

    plates: [],
    doors: [],
    cameras: [],

    guards: [
        {
            x: 500,
            y: 100,
            path: [
                { x: 200, y: 100 },
                { x: 800, y: 100 }
            ],
            speed: 120,
            angle: 0, // Facing right
            fov: 60,
            range: 350
        },
        {
            x: 500,
            y: 500,
            path: [
                { x: 800, y: 500 },
                { x: 200, y: 500 }
            ],
            speed: 120,
            angle: 180, // Facing left
            fov: 60,
            range: 350
        }
    ],

    loot: [
        { x: 500, y: 50 }
    ],

    extract: { x: 900, y: 300, width: 60, height: 60 }
};
