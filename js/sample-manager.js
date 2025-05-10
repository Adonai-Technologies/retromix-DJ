/**
 * RetroMix DJ - Sample Manager
 * Handles loading and playing audio samples for the sample pads
 */

class SampleManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.samples = {};
        this.isLoading = false;
        this.loadingProgress = 0;
        this.totalSamples = 0;
        this.loadedSamples = 0;
        
        // Default sample URLs
        this.sampleUrls = {
            'pad-1': 'samples/beat1.mp3',
            'pad-2': 'samples/beat2.mp3',
            'pad-3': 'samples/vocal.mp3',
            'pad-4': 'samples/horn.mp3',
            'pad-5': 'samples/scratch.mp3',
            'pad-6': 'samples/drop.mp3',
            'pad-7': 'samples/siren.mp3',
            'pad-8': 'samples/noise.mp3'
        };
    }
    
    /**
     * Load all default samples
     */
    async loadDefaultSamples() {
        this.isLoading = true;
        this.loadingProgress = 0;
        this.totalSamples = Object.keys(this.sampleUrls).length;
        this.loadedSamples = 0;
        
        // Create event for loading progress
        const progressEvent = new CustomEvent('sampleloadingprogress', {
            detail: {
                progress: 0,
                total: this.totalSamples,
                loaded: 0
            }
        });
        document.dispatchEvent(progressEvent);
        
        // Load each sample
        const loadPromises = [];
        for (const [id, url] of Object.entries(this.sampleUrls)) {
            loadPromises.push(this.loadSample(id, url));
        }
        
        // Wait for all samples to load
        await Promise.all(loadPromises);
        
        this.isLoading = false;
        
        // Create event for loading complete
        const completeEvent = new CustomEvent('sampleloadingcomplete', {
            detail: {
                total: this.totalSamples,
                loaded: this.loadedSamples
            }
        });
        document.dispatchEvent(completeEvent);
        
        return this.loadedSamples;
    }
    
    /**
     * Load a sample from URL
     */
    async loadSample(id, url) {
        try {
            console.log(`Loading sample: ${id} from ${url}`);
            
            // Try to fetch the sample
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioEngine.audioContext.decodeAudioData(arrayBuffer);
            
            // Create gain node for volume control
            const gainNode = this.audioEngine.audioContext.createGain();
            gainNode.connect(this.audioEngine.masterAnalyser);
            
            // Store sample
            this.samples[id] = {
                buffer: audioBuffer,
                gain: gainNode
            };
            
            // Update loading progress
            this.loadedSamples++;
            this.loadingProgress = this.loadedSamples / this.totalSamples;
            
            // Create event for loading progress
            const progressEvent = new CustomEvent('sampleloadingprogress', {
                detail: {
                    progress: this.loadingProgress,
                    total: this.totalSamples,
                    loaded: this.loadedSamples
                }
            });
            document.dispatchEvent(progressEvent);
            
            console.log(`Sample loaded: ${id}`);
            return true;
        } catch (error) {
            console.error(`Error loading sample ${id}:`, error);
            
            // Create a silent buffer as fallback
            const sampleRate = this.audioEngine.audioContext.sampleRate;
            const buffer = this.audioEngine.audioContext.createBuffer(2, sampleRate * 0.5, sampleRate);
            const gainNode = this.audioEngine.audioContext.createGain();
            gainNode.connect(this.audioEngine.masterAnalyser);
            
            // Store fallback sample
            this.samples[id] = {
                buffer: buffer,
                gain: gainNode,
                isFallback: true
            };
            
            // Update loading progress
            this.loadedSamples++;
            this.loadingProgress = this.loadedSamples / this.totalSamples;
            
            return false;
        }
    }
    
    /**
     * Play a sample
     */
    playSample(id, volume = 1.0) {
        const sample = this.samples[id];
        
        if (!sample || !sample.buffer) {
            console.warn(`Sample not loaded: ${id}`);
            return false;
        }
        
        try {
            // Create source
            const source = this.audioEngine.audioContext.createBufferSource();
            source.buffer = sample.buffer;
            
            // Set volume
            sample.gain.gain.value = volume;
            
            // Connect and play
            source.connect(sample.gain);
            source.start();
            
            // Create event for sample played
            const playEvent = new CustomEvent('sampleplayed', {
                detail: {
                    id: id,
                    isFallback: sample.isFallback || false
                }
            });
            document.dispatchEvent(playEvent);
            
            console.log(`Playing sample: ${id}`);
            return true;
        } catch (error) {
            console.error(`Error playing sample ${id}:`, error);
            return false;
        }
    }
    
    /**
     * Set sample volume
     */
    setSampleVolume(id, volume) {
        const sample = this.samples[id];
        
        if (!sample) {
            return false;
        }
        
        sample.gain.gain.value = Math.max(0, Math.min(1, volume));
        return true;
    }
    
    /**
     * Load a custom sample
     */
    async loadCustomSample(id, file) {
        try {
            console.log(`Loading custom sample for ${id}`);
            
            // Read file as array buffer
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const audioBuffer = await this.audioEngine.audioContext.decodeAudioData(arrayBuffer);
            
            // Create gain node for volume control
            const gainNode = this.audioEngine.audioContext.createGain();
            gainNode.connect(this.audioEngine.masterAnalyser);
            
            // Store sample
            this.samples[id] = {
                buffer: audioBuffer,
                gain: gainNode,
                fileName: file.name
            };
            
            // Create event for custom sample loaded
            const loadEvent = new CustomEvent('customsampleloaded', {
                detail: {
                    id: id,
                    fileName: file.name
                }
            });
            document.dispatchEvent(loadEvent);
            
            console.log(`Custom sample loaded for ${id}: ${file.name}`);
            return true;
        } catch (error) {
            console.error(`Error loading custom sample for ${id}:`, error);
            return false;
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
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * Get sample info
     */
    getSampleInfo(id) {
        const sample = this.samples[id];
        
        if (!sample) {
            return null;
        }
        
        return {
            duration: sample.buffer.duration,
            fileName: sample.fileName || this.sampleUrls[id],
            isFallback: sample.isFallback || false
        };
    }
}

// Export the class
window.SampleManager = SampleManager;
