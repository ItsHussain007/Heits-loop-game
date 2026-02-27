import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%'
    },
    backgroundColor: '#333333',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { x: 0, y: 0 } // Top-down, no gravity
        }
    },
    scene: [GameScene],
    // Use a fixed timestep in the game loop for determinism
    fps: {
        target: 60,
        forceSetTimeOut: true
    }
};

new Phaser.Game(config);
