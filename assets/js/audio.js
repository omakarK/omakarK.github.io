/**
 * WoodAudioEngine - Web Audio API Synthesizer for Organic Wooden Sounds
 * Generates natural resonant acoustic clicks, wooden block taps, and chimes.
 */

class WoodAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initAudio();
  }

  initAudio() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
    const unlock = () => {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Authentic solid wooden block click/tap sound
   * Frequency: ~900-1200Hz with fast exponential decay
   */
  playWoodClick(pitchModifier = 1.0) {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Resonator oscillator (Triangle wave gives woody mellow body)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Bandpass filter to simulate hollow wooden chamber resonance
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1150 * pitchModifier, now);
      filter.Q.setValueAtTime(4.2, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880 * pitchModifier, now);
      osc.frequency.exponentialRampToValueAtTime(320 * pitchModifier, now + 0.04);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      // Add a tiny wooden surface click impulse
      const bufferSize = this.ctx.sampleRate * 0.015;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.connect(noiseGain);
      noiseGain.connect(filter);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.07);
      noise.stop(now + 0.03);
    } catch (e) {
      console.debug('Audio playback note:', e);
    }
  }

  /**
   * Deep resonant wooden thud (e.g. placing a solid hardwood block on felt)
   */
  playWoodThud() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.12);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.debug('Audio error:', e);
    }
  }

  /**
   * Harmonious wooden marimba chord (played when item is added to cart)
   */
  playSuccessChime() {
    if (!this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 wooden marimba
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playWoodNote(freq, 0.22);
      }, idx * 65);
    });
  }

  playWoodNote(freq, duration = 0.2) {
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.debug('Audio error:', e);
    }
  }

  /**
   * Subtle wood carving / etching sound for interactive customizer
   */
  playCarveSound() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.05;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.05);
    } catch (e) {
      console.debug('Audio error:', e);
    }
  }
}

// Global instance
window.woodAudio = new WoodAudioEngine();
