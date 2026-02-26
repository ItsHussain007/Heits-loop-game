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
