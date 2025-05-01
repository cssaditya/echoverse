// Audio Context Setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Audio effects
const masterGain = audioContext.createGain();
const reverbNode = audioContext.createConvolver();
const delayNode = audioContext.createDelay();
const filterNode = audioContext.createBiquadFilter();
const compressor = audioContext.createDynamicsCompressor();

// Setup audio chain
masterGain.connect(compressor);
compressor.connect(audioContext.destination);
filterNode.connect(masterGain);
delayNode.connect(filterNode);

// Create reverb impulse
function createReverb() {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 2;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const decay = Math.exp(-i / (sampleRate * 0.5));
        leftChannel[i] = (Math.random() * 2 - 1) * decay;
        rightChannel[i] = (Math.random() * 2 - 1) * decay;
    }

    reverbNode.buffer = impulse;
}

createReverb();

// Track features for sound generation
let currentFeatures = {
    energy: 0.5,
    danceability: 0.5,
    valence: 0.5,
    tempo: 120
};

// Musical scales for different moods
const scales = {
    happy: [0, 2, 4, 7, 9], // Major pentatonic
    sad: [0, 3, 5, 7, 10],  // Minor pentatonic
    neutral: [0, 2, 3, 5, 7, 8, 10] // Natural minor
};

// Update track features
function updateTrackFeatures(features) {
    console.log('Updating track features:', features);
    currentFeatures = features;
    
    // Update audio effects based on features
    masterGain.gain.value = 0.3 + (features.energy * 0.2);
    filterNode.frequency.value = 200 + (features.energy * 2000);
    delayNode.delayTime.value = 0.1 + (features.danceability * 0.2);
    
    // Update compressor settings
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
}

// Create a musical layer
function createLayer(baseFreq, type, volume, duration) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    
    osc.type = type;
    osc.frequency.value = baseFreq;
    
    // Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    // Effects routing
    osc.connect(gain);
    gain.connect(delayNode);
    gain.connect(filterNode);
    gain.connect(reverbNode);
    reverbNode.connect(masterGain);
    
    return { osc, gain, startTime: now };
}

// Play remixed sound based on track features
function playTrackSound() {
    if (!currentFeatures) return;
    
    const now = audioContext.currentTime;
    
    // Choose scale based on valence (happiness)
    const scale = currentFeatures.valence > 0.6 ? scales.happy : 
                 currentFeatures.valence < 0.4 ? scales.sad : 
                 scales.neutral;
    
    // Base frequency calculations
    const baseFreq = 220; // A3
    const tempo = currentFeatures.tempo;
    const beatDuration = 60 / tempo;
    
    // Create multiple layers of sound
    const layers = [];
    
    // Bass layer
    layers.push(createLayer(baseFreq, 'sine', 0.3, beatDuration * 2));
    
    // Chord layer
    scale.forEach((note, i) => {
        if (i % 2 === 0) { // Create chord with alternate notes
            const freq = baseFreq * Math.pow(2, note / 12);
            layers.push(createLayer(freq, 'triangle', 0.15, beatDuration));
        }
    });
    
    // Melody layer
    if (currentFeatures.energy > 0.5) {
        const melodyNote = scale[Math.floor(Math.random() * scale.length)];
        const melodyFreq = baseFreq * 2 * Math.pow(2, melodyNote / 12);
        layers.push(createLayer(melodyFreq, 'sawtooth', 0.1, beatDuration * 0.5));
    }
    
    // Rhythm layer
    if (currentFeatures.danceability > 0.5) {
        const rhythmFreq = baseFreq * 4;
        layers.push(createLayer(rhythmFreq, 'square', 0.05, beatDuration * 0.25));
    }
    
    // Start all oscillators
    layers.forEach(layer => {
        layer.osc.start(layer.startTime);
        layer.osc.stop(layer.startTime + beatDuration * 2);
    });
}

// Export functions
window.audioAPI = {
    audioContext,
    playTrackSound,
    updateTrackFeatures
}; 