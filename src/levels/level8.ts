import { ExtendedLevelData } from '../types';

export const level8: ExtendedLevelData = {
    // Guard clone distraction level
    spawn: { x: 100, y: 100 },

    walls: [
        // Outer walls
        { x: 0, y: 0, width: 1000, height: 20 },
        { x: 0, y: 580, width: 1000, height: 20 },
        { x: 0, y: 0, width: 20, height: 600 },
        { x: 980, y: 0, width: 20, height: 600 },

        // Maze walls
        { x: 300, y: 0, width: 20, height: 400 },
        { x: 600, y: 200, width: 20, height: 400 }
    ],

    plates: [
        { id: 'plate1', x: 150, y: 450 }
    ],
    doors: [
        { targetPlateId: 'plate1', x: 600, y: 100, width: 20, height: 100 }
    ],
    cameras: [],

    guards: [
        {
            x: 450,
            y: 150,
            path: [
                { x: 450, y: 450 },
                { x: 450, y: 150 }
            ],
            speed: 80,
            angle: 90, // Facing down
            fov: 70,
            range: 300
        }
    ],

    loot: [
        { x: 450, y: 500 }
    ],

    extract: { x: 800, y: 100, width: 60, height: 60 }
};
