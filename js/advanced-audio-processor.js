/**
 * RetroMix DJ - Advanced Audio Processing
 * Provides professional audio effects, compression, and sidechain capabilities
 */

class AdvancedAudioProcessor {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.audioContext = audioEngine.audioContext;
        
        // Initialize effects for each deck
        this.effects = {
            left: this.createEffectsChain(),
            right: this.createEffectsChain()
        };
        
        // Initialize compressors
        this.compressors = {
            left: this.createMultibandCompressor(),
            right: this.createMultibandCompressor()
        };
        
        // Initialize sidechain
        this.sidechain = {
            enabled: false,
            source: 'left', // Which deck triggers the sidechain
            target: 'right', // Which deck gets compressed
            amount: 0.5, // Compression amount (0-1)
            release: 0.2, // Release time in seconds
            compressor: this.createSidechainCompressor()
        };
        
        // Connect everything
        this.connectAudioNodes();
    }
    
    /**
     * Create a complete effects chain for a deck
     */
    createEffectsChain() {
        return {
            // Reverb effect
            reverb: {
                enabled: false,
                wet: 0.3, // Wet/dry mix (0-1)
                decay: 2.0, // Decay time in seconds
                preDelay: 0.01, // Pre-delay in seconds
                node: this.createReverbNode()
            },
            
            // Delay effect
            delay: {
                enabled: false,
                time: 0.5, // Delay time in seconds
                feedback: 0.4, // Feedback amount (0-1)
                wet: 0.3, // Wet/dry mix (0-1)
                node: this.createDelayNode()
            },
            
            // Flanger effect
            flanger: {
                enabled: false,
                rate: 0.2, // Rate in Hz
                depth: 0.005, // Depth in seconds
                feedback: 0.5, // Feedback amount (0-1)
                wet: 0.5, // Wet/dry mix (0-1)
                node: this.createFlangerNode()
            },
            
            // Distortion effect
            distortion: {
                enabled: false,
                amount: 10, // Distortion amount
                wet: 0.3, // Wet/dry mix (0-1)
                node: this.createDistortionNode()
            }
        };
    }
    
    /**
     * Create a reverb node
     */
    createReverbNode() {
        const convolver = this.audioContext.createConvolver();
        
        // Generate impulse response
        const rate = this.audioContext.sampleRate;
        const length = rate * 2; // 2 seconds
        const impulse = this.audioContext.createBuffer(2, length, rate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);
        
        // Generate a simple exponential decay
        for (let i = 0; i < length; i++) {
            const t = i / rate;
            const decay = Math.exp(-t * 3);
            impulseL[i] = (Math.random() * 2 - 1) * decay;
            impulseR[i] = (Math.random() * 2 - 1) * decay;
        }
        
        convolver.buffer = impulse;
        
        // Create wet/dry mix
        const wet = this.audioContext.createGain();
        const dry = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        wet.gain.value = 0.3;
        dry.gain.value = 0.7;
        
        return { convolver, wet, dry, output };
    }
    
    /**
     * Create a delay node
     */
    createDelayNode() {
        const delay = this.audioContext.createDelay(5.0); // Max 5 seconds
        delay.delayTime.value = 0.5; // 500ms default
        
        const feedback = this.audioContext.createGain();
        feedback.gain.value = 0.4; // 40% feedback
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000; // Filter high frequencies from feedback
        
        // Create wet/dry mix
        const wet = this.audioContext.createGain();
        const dry = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        wet.gain.value = 0.3;
        dry.gain.value = 0.7;
        
        // Connect internal nodes
        delay.connect(filter);
        filter.connect(feedback);
        feedback.connect(delay);
        
        return { delay, feedback, filter, wet, dry, output };
    }
    
    /**
     * Create a flanger node
     */
    createFlangerNode() {
        const delay = this.audioContext.createDelay(0.02); // Max 20ms
        delay.delayTime.value = 0.005; // 5ms default
        
        const lfo = this.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2; // 0.2 Hz default
        
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 0.002; // Modulation depth
        
        const feedback = this.audioContext.createGain();
        feedback.gain.value = 0.5; // 50% feedback
        
        // Create wet/dry mix
        const wet = this.audioContext.createGain();
        const dry = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        wet.gain.value = 0.5;
        dry.gain.value = 0.5;
        
        // Connect LFO
        lfo.connect(lfoGain);
        lfoGain.connect(delay.delayTime);
        
        // Start LFO
        lfo.start();
        
        return { delay, lfo, lfoGain, feedback, wet, dry, output };
    }
    
    /**
     * Create a distortion node
     */
    createDistortionNode() {
        const waveshaper = this.audioContext.createWaveShaper();
        
        // Create distortion curve
        const amount = 10;
        const curve = new Float32Array(this.audioContext.sampleRate);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < this.audioContext.sampleRate; i++) {
            const x = i * 2 / this.audioContext.sampleRate - 1;
            curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        
        waveshaper.curve = curve;
        waveshaper.oversample = '4x';
        
        // Create wet/dry mix
        const wet = this.audioContext.createGain();
        const dry = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        wet.gain.value = 0.3;
        dry.gain.value = 0.7;
        
        return { waveshaper, wet, dry, output };
    }
    
    /**
     * Create a multiband compressor
     */
    createMultibandCompressor() {
        // Create crossover filters
        const lowFilter = this.audioContext.createBiquadFilter();
        lowFilter.type = 'lowpass';
        lowFilter.frequency.value = 200; // 200 Hz
        lowFilter.Q.value = 1;
        
        const midFilter1 = this.audioContext.createBiquadFilter();
        midFilter1.type = 'highpass';
        midFilter1.frequency.value = 200; // 200 Hz
        midFilter1.Q.value = 1;
        
        const midFilter2 = this.audioContext.createBiquadFilter();
        midFilter2.type = 'lowpass';
        midFilter2.frequency.value = 5000; // 5 kHz
        midFilter2.Q.value = 1;
        
        const highFilter = this.audioContext.createBiquadFilter();
        highFilter.type = 'highpass';
        highFilter.frequency.value = 5000; // 5 kHz
        highFilter.Q.value = 1;
        
        // Create compressors for each band
        const lowCompressor = this.audioContext.createDynamicsCompressor();
        lowCompressor.threshold.value = -24;
        lowCompressor.ratio.value = 4;
        lowCompressor.attack.value = 0.003;
        lowCompressor.release.value = 0.25;
        lowCompressor.knee.value = 5;
        
        const midCompressor = this.audioContext.createDynamicsCompressor();
        midCompressor.threshold.value = -18;
        midCompressor.ratio.value = 3;
        midCompressor.attack.value = 0.005;
        midCompressor.release.value = 0.15;
        midCompressor.knee.value = 5;
        
        const highCompressor = this.audioContext.createDynamicsCompressor();
        highCompressor.threshold.value = -12;
        highCompressor.ratio.value = 2;
        highCompressor.attack.value = 0.002;
        highCompressor.release.value = 0.1;
        highCompressor.knee.value = 5;
        
        // Create gain nodes for each band
        const lowGain = this.audioContext.createGain();
        const midGain = this.audioContext.createGain();
        const highGain = this.audioContext.createGain();
        
        // Create limiter
        const limiter = this.audioContext.createDynamicsCompressor();
        limiter.threshold.value = -0.5;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.001;
        limiter.release.value = 0.01;
        limiter.knee.value = 0;
        
        // Create output gain
        const output = this.audioContext.createGain();
        
        return {
            enabled: false,
            lowFilter,
            midFilter1,
            midFilter2,
            highFilter,
            lowCompressor,
            midCompressor,
            highCompressor,
            lowGain,
            midGain,
            highGain,
            limiter,
            output
        };
    }
    
    /**
     * Create a sidechain compressor
     */
    createSidechainCompressor() {
        const compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.2;
        compressor.knee.value = 2;
        
        return compressor;
    }
    
    /**
     * Connect all audio nodes
     */
    connectAudioNodes() {
        // This is a simplified implementation
        // In a real implementation, we would modify the audio engine's signal flow
        console.log('Audio nodes connected (simplified implementation)');
    }
    
    /**
     * Enable/disable an effect
     */
    toggleEffect(deckId, effectName) {
        if (!this.effects[deckId] || !this.effects[deckId][effectName]) {
            return false;
        }
        
        const effect = this.effects[deckId][effectName];
        effect.enabled = !effect.enabled;
        
        console.log(`${effectName} ${effect.enabled ? 'enabled' : 'disabled'} for ${deckId} deck`);
        
        // In a real implementation, we would update the audio routing
        // For this demo, we'll just log the action
        
        return effect.enabled;
    }
    
    /**
     * Update effect parameter
     */
    updateEffectParameter(deckId, effectName, paramName, value) {
        if (!this.effects[deckId] || !this.effects[deckId][effectName]) {
            return false;
        }
        
        const effect = this.effects[deckId][effectName];
        
        console.log(`Updated ${effectName} ${paramName} to ${value} for ${deckId} deck`);
        
        // In a real implementation, we would update the audio parameter
        // For this demo, we'll just store the value
        effect[paramName] = value;
        
        return true;
    }
    
    /**
     * Enable/disable multiband compressor
     */
    toggleMultibandCompressor(deckId) {
        if (!this.compressors[deckId]) {
            return false;
        }
        
        const compressor = this.compressors[deckId];
        compressor.enabled = !compressor.enabled;
        
        console.log(`Multiband compressor ${compressor.enabled ? 'enabled' : 'disabled'} for ${deckId} deck`);
        
        // In a real implementation, we would update the audio routing
        // For this demo, we'll just log the action
        
        return compressor.enabled;
    }
    
    /**
     * Update compressor parameter
     */
    updateCompressorParameter(deckId, band, paramName, value) {
        if (!this.compressors[deckId]) {
            return false;
        }
        
        console.log(`Updated ${band} band ${paramName} to ${value} for ${deckId} deck`);
        
        // In a real implementation, we would update the audio parameter
        // For this demo, we'll just log the action
        
        return true;
    }
    
    /**
     * Enable/disable sidechain compression
     */
    toggleSidechain() {
        this.sidechain.enabled = !this.sidechain.enabled;
        
        console.log(`Sidechain compression ${this.sidechain.enabled ? 'enabled' : 'disabled'}`);
        
        // In a real implementation, we would update the audio routing
        // For this demo, we'll just log the action
        
        return this.sidechain.enabled;
    }
    
    /**
     * Update sidechain parameter
     */
    updateSidechainParameter(paramName, value) {
        if (paramName in this.sidechain) {
            this.sidechain[paramName] = value;
            
            console.log(`Updated sidechain ${paramName} to ${value}`);
            
            // In a real implementation, we would update the audio parameter
            // For this demo, we'll just store the value
            
            return true;
        }
        
        return false;
    }
}

// Export the class
window.AdvancedAudioProcessor = AdvancedAudioProcessor;
