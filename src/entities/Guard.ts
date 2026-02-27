import Phaser from 'phaser';

export class Guard {
    public scene: Phaser.Scene;
    public sprite: Phaser.Physics.Arcade.Sprite;

    // Vision cone parameters
    public fov: number;
    public range: number;
    public angle: number;
    private graphics: Phaser.GameObjects.Graphics;

    // Patrol parameters
    private path: Phaser.Math.Vector2[];
    private speed: number;
    private currentWaypointIdx: number = 0;

    private initialX: number;
    private initialY: number;
    private initialAngle: number;

    private isDetected: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, path: { x: number, y: number }[], speed: number, angle: number, fov: number, range: number) {
        this.scene = scene;
        this.fov = fov;
        this.range = range;
        this.angle = angle;
        this.initialAngle = angle;
        this.speed = speed;
        this.initialX = x;
        this.initialY = y;
        this.path = path.map(p => new Phaser.Math.Vector2(p.x, p.y));

        // Create the blue/gray guard block
        this.sprite = scene.physics.add.sprite(x, y, 'blue_box'); // Reuse a texture or draw one
        const graphicsTexture = scene.make.graphics({ x: 0, y: 0 });
        graphicsTexture.fillStyle(0x7777aa, 1);
        graphicsTexture.fillRect(0, 0, 32, 32);
        graphicsTexture.generateTexture('guard_texture', 32, 32);
        graphicsTexture.destroy();
        this.sprite.setTexture('guard_texture');

        // Solid body
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(32, 32);

        // Vision cone graphics overlay
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10);
    }

    update() {
        // 1. Move along patrol path
        this.patrol();

        // 2. Draw Vision Cone
        this.drawCone();
    }

    private patrol() {
        if (this.path.length === 0) return;

        const target = this.path[this.currentWaypointIdx];
        const pos = new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);

        const dist = pos.distance(target);

        // If close enough to waypoint, switch to next
        if (dist < 5) {
            this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.path.length;
            this.sprite.setVelocity(0, 0); // Brief stop
        } else {
            // Move towards target
            this.scene.physics.moveToObject(this.sprite, target, this.speed);

            // Look in the direction of movement
            const angleRad = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.x, target.y);
            this.angle = Phaser.Math.RadToDeg(angleRad);
        }
    }

    private drawCone() {
        this.graphics.clear();

        const color = this.isDetected ? 0xff0000 : 0xffff00;
        const alpha = this.isDetected ? 0.5 : 0.2;

        this.graphics.fillStyle(color, alpha);
        this.graphics.slice(this.sprite.x, this.sprite.y, this.range, Phaser.Math.DegToRad(this.angle - this.fov / 2), Phaser.Math.DegToRad(this.angle + this.fov / 2), false);
        this.graphics.fillPath();
    }

    // Reuse exact line of sight math from CameraEntity
    canSee(targetBounds: Phaser.Geom.Rectangle, walls: Phaser.Physics.Arcade.StaticGroup): boolean {
        const targetCenter = new Phaser.Math.Vector2(targetBounds.centerX, targetBounds.centerY);
        const guardPos = new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);

        // 1. Distance
        const dist = guardPos.distance(targetCenter);
        if (dist > this.range) return false;

        // 2. Angle
        const angleToTargetRad = Phaser.Math.Angle.BetweenPoints(guardPos, targetCenter);
        const guardAngleRad = Phaser.Math.DegToRad(this.angle);
        let diff = Phaser.Math.Angle.Normalize(angleToTargetRad - guardAngleRad);

        if (diff > Math.PI) diff -= Phaser.Math.PI2;
        if (diff < -Math.PI) diff += Phaser.Math.PI2;

        const fovRad = Phaser.Math.DegToRad(this.fov);
        if (Math.abs(diff) > fovRad / 2) return false;

        // 3. Line of sight (walls)
        const line = new Phaser.Geom.Line(this.sprite.x, this.sprite.y, targetCenter.x, targetCenter.y);
        let blocked = false;

        walls.getChildren().forEach(wallObj => {
            if (blocked) return;
            const wall = wallObj as Phaser.GameObjects.Rectangle;
            const body = wall.body as Phaser.Physics.Arcade.StaticBody;
            if (!body) return;

            const wallBounds = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
            if (Phaser.Geom.Intersects.LineToRectangle(line, wallBounds)) {
                blocked = true;
            }
        });

        return !blocked;
    }

    setDetected(detected: boolean) {
        if (this.isDetected !== detected) {
            this.isDetected = detected;
        }
    }

    reset() {
        this.sprite.setPosition(this.initialX, this.initialY);
        this.angle = this.initialAngle;
        this.currentWaypointIdx = 0;
        this.sprite.setVelocity(0, 0);
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.graphics) this.graphics.destroy();
    }
}
