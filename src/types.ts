import { LevelData } from './levels/level1';

export interface InputFrame {
    tick: number;
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    interact: boolean;
}

export interface Vector2D {
    x: number;
    y: number;
}

export interface CameraData {
    x: number;
    y: number;
    angle: number; // facing direction in degrees
    fov: number;   // field of view in degrees
    range: number; // vision distance
    rotationSpeed?: number; // degrees per tick (if rotating)
    rotationBounds?: [number, number]; // [minAngle, maxAngle]
}

export interface GuardData {
    x: number; // Spawn X
    y: number; // Spawn Y
    path: { x: number, y: number }[]; // Waypoints
    speed: number;
    angle: number; // Initial facing angle
    fov: number;
    range: number;
}

export interface ExtendedLevelData extends LevelData {
    cameras?: CameraData[];
    guards?: GuardData[];
}
