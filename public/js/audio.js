export class RaceAudio {
  constructor() {
    this.enabled = localStorage.getItem('apexShiftMuted') !== 'true';
    this.context = null;
    this.master = null;
    this.engine = null;
    this.engineGain = null;
  }

  getMuted() {
    return !this.enabled;
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('apexShiftMuted', String(!this.enabled));
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.enabled ? 0.22 : 0, this.context.currentTime, 0.04);
    }
    return !this.enabled;
  }

  ensureContext() {
    if (!this.context) {
      this.context = new window.AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.enabled ? 0.22 : 0;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume();
  }

  startEngine() {
    this.ensureContext();
    if (this.engine) return;
    this.engine = this.context.createOscillator();
    this.engine.type = 'sawtooth';
    this.engine.frequency.value = 58;
    this.engineGain = this.context.createGain();
    this.engineGain.gain.value = 0.09;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 170;
    this.engine.connect(filter).connect(this.engineGain).connect(this.master);
    this.engine.start();
  }

  stopEngine() {
    if (!this.engine) return;
    this.engine.stop();
    this.engine.disconnect();
    this.engine = null;
  }

  pass() {
    this.beep(620, 0.07, 'triangle', 0.12);
  }

  crash() {
    this.beep(105, 0.28, 'sawtooth', 0.32);
    window.setTimeout(() => this.beep(74, 0.26, 'triangle', 0.22), 85);
  }

  beep(frequency, duration, type, volume) {
    this.ensureContext();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}