import { InputFrame } from '../types';

export class Recorder {
    private frames: InputFrame[] = [];

    record(frame: InputFrame) {
        this.frames.push(frame);
    }

    getFrames(): InputFrame[] {
        return [...this.frames];
    }

    clear() {
        this.frames = [];
    }
}
