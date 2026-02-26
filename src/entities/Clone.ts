import Phaser from 'phaser';
import { Playback } from '../core/Playback';
import { InputFrame } from '../types';

export class Clone {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private playback: Playback;
    private speed: number = 200;

    constructor(scene: Phaser.Scene, x: number, y: number, frames: InputFrame[]) {
        this.playback = new Playback(frames);

        // Create a 32x32 red square for the clone
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('cloneTexture', 32, 32);
        graphics.destroy();

        this.sprite = scene.physics.add.sprite(x, y, 'cloneTexture');
        this.sprite.setCollideWorldBounds(true);
    }

    update(tick: number) {
        const frame = this.playback.getFrameForTick(tick);
        if (!frame) {
            this.sprite.setVelocity(0, 0);
            return;
        }

        let vx = 0;
        let vy = 0;

        if (frame.left) vx -= this.speed;
        if (frame.right) vx += this.speed;
        if (frame.up) vy -= this.speed;
        if (frame.down) vy += this.speed;

        this.sprite.setVelocity(vx, vy);
    }

    getCurrentFrame(): InputFrame | null {
        return this.playback.getCurrentFrame();
    }

    destroy() {
        this.sprite.destroy();
    }
}
