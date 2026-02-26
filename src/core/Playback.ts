import { InputFrame } from '../types';

export class Playback {
    private frames: InputFrame[];
    private currentIndex: number = 0;

    constructor(frames: InputFrame[]) {
        this.frames = frames;
    }

    getFrameForTick(tick: number): InputFrame | null {
        if (this.currentIndex < this.frames.length) {
            const nextFrame = this.frames[this.currentIndex];
            // Since we record every active tick, we can just match exactly
            if (nextFrame.tick === tick) {
                this.currentIndex++;
                return nextFrame;
            }

            // If we somehow missed it, find the closest one?
            // In a strict fixed step simulation, ticks match exactly.
        }
        return null;
    }

    getCurrentFrame(): InputFrame | null {
        return this.frames[this.currentIndex] || null;
    }
}
