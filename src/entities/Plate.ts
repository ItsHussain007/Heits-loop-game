import Phaser from 'phaser';

export class Plate {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public isPressed: boolean = false;
    private id: string;

    constructor(scene: Phaser.Scene, x: number, y: number, id: string) {
        this.id = id;

        // Create plate visual (green when unpressed, bright green when pressed)
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x005500, 1);
        graphics.fillRect(0, 0, 48, 48);
        graphics.generateTexture(`plateTexture_${id}_off`, 48, 48);
        graphics.clear();

        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(0, 0, 48, 48);
        graphics.generateTexture(`plateTexture_${id}_on`, 48, 48);
        graphics.destroy();

        this.sprite = scene.physics.add.sprite(x, y, `plateTexture_${id}_off`);
        // Plate is a sensor essentially (static non-blocking)
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);

        // We will check overlap every frame in GameScene
    }

    getId() {
        return this.id;
    }

    updateState(pressedThisFrame: boolean) {
        // If state changed
        if (this.isPressed !== pressedThisFrame) {
            this.isPressed = pressedThisFrame;
            this.sprite.setTexture(`plateTexture_${this.id}_${this.isPressed ? 'on' : 'off'}`);
        }
    }
}
