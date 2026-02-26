import Phaser from 'phaser';

export class ExtractZone {
    public sprite: Phaser.Physics.Arcade.Sprite;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        // Purple zone for extraction
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xaa00aa, 0.5);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture('extractTexture', width, height);
        graphics.destroy();

        this.sprite = scene.physics.add.sprite(x, y, 'extractTexture');
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
    }
}
