/**
 * WolfDEAD - Sound Synthesizer via Web Audio API
 * Tự động tạo hiệu ứng âm thanh sống động 100% bằng code, không cần tải file MP3 bên ngoài.
 */

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    // 1. Tiếng chuông đêm buông xuống (Church/Village Bell)
    playBell() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(220, now);
        osc1.frequency.exponentialRampToValueAtTime(110, now + 2.5);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(330, now);
        osc2.frequency.exponentialRampToValueAtTime(165, now + 2.0);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 3.0);
        osc2.stop(now + 3.0);
    }

    // 2. Tiếng sói hú bí ẩn (Wolf Howl)
    playWolfHowl() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        
        // Cao độ uốn lượn như sói hú
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(420, now + 1.2);
        osc.frequency.linearRampToValueAtTime(460, now + 1.8);
        osc.frequency.linearRampToValueAtTime(220, now + 3.5);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.linearRampToValueAtTime(900, now + 1.5);
        filter.frequency.linearRampToValueAtTime(400, now + 3.5);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.8);
        gain.gain.linearRampToValueAtTime(0.35, now + 2.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 3.5);
    }

    // 3. Tiếng trống kịch tính khi có người chết / công bố kết quả (Dramatic Drum Hit)
    playDrumHit() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
    }

    // 4. Tiếng gõ bàn / bỏ phiếu (Vote Stamp)
    playVoteClick() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // 5. Tiếng gà gáy / bình minh ló dạng (Dawn Chime)
    playDawn() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        // Chuỗi hợp âm ánh sáng
        const freqs = [329.63, 392.00, 493.88, 587.33]; // E4, G4, B4, D5
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.18;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 1.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(start + 1.5);
        });
    }

    // 6. Tiếng pop khi nhân vật nói chuyện (Speech blip)
    playSpeechPop() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450 + Math.random() * 80, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // 7. Nhịp tim hồi hộp (Heartbeat)
    playHeartbeat() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        [0, 0.22].forEach(offset => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + offset;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(65, t);
            osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.15);
        });
    }
}

window.soundManager = new SoundManager();
