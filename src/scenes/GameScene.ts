import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Clone } from '../entities/Clone';
import { LoopManager } from '../core/LoopManager';
import { Recorder } from '../core/Recorder';
import { SoundFX } from '../core/SoundFX';
import { InputFrame, ExtendedLevelData } from '../types';

import { level1 } from '../levels/level1';
import { level4 } from '../levels/level4';
import { level7 } from '../levels/level7';

import { Plate } from '../entities/Plate';
import { Door } from '../entities/Door';
import { Loot } from '../entities/Loot';
import { ExtractZone } from '../entities/ExtractZone';
import { CameraEntity } from '../entities/Camera';
import { Guard } from '../entities/Guard';

// Curated 3 Competitive Levels for the Demo
const LEVELS: ExtendedLevelData[] = [level1, level4, level7];

export class GameScene extends Phaser.Scene {
    private currentLevelIndex: number = 0;

    private player!: Player;
    private mapWalls!: Phaser.Physics.Arcade.StaticGroup;

    private plates: Plate[] = [];
    private doors: Door[] = [];
    private loots: Loot[] = [];
    private securityCameras: CameraEntity[] = [];
    private guards: Guard[] = [];
    private extractZone!: ExtractZone;

    private loopManager!: LoopManager;
    private recorder!: Recorder;
    private sfx!: SoundFX;

    private clones: Clone[] = [];
    private recordedLoops: InputFrame[][] = [];

    private timerText!: Phaser.GameObjects.Text;
    private spawnTimerText!: Phaser.GameObjects.Text;
    private infoText!: Phaser.GameObjects.Text;
    private loopCountText!: Phaser.GameObjects.Text;

    // Phase 9 Visuals
    private redVignette!: Phaser.GameObjects.Graphics;
    private detectedCentralText!: Phaser.GameObjects.Text;

    // Simulation variables
    private updateAccumulator: number = 0;
    private readonly TICK_RATE: number = 50; // 50ms = 20 ticks per second

    private won: boolean = false;
    private playerLastInteract: boolean = false;
    private cloneLastInteract: Record<string, boolean> = {};

    // Phase 6 Suspicion Logic
    private suspicionMeter: number = 0; // 0 to 100
    private suspicionBarText!: Phaser.GameObjects.Text;

    private interactPromptText!: Phaser.GameObjects.Text;

    // Door timing logic tracking
    private timedDoorsStates: Record<string, number> = {};

    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.audio('bgm', '/assets/audio/bgm.ogg');
    }

    create() {
        this.sfx = new SoundFX();
        this.loopManager = new LoopManager(20, 1000 / this.TICK_RATE);
        this.recorder = new Recorder();

        // Timer HUDs
        this.timerText = this.add.text(500, 15, 'RUN TIME: 00:00.0', { color: '#ffffff', fontSize: '28px', fontStyle: 'bold', backgroundColor: '#000', padding: { x: 10, y: 5 } }).setOrigin(0.5, 0).setDepth(200);
        this.spawnTimerText = this.add.text(10, 10, 'LOOP TIMER: 20.0', { color: '#ffaa00', fontSize: '24px', backgroundColor: '#000', padding: { x: 4, y: 4 } }).setDepth(100).setVisible(false);
        this.loopCountText = this.add.text(10, 48, 'Loop: 1', { color: '#00ffff', fontSize: '24px', backgroundColor: '#000', padding: { x: 4, y: 4 } }).setDepth(100).setVisible(false);

        this.infoText = this.add.text(500, 300, '', { color: '#00ff00', fontSize: '32px', backgroundColor: '#000', padding: { x: 10, y: 10 } })
            .setOrigin(0.5).setDepth(100).setVisible(false);

        // Phase 9: Detection VFX
        this.redVignette = this.add.graphics({ x: 0, y: 0 }).setDepth(190).setScrollFactor(0);
        this.detectedCentralText = this.add.text(500, 500, 'DETECTED', {
            color: '#ff0000',
            fontSize: '84px',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(201).setVisible(false).setAlpha(0);

        // Suspicion bar dynamically shown/hidden
        this.suspicionBarText = this.add.text(500, 60, 'Suspicion: 0%', {
            color: '#ffffff',
            fontSize: '24px',
            fontStyle: 'bold',
            backgroundColor: '#aa0000',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5).setDepth(200).setVisible(false);

        // Interaction Prompt
        this.interactPromptText = this.add.text(0, 0, '[E]', {
            color: '#000000',
            fontSize: '14px',
            fontStyle: 'bold',
            backgroundColor: '#ffffff',
            padding: { x: 3, y: 3 }
        }).setOrigin(0.5).setDepth(150).setVisible(false);

        // Keyboard Shortcuts
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-R', () => {
                if (this.registry.get('runActive')) this.loadLevel(this.currentLevelIndex);
            });
            this.input.keyboard.on('keydown-SPACE', () => {
                if (this.registry.get('runActive') && !this.won) {
                    this.completeLoop();
                }
            });
        }

        this.mapWalls = this.physics.add.staticGroup();
        this.player = new Player(this, 0, 0);

        // Define HTML UI Integration
        (window as any).gameUI.startSpeedrun = () => {
            this.startSpeedrun();
        };

        (window as any).gameUI.pauseGame = () => {
            if (this.registry.get('runActive') && !this.won) {
                this.scene.pause();
                this.sound.pauseAll();
            }
        };

        (window as any).gameUI.resumeGame = () => {
            if (this.registry.get('runActive') && !this.won) {
                this.scene.resume();
                this.sound.resumeAll();
            }
        };
    }

    private startSpeedrun() {
        // Initialize Global Speedrun State
        this.registry.set('globalTimer', 0);
        this.registry.set('globalLoops', 0);
        this.registry.set('globalAlarms', 0);
        this.registry.set('runActive', true);

        this.timerText.setVisible(true);
        this.spawnTimerText.setVisible(true);
        this.loopCountText.setVisible(true);

        // Start BGM - ensure we stop any stopped/stale instances first before recreating
        this.sound.stopAll();
        this.sound.play('bgm', { loop: true, volume: 0.3 });

        // Start Level 1
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
        this.securityCameras.forEach(c => c.destroy());
        this.securityCameras = [];
        this.guards.forEach(g => g.destroy());
        this.guards = [];
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

        if (levelData.cameras) {
            levelData.cameras.forEach(c => {
                this.securityCameras.push(new CameraEntity(this, c.x, c.y, c.angle, c.fov, c.range, c.rotationSpeed, c.rotationBounds));
            });
        }

        if (levelData.guards) {
            levelData.guards.forEach(g => {
                const guard = new Guard(this, g.x, g.y, g.path, g.speed, g.angle, g.fov, g.range);
                this.guards.push(guard);
                this.physics.add.collider(guard.sprite, this.mapWalls);
            });
        }

        this.player.sprite.destroy();
        this.player = new Player(this, levelData.spawn.x, levelData.spawn.y);

        this.physics.add.collider(this.player.sprite, this.mapWalls);
        this.doors.forEach(d => this.physics.add.collider(this.player.sprite, d.sprite));

        // Center camera dynamically
        this.centerCamera();
        this.scale.on('resize', this.centerCamera, this);

        this.startLoop();
    }

    private centerCamera() {
        const { width, height } = this.scale;

        // Base logical dimensions designed around levels
        const LOGICAL_WIDTH = 1000;
        const LOGICAL_HEIGHT = 600;

        // Calculate zoom ratio to fit the entire level on screen
        const zoomX = width / LOGICAL_WIDTH;
        const zoomY = height / LOGICAL_HEIGHT;
        const zoom = Math.min(zoomX, zoomY); // Use min to maintain aspect ratio, max to crop

        this.cameras.main.setZoom(zoom);

        // Center the camera on the logical center of the map (500, 300)
        this.cameras.main.centerOn(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
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

        if (this.clones.length > 0) {
            this.sfx.playReset();
            this.tweens.add({
                targets: this.clones.map(c => c.sprite),
                alpha: { from: 0, to: 0.6 },
                duration: 500
            });
        }

        // Camera flash on normal reset
        this.cameras.main.flash(300, 255, 255, 255);
        this.sfx.stopAllDetectionSounds();
        this.suspicionMeter = 0;
        this.drawVignette(0);
        this.detectedCentralText.setVisible(false).setAlpha(0);

        // Reset loot globally
        this.loots.forEach((l, i) => {
            l.reset(levelData.loot[i].x, levelData.loot[i].y);
        });

        this.securityCameras.forEach(cam => cam.reset());
        this.guards.forEach(g => g.reset());

        this.playerLastInteract = false;
        this.cloneLastInteract = {};
        this.suspicionMeter = 0;
        this.suspicionBarText.setVisible(false);

        const globalLoops = this.registry.get('globalLoops') || 0;
        this.loopCountText.setText(`Level ${this.currentLevelIndex + 1}/3 | Loops: ${globalLoops}`);
    }

    private completeLoop() {
        this.recordedLoops.push(this.recorder.getFrames());
        this.registry.set('globalLoops', this.registry.get('globalLoops') + 1);
        this.startLoop();
    }

    update(_time: number, delta: number) {
        if (!this.registry.get('runActive') || this.won) return;

        // Global Timer Accumulation (unaffected by local level resets)
        const currentGlobalTime = this.registry.get('globalTimer') || 0;
        this.registry.set('globalTimer', currentGlobalTime + (delta / 1000));

        // Format MM:SS.ms
        const timeSec = this.registry.get('globalTimer');
        const m = Math.floor(timeSec / 60);
        const s = (timeSec % 60).toFixed(1);
        this.timerText.setText(`RUN TIME: ${m > 0 ? m + ':' : ''}${s.padStart(4, '0')}`);

        this.updateAccumulator += delta;

        while (this.updateAccumulator >= this.TICK_RATE) {
            this.updateAccumulator -= this.TICK_RATE;
            this.fixedTick();
        }

        this.spawnTimerText.setText(`LOOP TIMER: ${this.loopManager.getTimeRemainingSeconds().toFixed(1)}`);

        // Draw the dynamic vignette if we aren't frozen dead
        if (!this.won) {
            this.drawVignette(this.suspicionMeter / 100);
        }
    }

    private drawVignette(intensity: number) {
        this.redVignette.clear();
        if (intensity <= 0) return;

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Max intensity of the redness is 0.3 during normal suspicion
        const finalAlpha = Math.min(intensity * 0.3, 0.3);

        this.redVignette.fillGradientStyle(0xff0000, 0xff0000, 0xff0000, 0xff0000, 0, 0, finalAlpha, finalAlpha);
        // We simulate a vignette by making a large rect that ignores camera scroll (via setScrollFactor(0))
        this.redVignette.fillRect(0, 0, w, h);
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
        this.securityCameras.forEach(cam => cam.update());
        this.guards.forEach(g => g.update());

        // Process Suspicion
        let anyoneSeen = false;
        this.securityCameras.forEach(cam => {
            let camSaw = false;
            if (cam.canSee(this.player.sprite.getBounds(), this.mapWalls)) camSaw = true;
            this.clones.forEach(clone => {
                if (cam.canSee(clone.sprite.getBounds(), this.mapWalls)) camSaw = true;
            });
            cam.setDetected(camSaw);
            if (camSaw) anyoneSeen = true;
        });

        this.guards.forEach(guard => {
            let guardSaw = false;
            if (guard.canSee(this.player.sprite.getBounds(), this.mapWalls)) guardSaw = true;
            this.clones.forEach(clone => {
                if (guard.canSee(clone.sprite.getBounds(), this.mapWalls)) guardSaw = true;
            });
            guard.setDetected(guardSaw);
            if (guardSaw) anyoneSeen = true;
        });

        if (anyoneSeen) {
            this.suspicionMeter += 20 * (this.TICK_RATE / 1000); // +20% per second
            if (this.suspicionMeter >= 100) {
                this.suspicionMeter = 100;
                this.registry.set('globalAlarms', this.registry.get('globalAlarms') + 1);
                this.failGameDetected();
                return;
            }
        } else {
            this.suspicionMeter -= 10 * (this.TICK_RATE / 1000); // -10% per second
            if (this.suspicionMeter < 0) this.suspicionMeter = 0;
        }

        if (this.suspicionMeter > 0) {
            this.suspicionBarText.setVisible(true);
            this.suspicionBarText.setText(`DETECTED: ${Math.floor(this.suspicionMeter)}%`);
            // Dynamic color
            const intensity = Math.floor((this.suspicionMeter / 100) * 255);
            this.suspicionBarText.setBackgroundColor(`rgb(${intensity}, 0, 0)`);
            this.sfx.setHeartbeatIntensity(this.suspicionMeter / 100);
        } else {
            this.suspicionBarText.setVisible(false);
            this.sfx.setHeartbeatIntensity(0);
        }

        // Track previous states to detect "just pressed"
        const inputState = this.player.getInputState();
        if (!this.playerLastInteract && inputState.interact) {
            this.handleInteract('player', this.player.sprite.x, this.player.sprite.y, this.player.sprite.getBounds());
        }
        this.playerLastInteract = inputState.interact;

        // Interaction UI Prompt Logic
        let nearInteractable = false;
        const pBounds = this.player.sprite.getBounds();
        this.loots.forEach(loot => {
            if (!loot.isCollected && Phaser.Geom.Intersects.RectangleToRectangle(pBounds, loot.sprite.getBounds())) {
                nearInteractable = true;
            }
        });
        const playerCarrying = this.loots.some(l => l.carrierId === 'player');
        if (playerCarrying) nearInteractable = true;

        if (nearInteractable) {
            this.interactPromptText.setVisible(true);
            this.interactPromptText.setPosition(this.player.sprite.x, this.player.sprite.y - 30);
        } else {
            this.interactPromptText.setVisible(false);
        }

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
        let anyDoorOpened = false;

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

            if (!door.isOpen && shouldOpen) {
                anyDoorOpened = true;
            }

            door.updateState(shouldOpen);
        });

        if (anyDoorOpened) {
            this.sfx.playDoor();
        }

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
        this.sfx.playSuccess();
        this.won = true;
        this.player.sprite.setVelocity(0, 0);
        this.clones.forEach(c => c.sprite.setVelocity(0, 0));

        if (this.currentLevelIndex === LEVELS.length - 1) {
            // Speedrun Finished
            this.sfx.stopAllDetectionSounds();
            this.registry.set('runActive', false);
            this.sound.stopAll();

            const time = this.registry.get('globalTimer');
            const loops = this.registry.get('globalLoops');
            const alarms = this.registry.get('globalAlarms');

            (window as any).gameUI.showSummary(time, loops, alarms);
        } else {
            // Transition to next level
            this.loadLevel(this.currentLevelIndex + 1);
        }
    }

    private failGameDetected() {
        this.sfx.playAlarmBurst();
        this.sfx.startSustainedAlarm();

        // Phase 9: Intense Visual Reset
        this.cameras.main.shake(200, 0.015);
        this.cameras.main.flash(200, 255, 0, 0);

        // Vignette sticks at 30% and desaturates slightly via pipeline if we cared (MVP: just hard vignette)
        this.drawVignette(1.0);
        this.detectedCentralText.setPosition(this.cameras.main.width / 2, this.cameras.main.height - 150);
        this.detectedCentralText.setVisible(true).setAlpha(1);

        this.tweens.add({
            targets: this.detectedCentralText,
            alpha: 0,
            duration: 1000,
            ease: 'Power2'
        });

        // Music ducking
        const bgm = this.sound.get('bgm') as Phaser.Sound.WebAudioSound;
        if (bgm && bgm.isPlaying) {
            this.tweens.add({
                targets: bgm,
                volume: 0.05,
                duration: 100,
                yoyo: true,
                hold: 500
            });
        }

        this.won = true; // reusing 'won' as 'frozen' state essentially
        this.player.sprite.setVelocity(0, 0);
        this.clones.forEach(c => c.sprite.setVelocity(0, 0));

        // Auto restart after 1.5 seconds
        this.time.delayedCall(1500, () => {
            this.recorder.clear();
            this.won = false;
            this.startLoop();
        });
    }
}

