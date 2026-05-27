// ===== Sheep Sound System (Web Audio API) =====
const SheepSounds = (function () {
    let audioCtx = null;

    function getCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Synthesize a sheep "maaaaaaa" sound
    function playBaa(pitch = 1) {
        const ctx = getCtx();
        const now = ctx.currentTime;
        const duration = 1.4; // Longer "maaaaaaa"

        // === Main voice oscillator ===
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        // "mmm" starts low, then opens up to "aaaa" with a rise
        osc1.frequency.setValueAtTime(180 * pitch, now);          // mmm (closed)
        osc1.frequency.linearRampToValueAtTime(200 * pitch, now + 0.15); // m opening
        osc1.frequency.linearRampToValueAtTime(310 * pitch, now + 0.3);  // maaaA (open)
        osc1.frequency.setValueAtTime(310 * pitch, now + 0.5);          // hold aaaa
        osc1.frequency.linearRampToValueAtTime(290 * pitch, now + 0.8);  // slight drop
        osc1.frequency.linearRampToValueAtTime(300 * pitch, now + 1.0);  // wobble back
        osc1.frequency.linearRampToValueAtTime(250 * pitch, now + 1.2);  // fading
        osc1.frequency.linearRampToValueAtTime(200 * pitch, now + duration); // end

        // === Vibrato LFO (natural wobble in "aaaa") ===
        const vibrato = ctx.createOscillator();
        vibrato.frequency.setValueAtTime(4, now);
        vibrato.frequency.linearRampToValueAtTime(7, now + 0.3);
        vibrato.frequency.setValueAtTime(7, now + 0.8);
        vibrato.frequency.linearRampToValueAtTime(5, now + duration);
        const vibratoGain = ctx.createGain();
        vibratoGain.gain.setValueAtTime(3 * pitch, now);
        vibratoGain.gain.linearRampToValueAtTime(15 * pitch, now + 0.3);
        vibratoGain.gain.setValueAtTime(15 * pitch, now + 0.8);
        vibratoGain.gain.linearRampToValueAtTime(8 * pitch, now + duration);
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc1.frequency);

        // === Second harmonic (nasal resonance) ===
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(360 * pitch, now);
        osc2.frequency.linearRampToValueAtTime(620 * pitch, now + 0.3);
        osc2.frequency.linearRampToValueAtTime(580 * pitch, now + 0.8);
        osc2.frequency.linearRampToValueAtTime(400 * pitch, now + duration);

        // === Third harmonic (adds "maa" character) ===
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(540 * pitch, now);
        osc3.frequency.linearRampToValueAtTime(930 * pitch, now + 0.3);
        osc3.frequency.linearRampToValueAtTime(870 * pitch, now + 0.8);
        osc3.frequency.linearRampToValueAtTime(600 * pitch, now + duration);

        // === Formant filter (mmm → aaaa transition) ===
        const formant = ctx.createBiquadFilter();
        formant.type = 'bandpass';
        formant.Q.value = 5;
        formant.frequency.setValueAtTime(300 * pitch, now);       // "mmm" (nasal, closed)
        formant.frequency.linearRampToValueAtTime(900 * pitch, now + 0.25); // opening to "aaa"
        formant.frequency.setValueAtTime(900 * pitch, now + 0.8);
        formant.frequency.linearRampToValueAtTime(600 * pitch, now + duration);

        // === Noise for breath ===
        const bufferSize = ctx.sampleRate * duration;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1200 * pitch;
        noiseFilter.Q.value = 1.5;

        // === Gain envelopes ===
        // Main voice: soft start (mmm) → loud (aaaa) → fade
        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(0.12, now + 0.05);  // soft "mmm"
        mainGain.gain.linearRampToValueAtTime(0.15, now + 0.15);  // still "mmm"
        mainGain.gain.linearRampToValueAtTime(0.35, now + 0.3);   // opens to "aaaa"
        mainGain.gain.setValueAtTime(0.35, now + 0.5);            // sustain "aaaa"
        mainGain.gain.linearRampToValueAtTime(0.28, now + 0.9);   // gentle fade
        mainGain.gain.linearRampToValueAtTime(0.15, now + 1.15);
        mainGain.gain.linearRampToValueAtTime(0, now + duration);

        const harmGain = ctx.createGain();
        harmGain.gain.setValueAtTime(0, now);
        harmGain.gain.linearRampToValueAtTime(0.03, now + 0.1);
        harmGain.gain.linearRampToValueAtTime(0.1, now + 0.3);
        harmGain.gain.linearRampToValueAtTime(0.06, now + 0.9);
        harmGain.gain.linearRampToValueAtTime(0, now + duration);

        const thirdGain = ctx.createGain();
        thirdGain.gain.setValueAtTime(0, now);
        thirdGain.gain.linearRampToValueAtTime(0.02, now + 0.15);
        thirdGain.gain.linearRampToValueAtTime(0.05, now + 0.3);
        thirdGain.gain.linearRampToValueAtTime(0.03, now + 0.9);
        thirdGain.gain.linearRampToValueAtTime(0, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
        noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.9);
        noiseGain.gain.linearRampToValueAtTime(0, now + duration);

        // Master volume
        const master = ctx.createGain();
        master.gain.value = 0.55;

        // === Connect: voice → formant → gain → master ===
        osc1.connect(formant);
        formant.connect(mainGain);
        osc2.connect(harmGain);
        osc3.connect(thirdGain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        mainGain.connect(master);
        harmGain.connect(master);
        thirdGain.connect(master);
        noiseGain.connect(master);
        master.connect(ctx.destination);

        // Start & stop
        const stopTime = now + duration + 0.05;
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        vibrato.start(now);
        noise.start(now);

        osc1.stop(stopTime);
        osc2.stop(stopTime);
        osc3.stop(stopTime);
        vibrato.stop(stopTime);
        noise.stop(stopTime);
    }

    // Play a happy double-baa
    function playDoubleBaa(pitch = 1) {
        playBaa(pitch);
        setTimeout(() => playBaa(pitch * 1.1), 350);
    }

    // Play a cute little bell chime (festive)
    function playChime() {
        const ctx = getCtx();
        const now = ctx.currentTime;

        const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6

        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = ctx.createGain();
            const startTime = now + i * 0.12;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.8);
        });
    }

    return { playBaa, playDoubleBaa, playChime };
})();

// ===== Particle System (Stars & Crescents) =====
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = Math.random() * 0.2 + 0.1;
            this.opacity = Math.random() * 0.6 + 0.2;
            this.twinkleSpeed = Math.random() * 0.02 + 0.01;
            this.twinkleOffset = Math.random() * Math.PI * 2;
            this.type = Math.random() > 0.85 ? 'crescent' : 'star';
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.01;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;
            this.opacity = (Math.sin(Date.now() * this.twinkleSpeed + this.twinkleOffset) + 1) / 2 * 0.5 + 0.1;

            if (this.y > canvas.height + 10 || this.x < -10 || this.x > canvas.width + 10) {
                this.reset();
                this.y = -10;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;

            if (this.type === 'star') {
                // Draw a star
                ctx.fillStyle = '#d4a855';
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * this.size;
                    const y = Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();

                // Star glow
                ctx.shadowColor = '#d4a855';
                ctx.shadowBlur = this.size * 3;
                ctx.fill();
            } else {
                // Draw crescent
                ctx.fillStyle = '#f0d68a';
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#0a1628';
                ctx.beginPath();
                ctx.arc(this.size * 0.8, -this.size * 0.3, this.size * 1.7, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // Create particles
    const particleCount = Math.min(80, Math.floor(window.innerWidth / 15));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        animationId = requestAnimationFrame(animate);
    }

    animate();
})();


// ===== Lanterns =====
(function initLanterns() {
    const container = document.getElementById('lanterns');
    const lanternEmojis = ['🏮', '🪔'];
    const count = Math.min(6, Math.floor(window.innerWidth / 200));

    for (let i = 0; i < count; i++) {
        const lantern = document.createElement('div');
        lantern.className = 'lantern';
        lantern.textContent = lanternEmojis[i % lanternEmojis.length];
        lantern.style.left = `${(i + 1) * (100 / (count + 1))}%`;
        lantern.style.animationDelay = `${i * 0.5}s`;
        lantern.style.animationDuration = `${3 + Math.random() * 2}s`;
        container.appendChild(lantern);
    }
})();


// ===== Confetti System =====
(function initConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let confettiPieces = [];
    let hasLaunched = false;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    const colors = [
        '#d4a855', '#f0d68a', '#b8860b',  // golds
        '#0d6b3d', '#1a9e5c',              // greens
        '#e74c3c', '#f39c12',              // red, orange
        '#fff',                            // white
    ];

    class Confetti {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = -10;
            this.size = Math.random() * 8 + 4;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.speedY = Math.random() * 3 + 2;
            this.speedX = (Math.random() - 0.5) * 4;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = (Math.random() - 0.5) * 10;
            this.opacity = 1;
            this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
            this.gravity = 0.05;
            this.resistance = 0.98;
        }

        update() {
            this.speedY += this.gravity;
            this.speedX *= this.resistance;
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;

            if (this.y > canvas.height * 0.8) {
                this.opacity -= 0.02;
            }
        }

        draw() {
            if (this.opacity <= 0) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;

            if (this.shape === 'rect') {
                ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    function launchConfetti() {
        for (let i = 0; i < 120; i++) {
            const piece = new Confetti();
            piece.x = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5;
            piece.y = canvas.height * 0.3;
            piece.speedY = -(Math.random() * 8 + 4);
            piece.speedX = (Math.random() - 0.5) * 12;
            confettiPieces.push(piece);
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiPieces = confettiPieces.filter(p => p.opacity > 0 && p.y < canvas.height + 20);
        confettiPieces.forEach(p => {
            p.update();
            p.draw();
        });
        if (confettiPieces.length > 0) {
            requestAnimationFrame(animate);
        }
    }

    // Launch confetti on page load
    setTimeout(() => {
        launchConfetti();
        animate();
    }, 1800);

    // Launch again on sheep click
    const sheepPitches = [0.8, 1.0, 1.3]; // Different pitch for each sheep
    document.querySelectorAll('.sheep').forEach((sheep, idx) => {
        sheep.addEventListener('click', () => {
            // Play sheep sound
            SheepSounds.playDoubleBaa(sheepPitches[idx] || 1);

            launchConfetti();
            if (confettiPieces.length === 120) animate(); // restart if needed

            // Add bounce effect
            sheep.style.animation = 'none';
            sheep.offsetHeight; // trigger reflow
            sheep.style.animation = '';

            // Sheep says "بااااع" - show a speech bubble
            const messages = ['ماااااء 🐑', 'عيد مبارك! 🎉', 'كل سنة وانت طيب 💚'];
            const bubble = document.createElement('div');
            bubble.textContent = messages[idx] || messages[0];

            // Get sheep position to place bubble above it (outside transform context)
            const rect = sheep.getBoundingClientRect();
            const bubbleX = rect.left + rect.width / 2;
            const bubbleY = rect.top - 10;

            bubble.style.cssText = `
                position: fixed;
                top: ${bubbleY}px;
                left: ${bubbleX}px;
                transform: translateX(-50%) translateY(-100%);
                background: rgba(255,255,255,0.95);
                color: #333;
                padding: 8px 16px;
                border-radius: 20px;
                font-family: 'Cairo', sans-serif;
                font-size: 0.9rem;
                font-weight: 700;
                white-space: nowrap;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 1000;
                animation: popUp 0.3s ease-out;
                pointer-events: none;
                direction: rtl;
                unicode-bidi: plaintext;
            `;
            document.body.appendChild(bubble);

            setTimeout(() => bubble.remove(), 2000);
        });
    });

    // Add popup animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes popUp {
            from { transform: translateX(-50%) translateY(10px) scale(0); opacity: 0; }
            to { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
})();


// ===== Scroll Reveal (Greeting Card) =====
(function initScrollReveal() {
    const card = document.querySelector('.greeting-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });

    if (card) observer.observe(card);
})();


// ===== Share Functions =====
function shareWhatsApp() {
    const text = encodeURIComponent('عيد أضحى مبارك 🐑🎉\nكل عام وأنتم بخير\nتقبّل الله منّا ومنكم\n\n' + window.location.href);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareTwitter() {
    const text = encodeURIComponent('عيد أضحى مبارك 🐑🎉\nكل عام وأنتم بخير\nتقبّل الله منّا ومنكم');
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const toast = document.getElementById('copy-toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }).catch(() => {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);

        const toast = document.getElementById('copy-toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    });
}


// ===== Smooth Parallax on Scroll =====
(function initParallax() {
    const crescent = document.querySelector('.crescent-moon');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (crescent) {
            crescent.style.transform = `translateY(${scrollY * 0.3}px)`;
        }
    }, { passive: true });
})();


// ===== Auto-play Takbeer sound-like visual pulse =====
(function initTakbeerPulse() {
    const takbeers = document.querySelectorAll('.takbeer');
    let index = 0;

    setInterval(() => {
        takbeers.forEach(t => t.style.textShadow = 'none');
        if (takbeers[index]) {
            takbeers[index].style.textShadow = '0 0 20px rgba(212, 168, 85, 0.6)';
        }
        index = (index + 1) % takbeers.length;
    }, 2000);
})();

// ===== Welcome Sound on First Interaction =====
(function initWelcomeSound() {
    let hasPlayed = false;

    function playWelcome() {
        if (hasPlayed) return;
        hasPlayed = true;

        // Play festive chime
        SheepSounds.playChime();

        // Then a chorus of sheep baas
        setTimeout(() => SheepSounds.playBaa(0.9), 600);
        setTimeout(() => SheepSounds.playBaa(1.1), 900);
        setTimeout(() => SheepSounds.playBaa(0.75), 1200);

        // Remove listeners after first play
        document.removeEventListener('click', playWelcome);
        document.removeEventListener('touchstart', playWelcome);
        document.removeEventListener('scroll', playWelcome);
    }

    document.addEventListener('click', playWelcome, { once: true });
    document.addEventListener('touchstart', playWelcome, { once: true });
    document.addEventListener('scroll', playWelcome, { once: true });
})();

// ===== Random Ambient Sheep Sounds =====
(function initAmbientSheep() {
    let enabled = false;

    // Start ambient sounds after first interaction
    document.addEventListener('click', () => {
        if (enabled) return;
        enabled = true;

        function randomBaa() {
            const delay = 8000 + Math.random() * 15000; // 8-23 seconds
            setTimeout(() => {
                const pitch = 0.7 + Math.random() * 0.6;
                SheepSounds.playBaa(pitch);
                randomBaa(); // schedule next
            }, delay);
        }

        // Start after a short delay
        setTimeout(randomBaa, 5000);
    }, { once: true });
})();

// ===== Console Eid greeting =====
console.log('%c🐑 عيد أضحى مبارك! 🐑', 'color: #d4a855; font-size: 24px; font-weight: bold;');
console.log('%cكل عام وأنتم بخير', 'color: #1a9e5c; font-size: 16px;');
