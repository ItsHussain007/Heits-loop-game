import Phaser from 'phaser';

export class Loot {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public isCollected: boolean = false;
    public carrierId: string | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Gold square for loot
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffd700, 1);
        graphics.fillRect(0, 0, 24, 24);
        graphics.generateTexture('lootTexture', 24, 24);
        graphics.destroy();

        this.sprite = scene.physics.add.sprite(x, y, 'lootTexture');
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
    }

    collect(carrierId: string) {
        if (!this.isCollected) {
            this.isCollected = true;
            this.carrierId = carrierId;
            this.sprite.disableBody(true, true);
        }
    }

    drop(x: number, y: number) {
        this.isCollected = false;
        this.carrierId = null;
        this.sprite.enableBody(true, x, y, true, true);
    }

    reset(x: number, y: number) {
        this.isCollected = false;
        this.carrierId = null;
        this.sprite.enableBody(true, x, y, true, true);
    }
}
