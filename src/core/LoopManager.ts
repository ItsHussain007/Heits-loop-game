export class LoopManager {
    private totalTicks: number = 0;
    private loopDurationTicks: number; // 20s * 20 ticks/sec
    private ticksPerSecond: number;

    constructor(loopDurationSeconds: number, ticksPerSecond: number) {
        this.ticksPerSecond = ticksPerSecond;
        this.loopDurationTicks = loopDurationSeconds * ticksPerSecond;
    }

    tick(): boolean {
        this.totalTicks++;
        if (this.totalTicks >= this.loopDurationTicks) {
            this.totalTicks = 0;
            return true; // Loop reached its end and resetting
        }
        return false; // Continuing loop
    }

    getCurrentTick(): number {
        return this.totalTicks;
    }

    getTimeRemainingSeconds(): number {
        return Math.max(0, (this.loopDurationTicks - this.totalTicks) / this.ticksPerSecond);
    }

    reset() {
        this.totalTicks = 0;
    }
}
