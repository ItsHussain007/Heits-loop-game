export class SoundFX {
    private ctx: AudioContext;

    // Channels
    public detectionGain: GainNode;
    public uiGain: GainNode;
    public interactionGain: GainNode;

    // Sustained Sounds
    private heartbeatOsc: OscillatorNode | null = null;
    private heartbeatGain: GainNode | null = null;
    private alarmWailOsc: OscillatorNode | null = null;
    private alarmWailGain: GainNode | null = null;

    constructor() {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

        this.detectionGain = this.ctx.createGain();
        this.detectionGain.connect(this.ctx.destination);

        this.uiGain = this.ctx.createGain();
        this.uiGain.connect(this.ctx.destination);

        this.interactionGain = this.ctx.createGain();
        this.interactionGain.connect(this.ctx.destination);
    }

    private playTone(freq: number, type: OscillatorType, duration: number, channel: GainNode, vol: number = 0.1) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(channel);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playAlarmBurst() {
        // Sharp single burst for trigger moment
        this.playTone(350, 'square', 0.4, this.detectionGain, 0.2);
    }

    startSustainedAlarm() {
        if (this.alarmWailOsc) return; // Already alarming
        if (this.ctx.state === 'suspended') this.ctx.resume();

        this.alarmWailOsc = this.ctx.createOscillator();
        this.alarmWailGain = this.ctx.createGain();

        this.alarmWailOsc.type = 'triangle';
        this.alarmWailGain.gain.value = 0.05; // Low volume alarm loop layer

        // Simple modulating sequence via oscillator frequency connects
        const modOsc = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        modOsc.frequency.value = 4; // 4Hz modulation
        modGain.gain.value = 50; // 50hz pitch variation
        modOsc.connect(modGain);
        modGain.connect(this.alarmWailOsc.frequency);

        this.alarmWailOsc.frequency.value = 400; // Base freq

        this.alarmWailOsc.connect(this.alarmWailGain);
        this.alarmWailGain.connect(this.detectionGain);

        modOsc.start();
        this.alarmWailOsc.start();
    }

    setHeartbeatIntensity(intensity: number) { // intensity 0.0 to 1.0
        if (intensity <= 0) {
            this.stopHeartbeat();
            return;
        }

        if (this.ctx.state === 'suspended') this.ctx.resume();

        if (!this.heartbeatOsc || !this.heartbeatGain) {
            this.heartbeatOsc = this.ctx.createOscillator();
            this.heartbeatGain = this.ctx.createGain();
            this.heartbeatOsc.type = 'sine';
            this.heartbeatOsc.frequency.value = 60; // Deep low frequency

            // LFO for the pulse rhythm
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.type = 'sawtooth';
            lfo.frequency.value = 1.5; // Heart rate
            lfoGain.gain.value = 1;
            lfo.connect(lfoGain);
            lfoGain.connect(this.heartbeatGain.gain);

            this.heartbeatGain.gain.value = 0;
            this.heartbeatOsc.connect(this.heartbeatGain);
            this.heartbeatGain.connect(this.detectionGain);

            this.heartbeatOsc.start();
            lfo.start();
        }

        // Scale volume with intensity (max 0.8)
        const targetVol = intensity * 0.8;
        this.heartbeatGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
    }

    stopHeartbeat() {
        if (this.heartbeatOsc) {
            this.heartbeatOsc.stop();
            this.heartbeatOsc.disconnect();
            this.heartbeatOsc = null;
        }
        if (this.heartbeatGain) {
            this.heartbeatGain.disconnect();
            this.heartbeatGain = null;
        }
    }

    stopAllDetectionSounds() {
        this.stopHeartbeat();
        if (this.alarmWailOsc) {
            this.alarmWailOsc.stop();
            this.alarmWailOsc.disconnect();
            this.alarmWailOsc = null;
        }
        if (this.alarmWailGain) {
            this.alarmWailGain.disconnect();
            this.alarmWailGain = null;
        }
    }

    playReset() {
        // Descending sweep on UI channel
        this.playTone(400, 'sawtooth', 0.5, this.uiGain, 0.2);
    }

    playDoor() {
        // Low mechanical hum
        this.playTone(100, 'triangle', 0.3, this.interactionGain, 0.2);
    }

    playSuccess() {
        // Ascending chime
        this.playTone(400, 'sine', 0.1, this.uiGain, 0.1);
        setTimeout(() => this.playTone(600, 'sine', 0.1, this.uiGain, 0.1), 100);
        setTimeout(() => this.playTone(800, 'sine', 0.4, this.uiGain, 0.1), 200);
    }
}
