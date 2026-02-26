import Phaser from 'phaser';

export class Door {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public isOpen: boolean = false;
    private targetPlateId: string;
    private startX: number;
    private startY: number;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, targetPlateId: string) {
        this.targetPlateId = targetPlateId;
        this.startX = x;
        this.startY = y;

        // Create door visual (orange wall)
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffaa00, 1);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture(`doorTexture_${targetPlateId}`, width, height);
        graphics.destroy();

        this.sprite = scene.physics.add.sprite(x, y, `doorTexture_${targetPlateId}`);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
    }

    getTargetPlateId() {
        return this.targetPlateId;
    }

    updateState(plateIsPressed: boolean) {
        if (this.isOpen !== plateIsPressed) {
            this.isOpen = plateIsPressed;

            // When open, we disable the physics body and make it invisible
            if (this.isOpen) {
                this.sprite.disableBody(true, true);
            } else {
                this.sprite.enableBody(true, this.startX, this.startY, true, true);
            }
        }
    }
}
