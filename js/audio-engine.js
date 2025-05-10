/**
 * RetroMix DJ - Enhanced Audio Engine
 * Includes beat detection and synchronization features
 */

class AudioEngine {
    constructor() {
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master output
        this.masterOutput = this.audioContext.destination;
        
        // Master gain node
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.masterOutput);
        
        // Master analyzer for visualizations
        this.masterAnalyser = this.audioContext.createAnalyser();
        this.masterAnalyser.fftSize = 2048;
        this.masterAnalyser.connect(this.masterGain);
        
        // Decks
        this.decks = {
            left: this.createDeck('left'),
            right: this.createDeck('right')
        };
        
        // Crossfader
        this.crossfader = {
            position: 0.5, // Center position
            curve: 'linear'
        };
        
        // Set initial crossfader position
        this.setCrossfader(this.crossfader.position);
        
        console.log('Audio Engine initialized successfully');
    }
    
    /**
     * Create a deck with all necessary audio nodes
     */
    createDeck(id) {
        const deck = {
            id: id,
            buffer: null,
            source: null,
            gainNode: this.audioContext.createGain(),
            eqHigh: this.createBiquadFilter('highshelf', 3200, 0),
            eqMid: this.createBiquadFilter('peaking', 1000, 0),
            eqLow: this.createBiquadFilter('lowshelf', 320, 0),
            loaded: false,
            isPlaying: false,
            startTime: 0,
            pauseTime: 0,
            playbackRate: 1.0,
            waveformData: null,
            beatTracking: {
                bpm: 0,
                beatGrid: [],
                confidence: 0
            }
        };
        
        // Connect EQ chain
        deck.eqHigh.connect(deck.gainNode);
        deck.eqMid.connect(deck.eqHigh);
        deck.eqLow.connect(deck.eqMid);
        
        // Connect to master output
        deck.gainNode.connect(this.masterAnalyser);
        
        return deck;
    }
    
    /**
     * Create a biquad filter with specified parameters
     */
    createBiquadFilter(type, frequency, gain) {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        if (gain !== undefined) filter.gain.value = gain;
        return filter;
    }
    
    /**
     * Load audio file into a deck
     */
    async loadTrack(deckId, file) {
        console.log(`Loading track into ${deckId} deck:`, file.name);
        const deck = this.decks[deckId];
        
        // If already playing, stop it
        if (deck.isPlaying) {
            this.stopDeck(deckId);
        }
        
        try {
            // Read file as array buffer
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            console.log(`File read successfully, size: ${arrayBuffer.byteLength} bytes`);
            
            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log(`Audio decoded successfully, duration: ${audioBuffer.duration} seconds`);
            
            // Store buffer in deck
            deck.buffer = audioBuffer;
            deck.loaded = true; // Set loaded flag to true
            deck.pauseTime = 0; // Reset pause time
            
            // Generate waveform data
            deck.waveformData = this.generateWaveformData(audioBuffer);
            
            // Trigger BPM detection
            this.detectBPM(deckId, audioBuffer);
            
            console.log(`Track loaded successfully into ${deckId} deck`);
            
            return {
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: audioBuffer.numberOfChannels
            };
        } catch (error) {
            console.error('Error loading track:', error);
            deck.loaded = false;
            deck.buffer = null;
            throw error;
        }
    }
    
    /**
     * Read file as array buffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * Generate waveform data from audio buffer
     */
    generateWaveformData(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        
        // For large files, we'll downsample to improve performance
        const downsampleFactor = Math.max(1, Math.floor(length / 10000));
        const downsampledLength = Math.floor(length / downsampleFactor);
        
        const peaks = new Float32Array(downsampledLength);
        
        // Mix all channels and find peak values
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            
            for (let i = 0; i < downsampledLength; i++) {
                const start = i * downsampleFactor;
                const end = start + downsampleFactor;
                let max = 0;
                
                for (let j = start; j < end; j++) {
                    const absolute = Math.abs(channelData[j]);
                    if (absolute > max) {
                        max = absolute;
                    }
                }
                
                // Mix with existing data (max of both channels)
                if (channel === 0) {
                    peaks[i] = max;
                } else {
                    peaks[i] = Math.max(peaks[i], max);
                }
            }
        }
        
        return {
            peaks: peaks,
            length: downsampledLength,
            duration: audioBuffer.duration,
            sampleRate: sampleRate / downsampleFactor
        };
    }
    
    /**
     * Detect BPM of a track
     */
    detectBPM(deckId, audioBuffer) {
        try {
            // Create a worker for BPM detection
            const worker = new Worker('js/workers/beat-detection-worker.js');
            
            // Extract data for BPM analysis
            const data = audioBuffer.getChannelData(0);
            
            // Send data to worker for processing
            worker.postMessage({
                deckId: deckId,
                audioData: data,
                sampleRate: audioBuffer.sampleRate
            });
            
            // Handle worker response
            worker.onmessage = (e) => {
                const { deckId, bpm, beatGrid, confidence } = e.data;
                
                if (this.decks[deckId]) {
                    this.decks[deckId].beatTracking.bpm = bpm;
                    this.decks[deckId].beatTracking.beatGrid = beatGrid;
                    this.decks[deckId].beatTracking.confidence = confidence;
                    
                    console.log(`BPM detected for ${deckId} deck: ${bpm} (confidence: ${confidence})`);
                    
                    // Dispatch event for UI update
                    const event = new CustomEvent('bpmdetected', {
                        detail: {
                            deckId: deckId,
                            bpm: bpm,
                            confidence: confidence
                        }
                    });
                    document.dispatchEvent(event);
                }
                
                // Terminate worker when done
                worker.terminate();
            };
            
            worker.onerror = (error) => {
                console.error('Beat detection worker error:', error);
                worker.terminate();
            };
        } catch (error) {
            console.error('Error initializing beat detection:', error);
        }
    }
    
    /**
     * Play a deck
     */
    playDeck(deckId) {
        const deck = this.decks[deckId];
        
        // Check if a track is loaded by checking for buffer
        if (!deck.buffer) {
            console.warn(`No track loaded in deck ${deckId}`);
            return false;
        }
        
        console.log(`Playing deck ${deckId}`);
        
        // If already playing, stop first
        if (deck.isPlaying && deck.source) {
            deck.source.stop();
        }
        
        // Create new source
        const source = this.audioContext.createBufferSource();
        source.buffer = deck.buffer;
        
        // Apply playback rate
        source.playbackRate.value = deck.playbackRate;
        
        // Connect source to effect chain
        source.connect(deck.eqLow);
        
        // Store source in deck
        deck.source = source;
        
        // Calculate start position
        let startPosition = 0;
        if (deck.pauseTime > 0) {
            startPosition = deck.pauseTime;
        }
        
        // Start playback
        source.start(0, startPosition);
        deck.startTime = this.audioContext.currentTime - startPosition;
        deck.isPlaying = true;
        
        // Handle track end
        source.onended = () => {
            // Only mark as ended if we're not stopping it manually
            if (deck.isPlaying) {
                deck.isPlaying = false;
                deck.pauseTime = 0;
                
                // Dispatch event for UI update
                const event = new CustomEvent('trackended', {
                    detail: { deckId: deckId }
                });
                document.dispatchEvent(event);
            }
        };
        
        return true;
    }
    
    /**
     * Pause a deck
     */
    pauseDeck(deckId) {
        const deck = this.decks[deckId];
        
        if (!deck.isPlaying || !deck.source) {
            return false;
        }
        
        // Calculate current position
        deck.pauseTime = this.getCurrentTime(deckId);
        
        // Stop source
        deck.source.stop();
        deck.source = null;
        deck.isPlaying = false;
        
        return true;
    }
    
    /**
     * Stop a deck (reset to beginning)
     */
    stopDeck(deckId) {
        const deck = this.decks[deckId];
        
        if (deck.source) {
            deck.source.stop();
            deck.source = null;
        }
        
        deck.isPlaying = false;
        deck.pauseTime = 0;
        
        return true;
    }
    
    /**
     * Get current playback time of a deck
     */
    getCurrentTime(deckId) {
        const deck = this.decks[deckId];
        
        if (!deck.isPlaying) {
            return deck.pauseTime;
        }
        
        return (this.audioContext.currentTime - deck.startTime) * deck.playbackRate;
    }
    
    /**
     * Set playback rate of a deck (pitch/tempo)
     */
    setPlaybackRate(deckId, rate) {
        const deck = this.decks[deckId];
        deck.playbackRate = rate;
        
        if (deck.source) {
            deck.source.playbackRate.value = rate;
        }
        
        // Dispatch event for UI update
        const event = new CustomEvent('ratechanged', {
            detail: {
                deckId: deckId,
                rate: rate
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Set EQ gain for a deck
     */
    setEQ(deckId, band, gain) {
        const deck = this.decks[deckId];
        
        switch (band) {
            case 'high':
                deck.eqHigh.gain.value = gain;
                break;
            case 'mid':
                deck.eqMid.gain.value = gain;
                break;
            case 'low':
                deck.eqLow.gain.value = gain;
                break;
        }
    }
    
    /**
     * Set volume for a deck
     */
    setVolume(deckId, volume) {
        this.decks[deckId].gainNode.gain.value = volume;
    }
    
    /**
     * Set crossfader position
     * 0 = full left, 0.5 = center, 1 = full right
     */
    setCrossfader(position, curve = 'linear') {
        this.crossfader.position = position;
        this.crossfader.curve = curve;
        
        // Calculate gains based on curve type
        let leftGain, rightGain;
        
        switch (curve) {
            case 'constant-power':
                // Constant power curve (equal power crossfade)
                leftGain = Math.cos(position * Math.PI / 2);
                rightGain = Math.cos((1 - position) * Math.PI / 2);
                break;
            
            case 'exponential':
                // Exponential curve
                leftGain = Math.pow(1 - position, 2);
                rightGain = Math.pow(position, 2);
                break;
            
            case 'linear':
            default:
                // Linear curve
                leftGain = 1 - position;
                rightGain = position;
                break;
        }
        
        // Apply gains
        this.decks.left.gainNode.gain.value = leftGain;
        this.decks.right.gainNode.gain.value = rightGain;
    }
    
    /**
     * Get analyzer data for visualizations
     */
    getAnalyzerData(type = 'frequency') {
        if (!this.masterAnalyser) {
            return null;
        }
        
        const bufferLength = this.masterAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        if (type === 'frequency') {
            this.masterAnalyser.getByteFrequencyData(dataArray);
        } else if (type === 'waveform') {
            this.masterAnalyser.getByteTimeDomainData(dataArray);
        }
        
        return dataArray;
    }
    
    /**
     * Check if a deck has a track loaded
     */
    isDeckLoaded(deckId) {
        return this.decks[deckId].loaded && this.decks[deckId].buffer !== null;
    }
    
    /**
     * Resume audio context if suspended
     */
    resumeAudioContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    /**
     * Jump to a specific beat in a track
     */
    jumpToBeat(deckId, beatIndex) {
        const deck = this.decks[deckId];
        
        if (!deck.beatTracking.beatGrid || beatIndex >= deck.beatTracking.beatGrid.length) {
            console.warn(`Invalid beat index: ${beatIndex}`);
            return false;
        }
        
        const beatTime = deck.beatTracking.beatGrid[beatIndex];
        
        // If playing, restart at new position
        if (deck.isPlaying) {
            if (deck.source) {
                deck.source.stop();
            }
            
            const source = this.audioContext.createBufferSource();
            source.buffer = deck.buffer;
            source.playbackRate.value = deck.playbackRate;
            source.connect(deck.eqLow);
            
            source.start(0, beatTime);
            deck.source = source;
            deck.startTime = this.audioContext.currentTime - beatTime;
            
            // Handle track end
            source.onended = () => {
                if (deck.isPlaying) {
                    deck.isPlaying = false;
                    deck.pauseTime = 0;
                    
                    const event = new CustomEvent('trackended', {
                        detail: { deckId: deckId }
                    });
                    document.dispatchEvent(event);
                }
            };
        } else {
            // Just update pause time
            deck.pauseTime = beatTime;
        }
        
        return true;
    }
    
    /**
     * Get BPM for a deck
     */
    getBPM(deckId) {
        return this.decks[deckId].beatTracking.bpm;
    }
    
    /**
     * Get effective BPM (accounting for playback rate)
     */
    getEffectiveBPM(deckId) {
        const baseBPM = this.decks[deckId].beatTracking.bpm;
        const playbackRate = this.decks[deckId].playbackRate;
        return baseBPM * playbackRate;
    }
    
    /**
     * Sync tempo of target deck to source deck
     */
    syncTempo(sourceDeckId, targetDeckId) {
        const sourceBPM = this.getEffectiveBPM(sourceDeckId);
        const targetBaseBPM = this.decks[targetDeckId].beatTracking.bpm;
        
        if (sourceBPM <= 0 || targetBaseBPM <= 0) {
            console.warn('Cannot sync tempo: Invalid BPM values');
            return false;
        }
        
        // Calculate required playback rate
        const newRate = sourceBPM / targetBaseBPM;
        
        // Apply to target deck
        this.setPlaybackRate(targetDeckId, newRate);
        
        console.log(`Synced ${targetDeckId} deck tempo to ${sourceDeckId} deck (${sourceBPM.toFixed(1)} BPM)`);
        return true;
    }
}

// Export the class
window.AudioEngine = AudioEngine;
