/**
 * RetroMix DJ - Track Analyzer
 * Analyzes audio tracks for BPM, key, waveform data, and beat grid
 */

class TrackAnalyzer {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.analyzeQueue = [];
        this.isAnalyzing = false;
        
        // Initialize Web Worker for background processing
        this.initWorker();
    }
    
    /**
     * Initialize Web Worker for background processing
     */
    initWorker() {
        try {
            this.worker = new Worker('js/workers/analyzer-worker.js');
            
            this.worker.onmessage = (e) => {
                const { trackId, type, data } = e.data;
                
                // Process results based on type
                switch (type) {
                    case 'bpm':
                        this.handleBPMResult(trackId, data);
                        break;
                    case 'key':
                        this.handleKeyResult(trackId, data);
                        break;
                    case 'beatgrid':
                        this.handleBeatGridResult(trackId, data);
                        break;
                    case 'error':
                        console.error('Worker error:', data);
                        this.processNextInQueue();
                        break;
                }
            };
            
            this.worker.onerror = (error) => {
                console.error('Worker error:', error);
                this.processNextInQueue();
            };
            
            console.log('Track analyzer worker initialized');
        } catch (error) {
            console.error('Failed to initialize analyzer worker:', error);
            // Fall back to main thread processing
            this.worker = null;
        }
    }
    
    /**
     * Analyze a track
     */
    async analyzeTrack(trackId, audioBuffer) {
        return new Promise((resolve, reject) => {
            // Create analysis task
            const task = {
                trackId,
                audioBuffer,
                resolve,
                reject
            };
            
            // Add to queue
            this.analyzeQueue.push(task);
            
            // Start processing if not already running
            if (!this.isAnalyzing) {
                this.processNextInQueue();
            }
        });
    }
    
    /**
     * Process next item in queue
     */
    processNextInQueue() {
        if (this.analyzeQueue.length === 0) {
            this.isAnalyzing = false;
            return;
        }
        
        this.isAnalyzing = true;
        const task = this.analyzeQueue.shift();
        
        // Start analysis
        this.startAnalysis(task);
    }
    
    /**
     * Start analysis of a track
     */
    startAnalysis(task) {
        const { trackId, audioBuffer, resolve, reject } = task;
        
        try {
            // Create result object
            const result = {
                trackId,
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: audioBuffer.numberOfChannels,
                waveformData: this.generateWaveformData(audioBuffer),
                loudnessData: this.analyzeLoudness(audioBuffer)
            };
            
            // If we have a worker, send data for background processing
            if (this.worker) {
                // Extract audio data to send to worker
                const channelData = audioBuffer.getChannelData(0);
                
                // Send to worker for processing
                this.worker.postMessage({
                    trackId,
                    audioData: channelData,
                    sampleRate: audioBuffer.sampleRate
                });
                
                // Store callbacks for when worker completes
                this.currentTask = {
                    trackId,
                    result,
                    resolve,
                    reject
                };
            } else {
                // Process in main thread
                this.processInMainThread(result, audioBuffer).then(() => {
                    resolve(result);
                    this.processNextInQueue();
                }).catch(error => {
                    reject(error);
                    this.processNextInQueue();
                });
            }
        } catch (error) {
            reject(error);
            this.processNextInQueue();
        }
    }
    
    /**
     * Process analysis in main thread (fallback if worker not available)
     */
    async processInMainThread(result, audioBuffer) {
        // Extract channel data
        const channelData = audioBuffer.getChannelData(0);
        
        // Analyze BPM
        const bpmResult = this.detectBPM(channelData, audioBuffer.sampleRate);
        result.bpm = bpmResult.bpm;
        result.beatGrid = bpmResult.beatGrid;
        result.confidence = bpmResult.confidence;
        
        // Analyze key
        result.key = this.detectKey(audioBuffer);
        
        return result;
    }
    
    /**
     * Handle BPM result from worker
     */
    handleBPMResult(trackId, data) {
        if (this.currentTask && this.currentTask.trackId === trackId) {
            this.currentTask.result.bpm = data.bpm;
            this.currentTask.result.confidence = data.confidence;
            
            // Check if we have all results
            this.checkIfAnalysisComplete();
        }
    }
    
    /**
     * Handle key result from worker
     */
    handleKeyResult(trackId, data) {
        if (this.currentTask && this.currentTask.trackId === trackId) {
            this.currentTask.result.key = data.key;
            
            // Check if we have all results
            this.checkIfAnalysisComplete();
        }
    }
    
    /**
     * Handle beat grid result from worker
     */
    handleBeatGridResult(trackId, data) {
        if (this.currentTask && this.currentTask.trackId === trackId) {
            this.currentTask.result.beatGrid = data.beatGrid;
            
            // Check if we have all results
            this.checkIfAnalysisComplete();
        }
    }
    
    /**
     * Check if analysis is complete
     */
    checkIfAnalysisComplete() {
        if (
            this.currentTask &&
            this.currentTask.result.bpm !== undefined &&
            this.currentTask.result.key !== undefined &&
            this.currentTask.result.beatGrid !== undefined
        ) {
            // Analysis complete
            this.currentTask.resolve(this.currentTask.result);
            this.currentTask = null;
            
            // Process next in queue
            this.processNextInQueue();
        }
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
     * Analyze loudness of audio buffer
     */
    analyzeLoudness(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        
        // Calculate RMS (Root Mean Square) in segments
        const segmentSize = Math.floor(audioBuffer.sampleRate * 0.1); // 100ms segments
        const numSegments = Math.ceil(length / segmentSize);
        const rmsValues = new Float32Array(numSegments);
        
        for (let segment = 0; segment < numSegments; segment++) {
            let sumOfSquares = 0;
            let samplesInSegment = 0;
            
            const startSample = segment * segmentSize;
            const endSample = Math.min(startSample + segmentSize, length);
            
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const channelData = audioBuffer.getChannelData(channel);
                
                for (let i = startSample; i < endSample; i++) {
                    sumOfSquares += channelData[i] * channelData[i];
                    samplesInSegment++;
                }
            }
            
            // Calculate RMS for this segment
            rmsValues[segment] = Math.sqrt(sumOfSquares / samplesInSegment);
        }
        
        // Calculate overall loudness metrics
        let peak = 0;
        let sum = 0;
        
        for (let i = 0; i < rmsValues.length; i++) {
            peak = Math.max(peak, rmsValues[i]);
            sum += rmsValues[i];
        }
        
        const average = sum / rmsValues.length;
        
        // Convert to dB
        const peakDb = 20 * Math.log10(peak);
        const averageDb = 20 * Math.log10(average);
        
        return {
            rmsValues,
            peak,
            average,
            peakDb,
            averageDb
        };
    }
    
    /**
     * Detect BPM from audio data
     * This is a simplified implementation - in a real app, we would use a more sophisticated algorithm
     */
    detectBPM(audioData, sampleRate) {
        // Implementation of BPM detection algorithm
        // This is a placeholder - in a real app, we would use a more sophisticated algorithm
        
        // Simulate BPM detection
        const bpm = 120 + Math.random() * 40;
        
        // Generate beat grid
        const beatInterval = 60 / bpm;
        const duration = audioData.length / sampleRate;
        const numBeats = Math.floor(duration / beatInterval) + 1;
        const beatGrid = new Array(numBeats);
        
        for (let i = 0; i < numBeats; i++) {
            beatGrid[i] = i * beatInterval;
        }
        
        return {
            bpm: Math.round(bpm * 10) / 10, // Round to 1 decimal place
            beatGrid: beatGrid,
            confidence: 0.8 // Simulated confidence
        };
    }
    
    /**
     * Detect musical key of audio
     * This is a simplified implementation - in a real app, we would use a more sophisticated algorithm
     */
    detectKey(audioBuffer) {
        // Musical keys
        const keys = [
            'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
        ];
        
        // Simulate key detection
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const randomMode = Math.random() > 0.5 ? 'maj' : 'min';
        
        return `${randomKey} ${randomMode}`;
    }
}

// Export the class
window.TrackAnalyzer = TrackAnalyzer;
