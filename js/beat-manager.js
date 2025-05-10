/**
 * RetroMix DJ - Beat Manager
 * Handles beat detection, synchronization, and beat grid visualization
 */

class BeatManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.beatDetectionWorker = null;
        this.beatGridData = {
            left: {
                bpm: 0,
                beatGrid: [],
                confidence: 0,
                phase: 0
            },
            right: {
                bpm: 0,
                beatGrid: [],
                confidence: 0,
                phase: 0
            }
        };
        
        // Beat counters for visual metronome
        this.beatCounters = {
            left: 0,
            right: 0
        };
        
        // Beat sync settings
        this.syncSettings = {
            tempoSync: true,
            phaseSync: true,
            keySync: false
        };
        
        // Initialize beat detection worker
        this.initBeatDetectionWorker();
        
        // Start beat tracking loop
        this.startBeatTracking();
    }
    
    /**
     * Initialize beat detection worker
     */
    initBeatDetectionWorker() {
        try {
            this.beatDetectionWorker = new Worker('js/workers/beat-detection-worker.js');
            
            this.beatDetectionWorker.onmessage = (e) => {
                const { deckId, bpm, beatGrid, confidence } = e.data;
                
                // Store beat grid data
                this.beatGridData[deckId].bpm = bpm;
                this.beatGridData[deckId].beatGrid = beatGrid;
                this.beatGridData[deckId].confidence = confidence;
                
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
            };
            
            console.log('Beat detection worker initialized');
        } catch (error) {
            console.error('Failed to initialize beat detection worker:', error);
            // Fall back to main thread processing
            this.beatDetectionWorker = null;
        }
    }
    
    /**
     * Analyze track for BPM and beat grid
     */
    analyzeTrack(deckId, audioBuffer) {
        if (!this.beatDetectionWorker) {
            console.warn('Beat detection worker not available');
            return;
        }
        
        // Extract channel data
        const channelData = audioBuffer.getChannelData(0);
        
        // Send to worker for processing
        this.beatDetectionWorker.postMessage({
            deckId: deckId,
            audioData: channelData,
            sampleRate: audioBuffer.sampleRate
        });
    }
    
    /**
     * Start beat tracking loop
     */
    startBeatTracking() {
        // Update beat counters based on current playback position
        const updateBeatCounters = () => {
            ['left', 'right'].forEach(deckId => {
                const deck = this.audioEngine.decks[deckId];
                const beatData = this.beatGridData[deckId];
                
                if (deck.isPlaying && beatData.beatGrid.length > 0 && beatData.bpm > 0) {
                    // Get current playback position
                    const currentTime = this.audioEngine.getCurrentTime(deckId);
                    
                    // Find the closest beat
                    let closestBeatIndex = 0;
                    let minDistance = Infinity;
                    
                    for (let i = 0; i < beatData.beatGrid.length; i++) {
                        const distance = Math.abs(currentTime - beatData.beatGrid[i]);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestBeatIndex = i;
                        }
                    }
                    
                    // Update beat counter
                    this.beatCounters[deckId] = closestBeatIndex % 4;
                    
                    // Calculate phase (0-1 position within a beat)
                    const beatDuration = 60 / beatData.bpm;
                    const beatStart = beatData.beatGrid[closestBeatIndex];
                    const nextBeat = beatData.beatGrid[closestBeatIndex + 1] || (beatStart + beatDuration);
                    
                    beatData.phase = (currentTime - beatStart) / (nextBeat - beatStart);
                    
                    // Dispatch beat event if we're close to a beat
                    if (minDistance < 0.05) { // Within 50ms of a beat
                        const event = new CustomEvent('beatpulse', {
                            detail: {
                                deckId: deckId,
                                beatIndex: closestBeatIndex,
                                beatInBar: closestBeatIndex % 4
                            }
                        });
                        document.dispatchEvent(event);
                    }
                }
            });
            
            // Schedule next update
            requestAnimationFrame(updateBeatCounters);
        };
        
        // Start the loop
        updateBeatCounters();
    }
    
    /**
     * Get BPM for a deck
     */
    getBPM(deckId) {
        return this.beatGridData[deckId].bpm;
    }
    
    /**
     * Get effective BPM (accounting for playback rate)
     */
    getEffectiveBPM(deckId) {
        const baseBPM = this.beatGridData[deckId].bpm;
        const playbackRate = this.audioEngine.decks[deckId].playbackRate;
        return baseBPM * playbackRate;
    }
    
    /**
     * Get beat grid for a deck
     */
    getBeatGrid(deckId) {
        return this.beatGridData[deckId].beatGrid;
    }
    
    /**
     * Get current beat phase (0-1) for a deck
     */
    getBeatPhase(deckId) {
        return this.beatGridData[deckId].phase;
    }
    
    /**
     * Get current beat counter (0-3) for a deck
     */
    getBeatCounter(deckId) {
        return this.beatCounters[deckId];
    }
    
    /**
     * Sync tempo of target deck to source deck
     */
    syncTempo(sourceDeckId, targetDeckId) {
        const sourceBPM = this.getEffectiveBPM(sourceDeckId);
        const targetBaseBPM = this.beatGridData[targetDeckId].bpm;
        
        if (sourceBPM <= 0 || targetBaseBPM <= 0) {
            console.warn('Cannot sync tempo: Invalid BPM values');
            return false;
        }
        
        // Calculate required playback rate
        const newRate = sourceBPM / targetBaseBPM;
        
        // Apply to target deck
        this.audioEngine.setPlaybackRate(targetDeckId, newRate);
        
        console.log(`Synced ${targetDeckId} deck tempo to ${sourceDeckId} deck (${sourceBPM.toFixed(1)} BPM)`);
        return true;
    }
    
    /**
     * Sync phase (beat alignment) of target deck to source deck
     */
    syncPhase(sourceDeckId, targetDeckId) {
        const sourceData = this.beatGridData[sourceDeckId];
        const targetData = this.beatGridData[targetDeckId];
        const targetDeck = this.audioEngine.decks[targetDeckId];
        
        if (!sourceData.beatGrid.length || !targetData.beatGrid.length || !targetDeck.isPlaying) {
            console.warn('Cannot sync phase: Missing beat grid or target deck not playing');
            return false;
        }
        
        // Get current playback position of source deck
        const sourceTime = this.audioEngine.getCurrentTime(sourceDeckId);
        
        // Find the closest beat in source deck
        let closestSourceBeatIndex = 0;
        let minSourceDistance = Infinity;
        
        for (let i = 0; i < sourceData.beatGrid.length; i++) {
            const distance = Math.abs(sourceTime - sourceData.beatGrid[i]);
            if (distance < minSourceDistance) {
                minSourceDistance = distance;
                closestSourceBeatIndex = i;
            }
        }
        
        // Get the beat position in the bar (0-3)
        const sourceBeatInBar = closestSourceBeatIndex % 4;
        
        // Get current playback position of target deck
        const targetTime = this.audioEngine.getCurrentTime(targetDeckId);
        
        // Find the closest beat in target deck with the same position in bar
        let closestTargetBeatIndex = -1;
        let minTargetDistance = Infinity;
        
        for (let i = 0; i < targetData.beatGrid.length; i++) {
            if (i % 4 === sourceBeatInBar) {
                const distance = Math.abs(targetTime - targetData.beatGrid[i]);
                if (distance < minTargetDistance) {
                    minTargetDistance = distance;
                    closestTargetBeatIndex = i;
                }
            }
        }
        
        if (closestTargetBeatIndex === -1) {
            console.warn('Cannot sync phase: No matching beat found in target deck');
            return false;
        }
        
        // Calculate the adjustment needed
        const targetBeatTime = targetData.beatGrid[closestTargetBeatIndex];
        const adjustment = targetBeatTime - targetTime;
        
        // Apply the adjustment by restarting playback at the adjusted position
        if (Math.abs(adjustment) > 0.01) { // Only adjust if difference is significant
            this.audioEngine.jumpToBeat(targetDeckId, closestTargetBeatIndex);
            console.log(`Synced ${targetDeckId} deck phase to ${sourceDeckId} deck (adjusted by ${adjustment.toFixed(3)}s)`);
        } else {
            console.log(`Decks already in phase (difference: ${adjustment.toFixed(3)}s)`);
        }
        
        return true;
    }
    
    /**
     * Sync both tempo and phase
     */
    syncDeck(sourceDeckId, targetDeckId) {
        if (this.syncSettings.tempoSync) {
            this.syncTempo(sourceDeckId, targetDeckId);
        }
        
        if (this.syncSettings.phaseSync) {
            this.syncPhase(sourceDeckId, targetDeckId);
        }
    }
    
    /**
     * Draw beat grid on a canvas
     */
    drawBeatGrid(deckId, canvas, startTime, endTime) {
        const ctx = canvas.getContext('2d');
        const beatGrid = this.beatGridData[deckId].beatGrid;
        
        if (!beatGrid || beatGrid.length === 0) {
            return;
        }
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Draw beat markers
        ctx.fillStyle = '#ffff00';
        
        for (let i = 0; i < beatGrid.length; i++) {
            const beatTime = beatGrid[i];
            
            if (beatTime >= startTime && beatTime <= endTime) {
                const x = ((beatTime - startTime) / (endTime - startTime)) * width;
                
                // Draw different heights for different beat positions
                const beatInBar = i % 4;
                let markerHeight;
                
                if (beatInBar === 0) {
                    // First beat in bar (downbeat)
                    markerHeight = height;
                    ctx.fillStyle = '#ff00ff';
                } else {
                    // Other beats
                    markerHeight = height * 0.7;
                    ctx.fillStyle = '#ffff00';
                }
                
                ctx.fillRect(x - 1, 0, 2, markerHeight);
            }
        }
    }
}

// Export the class
window.BeatManager = BeatManager;
