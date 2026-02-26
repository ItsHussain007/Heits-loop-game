import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Clone } from '../entities/Clone';
import { LoopManager } from '../core/LoopManager';
import { Recorder } from '../core/Recorder';
import { InputFrame } from '../types';

import { level1, LevelData } from '../levels/level1';
import { level2 } from '../levels/level2';
import { level3 } from '../levels/level3';

import { Plate } from '../entities/Plate';
import { Door } from '../entities/Door';
import { Loot } from '../entities/Loot';
import { ExtractZone } from '../entities/ExtractZone';

const LEVELS: LevelData[] = [level1, level2, level3];

export class GameScene extends Phaser.Scene {
    private currentLevelIndex: number = 0;

    private player!: Player;
    private mapWalls!: Phaser.Physics.Arcade.StaticGroup;

    private plates: Plate[] = [];
    private doors: Door[] = [];
    private loots: Loot[] = [];
    private extractZone!: ExtractZone;

    private loopManager!: LoopManager;
    private recorder!: Recorder;

    private clones: Clone[] = [];
    private recordedLoops: InputFrame[][] = [];

    private timerText!: Phaser.GameObjects.Text;
    private infoText!: Phaser.GameObjects.Text;
    private loopCountText!: Phaser.GameObjects.Text;

    // Simulation variables
    private updateAccumulator: number = 0;
    private readonly TICK_RATE: number = 50; // 50ms = 20 ticks per second

    private won: boolean = false;
    private playerLastInteract: boolean = false;
    private cloneLastInteract: Record<string, boolean> = {};

    // Door timing logic tracking
    private timedDoorsStates: Record<string, number> = {};

    constructor() {
        super('GameScene');
    }

    create() {
        this.loopManager = new LoopManager(20, 1000 / this.TICK_RATE);
        this.recorder = new Recorder();

        // UI
        this.timerText = this.add.text(10, 10, 'Time: 20.0', { color: '#ffffff', fontSize: '24px', backgroundColor: '#000', padding: { x: 4, y: 4 } }).setDepth(100);
        this.loopCountText = this.add.text(10, 48, 'Loops: 1', { color: '#aaaaaa', fontSize: '20px', backgroundColor: '#000', padding: { x: 4, y: 4 } }).setDepth(100);

        this.infoText = this.add.text(400, 300, '', { color: '#00ff00', fontSize: '32px', backgroundColor: '#000', padding: { x: 10, y: 10 } })
            .setOrigin(0.5).setDepth(100).setVisible(false);

        // Legend Overlay
        const legend = `MISSION:
Use plates to open doors.
Steal the Gold (Yellow).
Reach the Extract (Purple).

CONTROLS:
WASD / Arrows: Move
E: Pick Up / Drop
SPACE: End loop early
R: Restart level
N: Skip to next level`;

        this.add.text(10, 85, legend, {
            color: '#ffffff',
            fontSize: '14px',
            backgroundColor: '#222222',
            padding: { x: 8, y: 8 }
        }).setDepth(100);

        // Keyboard Shortcuts
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-R', () => {
                this.loadLevel(this.currentLevelIndex);
            });
            this.input.keyboard.on('keydown-N', () => {
                if (this.currentLevelIndex < LEVELS.length - 1) {
                    this.loadLevel(this.currentLevelIndex + 1);
                }
            });
            this.input.keyboard.on('keydown-SPACE', () => {
                if (!this.won) {
                    // Start next loop early. Current recorded frames are finalized up to this tick.
                    this.completeLoop();
                }
            });
        }

        this.mapWalls = this.physics.add.staticGroup();

        // Player placeholder so loadLevel can init
        this.player = new Player(this, 0, 0);

        this.loadLevel(0);
    }

    private loadLevel(index: number) {
        this.currentLevelIndex = index;
        const levelData = LEVELS[index];

        this.won = false;
        this.infoText.setVisible(false);
        this.recordedLoops = [];
        this.timedDoorsStates = {};

        // Clear old entities
        this.mapWalls.clear(true, true);
        this.plates.forEach(p => p.sprite.destroy());
        this.plates = [];
        this.doors.forEach(d => d.sprite.destroy());
        this.doors = [];
        this.loots.forEach(l => l.sprite.destroy());
        this.loots = [];
        if (this.extractZone) this.extractZone.sprite.destroy();

        // Build walls
        levelData.walls.forEach(wallData => {
            const wall = this.add.rectangle(wallData.x + wallData.width / 2, wallData.y + wallData.height / 2, wallData.width, wallData.height, 0x555555);
            this.physics.add.existing(wall, true);
            this.mapWalls.add(wall);
        });

        this.extractZone = new ExtractZone(this, levelData.extract.x + levelData.extract.width / 2, levelData.extract.y + levelData.extract.height / 2, levelData.extract.width, levelData.extract.height);

        levelData.plates.forEach(p => this.plates.push(new Plate(this, p.x, p.y, p.id)));
        levelData.doors.forEach(d => this.doors.push(new Door(this, d.x + d.width / 2, d.y + d.height / 2, d.width, d.height, d.targetPlateId)));
        levelData.loot.forEach(l => this.loots.push(new Loot(this, l.x, l.y)));

        this.player.sprite.destroy();
        this.player = new Player(this, levelData.spawn.x, levelData.spawn.y);

        this.physics.add.collider(this.player.sprite, this.mapWalls);
        this.doors.forEach(d => this.physics.add.collider(this.player.sprite, d.sprite));

        this.startLoop();
    }

    private startLoop() {
        if (this.won) return;

        const levelData = LEVELS[this.currentLevelIndex];
        // Reset player
        this.player.setPosition(levelData.spawn.x, levelData.spawn.y);
        this.loopManager.reset();
        this.recorder.clear();

        // Recreate clones
        this.clones.forEach(c => c.destroy());
        this.clones = [];

        this.recordedLoops.forEach(frames => {
            const clone = new Clone(this, levelData.spawn.x, levelData.spawn.y, frames);
            this.clones.push(clone);

            this.physics.add.collider(clone.sprite, this.mapWalls);
            this.doors.forEach(d => this.physics.add.collider(clone.sprite, d.sprite));
        });

        // Reset loot globally
        this.loots.forEach((l, i) => {
            l.reset(levelData.loot[i].x, levelData.loot[i].y);
        });

        this.playerLastInteract = false;
        this.cloneLastInteract = {};

        this.loopCountText.setText(`Loops: ${this.recordedLoops.length + 1}`);
    }

    private completeLoop() {
        this.recordedLoops.push(this.recorder.getFrames());
        this.startLoop();
    }

    update(_time: number, delta: number) {
        if (this.won) return;

        this.updateAccumulator += delta;

        while (this.updateAccumulator >= this.TICK_RATE) {
            this.updateAccumulator -= this.TICK_RATE;
            this.fixedTick();
        }

        this.timerText.setText(`Time: ${this.loopManager.getTimeRemainingSeconds().toFixed(1)}`);
    }

    private fixedTick() {
        const shouldReset = this.loopManager.tick();
        if (shouldReset) {
            this.completeLoop();
            return;
        }

        const currentTick = this.loopManager.getCurrentTick();

        // Update Player & Clones
        this.player.updateVelocity();
        this.clones.forEach(clone => clone.update(currentTick));

        // Track previous states to detect "just pressed"
        const inputState = this.player.getInputState();
        if (!this.playerLastInteract && inputState.interact) {
            this.handleInteract('player', this.player.sprite.x, this.player.sprite.y, this.player.sprite.getBounds());
        }
        this.playerLastInteract = inputState.interact;

        // Record Player
        this.recorder.record({
            tick: currentTick,
            ...inputState
        });

        // Handle clones interaction
        this.clones.forEach((clone, index) => {
            const cloneId = `clone_${index}`;
            const frame = clone.getCurrentFrame(); // Need to implement this getter in Clone
            if (frame) {
                if (!this.cloneLastInteract[cloneId] && frame.interact) {
                    this.handleInteract(cloneId, clone.sprite.x, clone.sprite.y, clone.sprite.getBounds());
                }
                this.cloneLastInteract[cloneId] = frame.interact;
            }
        });

        // Handle Interactions (Plates)
        const activePlates = new Set<string>();

        // Check overlap with plates
        this.plates.forEach(plate => {
            let isPressed = false;
            const plateBounds = plate.sprite.getBounds();

            if (Phaser.Geom.Intersects.RectangleToRectangle(plateBounds, this.player.sprite.getBounds())) isPressed = true;
            this.clones.forEach(clone => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(plateBounds, clone.sprite.getBounds())) isPressed = true;
            });

            // Also check if any loot is dropped on the plate
            this.loots.forEach(loot => {
                if (!loot.isCollected && Phaser.Geom.Intersects.RectangleToRectangle(plateBounds, loot.sprite.getBounds())) {
                    isPressed = true;
                }
            });

            plate.updateState(isPressed);
            if (isPressed) {
                activePlates.add(plate.getId());
            }
        });

        // Handle Doors
        this.doors.forEach((door, index) => {
            const targetStr = door.getTargetPlateId();
            let shouldOpen = false;

            if (targetStr.startsWith('timed:')) {
                const parts = targetStr.split(':');
                const durationSec = parseInt(parts[1], 10);
                const pid = parts[2];

                if (activePlates.has(pid)) {
                    this.timedDoorsStates[index] = durationSec * (1000 / this.TICK_RATE); // Set timer ticks
                    shouldOpen = true;
                } else if (this.timedDoorsStates[index] > 0) {
                    this.timedDoorsStates[index]--;
                    shouldOpen = true;
                }
            } else if (targetStr.includes(',')) {
                const requiredPlates = targetStr.split(',');
                shouldOpen = requiredPlates.every(pid => activePlates.has(pid));
            } else {
                shouldOpen = activePlates.has(targetStr);
            }

            door.updateState(shouldOpen);
        });

        // Handle Win Condition (Extract with all loot collected AND dropped in extract, or currently carrying)
        // Actually, MVP just requires player to extract with all loot collected
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.extractZone.sprite.getBounds(), this.player.sprite.getBounds())) {
            const allCollected = this.loots.every(l => l.isCollected); // As long as it's collected by someone, or specifically player?
            // For MVP: player must hold it, or all loots in the world are collected. Let's just say "collected".
            if (allCollected) {
                this.winGame();
            }
        }
    }

    private handleInteract(actorId: string, x: number, y: number, bounds: Phaser.Geom.Rectangle) {
        // Check if carrying something
        const carriedLoot = this.loots.find(l => l.carrierId === actorId);

        if (carriedLoot) {
            // Drop it
            carriedLoot.drop(x, y);
        } else {
            // Try to pick up
            for (const loot of this.loots) {
                if (!loot.isCollected && Phaser.Geom.Intersects.RectangleToRectangle(bounds, loot.sprite.getBounds())) {
                    loot.collect(actorId);
                    break; // only pick up one
                }
            }
        }
    }

    private winGame() {
        this.won = true;
        this.player.sprite.setVelocity(0, 0);
        this.clones.forEach(c => c.sprite.setVelocity(0, 0));

        let scoreText = `LEVEL ${this.currentLevelIndex + 1} CLEARED!\nLoops used: ${this.recordedLoops.length + 1}`;
        if (this.currentLevelIndex === LEVELS.length - 1) {
            scoreText += '\n\nYOU WIN ALL LEVELS!';
        } else {
            scoreText += '\nClick Next Level!';
        }

        this.infoText.setText(scoreText).setVisible(true);
    }
}
