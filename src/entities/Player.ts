import Phaser from 'phaser';

export class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private speed: number = 200;

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW: Phaser.Input.Keyboard.Key;
    private keyA: Phaser.Input.Keyboard.Key;
    private keyS: Phaser.Input.Keyboard.Key;
    private keyD: Phaser.Input.Keyboard.Key;
    private keyE: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Create a 32x32 blue square for the player
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x0000ff, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('playerTexture', 32, 32);
        graphics.destroy();

        this.sprite = scene.physics.add.sprite(x, y, 'playerTexture');
        this.sprite.setCollideWorldBounds(true);

        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
            this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
            this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            this.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        } else {
            throw new Error("Keyboard input is missing.");
        }
    }

    private isInputFocused(): boolean {
        if (typeof document === 'undefined') return false;
        const el = document.activeElement;
        if (!el || !(el as HTMLElement).tagName) return false;
        const tag = (el as HTMLElement).tagName.toUpperCase();
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
    }

    updateVelocity() {
        if (this.isInputFocused()) {
            this.sprite.setVelocity(0, 0);
            return;
        }
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.keyA.isDown) vx -= this.speed;
        if (this.cursors.right.isDown || this.keyD.isDown) vx += this.speed;
        if (this.cursors.up.isDown || this.keyW.isDown) vy -= this.speed;
        if (this.cursors.down.isDown || this.keyS.isDown) vy += this.speed;

        this.sprite.setVelocity(vx, vy);
    }

    getInputState() {
        if (this.isInputFocused()) {
            return { up: false, down: false, left: false, right: false, interact: false };
        }
        return {
            up: this.cursors.up.isDown || this.keyW.isDown,
            down: this.cursors.down.isDown || this.keyS.isDown,
            left: this.cursors.left.isDown || this.keyA.isDown,
            right: this.cursors.right.isDown || this.keyD.isDown,
            interact: this.keyE.isDown
        };
    }

    setPosition(x: number, y: number) {
        this.sprite.setPosition(x, y);
        this.sprite.setVelocity(0, 0);
    }
}
