import Phaser from 'phaser';
import { Playback } from '../core/Playback';
import { InputFrame } from '../types';

export class Clone {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private playback: Playback;
    private speed: number = 200;
    private pathGraphics: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, frames: InputFrame[]) {
        this.playback = new Playback(frames);

        // Create a 32x32 cyan square for the clone
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('cloneTexture', 32, 32);
        graphics.destroy();

        this.sprite = scene.physics.add.sprite(x, y, 'cloneTexture');
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setAlpha(0.6);

        // Draw the static ghost trail of its future path
        this.pathGraphics = scene.add.graphics();
        this.pathGraphics.setDepth(5); // Below entities
        this.drawPath(x, y, frames);
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

    private drawPath(startX: number, startY: number, frames: InputFrame[]) {
        this.pathGraphics.lineStyle(2, 0x00ffff, 0.3); // Cyan transparent line
        this.pathGraphics.beginPath();
        this.pathGraphics.moveTo(startX, startY);

        let cx = startX;
        let cy = startY;

        // Simulate the path
        // Tick rate is 50ms (from GameScene)
        const tickDelta = 50 / 1000;

        frames.forEach(frame => {
            let vx = 0;
            let vy = 0;

            if (frame.left) vx -= this.speed;
            if (frame.right) vx += this.speed;
            if (frame.up) vy -= this.speed;
            if (frame.down) vy += this.speed;

            cx += vx * tickDelta;
            cy += vy * tickDelta;

            // Only draw a line segment every few frames to optimize, or just draw to each point
            this.pathGraphics.lineTo(cx, cy);
        });

        this.pathGraphics.strokePath();
    }

    destroy() {
        this.sprite.destroy();
        this.pathGraphics.destroy();
    }
}
