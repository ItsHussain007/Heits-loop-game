import { ExtendedLevelData } from '../types';

export const level7: ExtendedLevelData = {
    // Basic Patrol Level
    spawn: { x: 100, y: 300 },

    walls: [
        // Outer walls
        { x: 0, y: 0, width: 1000, height: 20 },
        { x: 0, y: 580, width: 1000, height: 20 },
        { x: 0, y: 0, width: 20, height: 600 },
        { x: 980, y: 0, width: 20, height: 600 },

        // Hallway walls
        { x: 0, y: 150, width: 800, height: 20 },
        { x: 0, y: 450, width: 800, height: 20 }
    ],

    plates: [],
    doors: [],
    cameras: [],

    guards: [
        {
            x: 600,
            y: 300,
            path: [
                { x: 300, y: 300 },
                { x: 700, y: 300 }
            ],
            speed: 100,
            angle: 180, // Facing left
            fov: 60,
            range: 250
        }
    ],

    loot: [
        { x: 850, y: 300 }
    ],

    extract: { x: 900, y: 50, width: 60, height: 60 }
};
