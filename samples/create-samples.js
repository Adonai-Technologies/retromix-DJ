/**
 * RetroMix DJ - Sample Generator
 * Creates basic audio samples for the sample pads
 */

// This script uses the Web Audio API to generate simple audio samples
// for testing purposes. In a real application, you would use actual
// audio files for better quality.

// Create audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sample durations in seconds
const durations = {
    'beat1': 1.0,
    'beat2': 1.0,
    'vocal': 1.5,
    'horn': 0.8,
    'scratch': 0.6,
    'drop': 2.0,
    'siren': 1.2,
    'noise': 0.5
};

// Generate samples
generateSamples();

async function generateSamples() {
    console.log('Generating sample files...');
    
    await generateBeat1Sample();
    await generateBeat2Sample();
    await generateVocalSample();
    await generateHornSample();
    await generateScratchSample();
    await generateDropSample();
    await generateSirenSample();
    await generateNoiseSample();
    
    console.log('All samples generated successfully!');
}

// Generate a basic kick drum sample
async function generateBeat1Sample() {
    const duration = durations.beat1;
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        
        // Create a kick drum sound
        for (let i = 0; i < data.length; i++) {
            const t = i / audioContext.sampleRate;
            const frequency = 150 * Math.exp(-20 * t);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-5 * t);
        }
    }
    
    await saveAudioBuffer(buffer, 'beat1.mp3');
}

// Generate a basic snare drum sample
async function generateBeat2Sample() {
    const duration = durations.beat2;
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        
        // Create a snare drum sound (noise + tone)
        for (let i = 0; i < data.length; i++) {
            const t = i / audioContext.sampleRate;
            const noise = Math.random() * 2 - 1;
            const tone = Math.sin(2 * Math.PI * 200 * t);
            data[i] = (noise * 0.7 + tone * 0.3) * Math.exp(-10 * t);
        }
    }
    
    await saveAudioBuffer(buffer, 'beat2.mp3');
}

// Generate a vocal-like sample
async function generateVocalSample() {
    const duration = durations.vocal;
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        
        // Create a vocal-like sound
        for (let i = 0; i < data.length; i++) {
            const t = i / audioContext.sampleRate;
            const frequency = 220 + Math.sin(2 * Math.PI * 2 * t) * 20;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-1 * t);
        }
    }
    
    await saveAudioBuffer(buffer, 'vocal.mp3');
}

// Generate a horn-like sample
async function generateHornSample() {
    const duration = durations.horn;
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        
        // Create a horn-like sound
        for (let i = 0; i < data.length; i++) {
            const t = i / audioContext.sampleRate;
            const frequency = 440;
            const harmonics = Math.sin(2 * Math.PI * frequency * t) +
                             0.5 * Math.sin(2 * Math.PI * frequency * 2 * t) +
                             0.3 * Math.sin(2 * Math.PI * frequency * 3 * t);
            data[i] = harmonics * 0.3 * (1 - Math.exp(-5 * t));
        }
    }
    
    await saveAudioBuffer(buffer, 'horn.mp3');
}

// Generate a scratch-like sample
async function generateScratchSample() {
    const duration = durations.scratch;
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        
        // Create a scratch-like sound
        for (let i = 0; i < data.length; i++) {
            const t = i / audioContext.sampleRate;
            const frequency = 1000 - 900 * t / duration;
            const noise = Math.random() * 0.2;
            data[i] = (Math.sin(2 * Math.PI * frequency * t) + noise) * 0.5;
        }
    }
    
    await saveAudioBuffer(buffer, 'scratch.mp3');
}

// Generate a bass drop sample
async function generateDropSample() {
    const duration = durations.drop;
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        
        // Create a bass drop sound
        for (let i = 0; i < data.length; i++) {
            const t = i / audioContext.sampleRate;
            const frequency = 150 - 100 * t / duration;
            const amplitude = Math.min(1, t * 5) * Math.exp(-1 * (t - 0.2));
            data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
        }
    }
    
    await saveAudioBuffer(buffer, 'drop.mp3');
}

// Generate a siren-like sample
async function generateSirenSample() {
    const duration = durations.siren;
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        
        // Create a siren-like sound
        for (let i = 0; i < data.length; i++) {
            const t = i / audioContext.sampleRate;
            const frequency = 500 + 300 * Math.sin(2 * Math.PI * 1 * t);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * 0.5;
        }
    }
    
    await saveAudioBuffer(buffer, 'siren.mp3');
}

// Generate a noise sample
async function generateNoiseSample() {
    const duration = durations.noise;
    const buffer = audioContext.createBuffer(2, audioContext.sampleRate * duration, audioContext.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        
        // Create a noise sound
        for (let i = 0; i < data.length; i++) {
            const t = i / audioContext.sampleRate;
            data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * t);
        }
    }
    
    await saveAudioBuffer(buffer, 'noise.mp3');
}

// Save audio buffer as MP3 file
async function saveAudioBuffer(buffer, filename) {
    console.log(`Generating ${filename}...`);
    
    // In a browser environment, we would use MediaRecorder to save as MP3
    // Since this is a Node.js script, we'll just log that the file would be saved
    console.log(`Sample ${filename} would be saved (simulation)`);
    
    // In a real implementation, you would use a library like node-audiorecorder
    // or ffmpeg to save the buffer as an MP3 file
    
    return new Promise(resolve => {
        // Simulate saving
        setTimeout(resolve, 100);
    });
}
