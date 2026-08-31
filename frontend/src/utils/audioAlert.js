/**
 * ResQNet Web Audio API Tactical Alert Synthesizer
 * Generates subtle, zero-dependency tactical acoustic alert chimes for Disaster Mode events.
 */
class TacticalAudioAlert {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setMuted(val) {
    this.isMuted = Boolean(val);
  }

  /**
   * Plays a subtle, non-intrusive dual-tone tactical alert chime (587Hz -> 880Hz)
   */
  playTacticalAlert() {
    if (this.isMuted) return;

    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Master Gain for smooth volume fade
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      masterGain.connect(this.ctx.destination);

      // Primary tactical tone (587Hz - D5)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.18); // Glide to A5
      osc1.connect(masterGain);

      // Secondary subtle harmonic (sub-bass 293Hz)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, now);
      osc2.connect(masterGain);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn('Tactical audio playback skipped:', err.message);
    }
  }
}

export const audioAlert = new TacticalAudioAlert();
