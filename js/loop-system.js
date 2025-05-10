/**
 * RetroMix DJ - Loop and Hot Cue System
 * Handles loop points, hot cues, and their visualization
 */

class LoopSystem {
    constructor(audioEngine, waveformDisplay) {
        this.audioEngine = audioEngine;
        this.waveformDisplay = waveformDisplay;
        
        // Loop settings
        this.loopSettings = {
            left: {
                enabled: false,
                startPoint: 0,
                endPoint: 0,
                size: 4, // beats
                autoLoop: false
            },
            right: {
                enabled: false,
                startPoint: 0,
                endPoint: 0,
                size: 4, // beats
                autoLoop: false
            }
        };
        
        // Hot cue points (in seconds)
        this.hotCues = {
            left: [null, null, null, null, null, null, null, null],
            right: [null, null, null, null, null, null, null, null]
        };
        
        // Loop size options (in beats)
        this.loopSizeOptions = [0.25, 0.5, 1, 2, 4, 8, 16, 32];
        
        // Initialize
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for beat detection events to enable beat-synced loops
        document.addEventListener('bpmdetected', (e) => {
            const { deckId } = e.detail;
            this.updateLoopPointsFromBeats(deckId);
        });
        
        // Listen for track loading events
        document.addEventListener('trackloaded', (e) => {
            const { deckId } = e.detail;
            this.resetLoopPoints(deckId);
            this.resetHotCues(deckId);
        });
    }
    
    /**
     * Toggle loop on/off for a deck
     */
    toggleLoop(deckId) {
        const loopSettings = this.loopSettings[deckId];
        loopSettings.enabled = !loopSettings.enabled;
        
        if (loopSettings.enabled) {
            // If no loop points set, create a loop at current position
            if (loopSettings.startPoint === 0 && loopSettings.endPoint === 0) {
                this.setLoopFromCurrentPosition(deckId);
            } else {
                // Apply existing loop points
                this.applyLoopPoints(deckId);
            }
        } else {
            // Disable loop
            this.disableLoop(deckId);
        }
        
        return loopSettings.enabled;
    }
    
    /**
     * Set loop from current playback position
     */
    setLoopFromCurrentPosition(deckId) {
        const currentTime = this.audioEngine.getCurrentTime(deckId);
        const deck = this.audioEngine.decks[deckId];
        
        // If we have beat data, create a beat-synced loop
        if (deck.beatTracking && deck.beatTracking.beatGrid && deck.beatTracking.beatGrid.length > 0) {
            // Find closest beat
            let closestBeatIndex = this.findClosestBeatIndex(deckId, currentTime);
            
            // Set loop start at closest beat
            const startPoint = deck.beatTracking.beatGrid[closestBeatIndex];
            
            // Set loop end based on loop size (in beats)
            const loopSize = this.loopSettings[deckId].size;
            let endBeatIndex = closestBeatIndex + loopSize;
            
            // Make sure end beat exists, otherwise calculate based on BPM
            let endPoint;
            if (endBeatIndex < deck.beatTracking.beatGrid.length) {
                endPoint = deck.beatTracking.beatGrid[endBeatIndex];
            } else {
                // Calculate based on BPM
                const beatDuration = 60 / deck.beatTracking.bpm;
                endPoint = startPoint + (beatDuration * loopSize);
            }
            
            // Set loop points
            this.setLoopPoints(deckId, startPoint, endPoint);
        } else {
            // No beat data, create a 4-second loop
            const startPoint = currentTime;
            const endPoint = currentTime + 4;
            
            // Set loop points
            this.setLoopPoints(deckId, startPoint, endPoint);
        }
    }
    
    /**
     * Set loop points for a deck
     */
    setLoopPoints(deckId, startPoint, endPoint) {
        const loopSettings = this.loopSettings[deckId];
        loopSettings.startPoint = startPoint;
        loopSettings.endPoint = endPoint;
        
        // If loop is enabled, apply the new points
        if (loopSettings.enabled) {
            this.applyLoopPoints(deckId);
        }
        
        // Dispatch event for UI update
        const event = new CustomEvent('looppointschanged', {
            detail: {
                deckId: deckId,
                startPoint: startPoint,
                endPoint: endPoint
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Apply loop points to audio engine
     */
    applyLoopPoints(deckId) {
        const loopSettings = this.loopSettings[deckId];
        const deck = this.audioEngine.decks[deckId];
        
        if (!deck.source || !deck.buffer) {
            return false;
        }
        
        // If we're already past the end point, jump back to start point
        const currentTime = this.audioEngine.getCurrentTime(deckId);
        if (currentTime >= loopSettings.endPoint) {
            this.audioEngine.jumpToTime(deckId, loopSettings.startPoint);
        }
        
        // Set up loop end detection
        this.setupLoopEndDetection(deckId);
        
        return true;
    }
    
    /**
     * Set up detection for when playback reaches loop end point
     */
    setupLoopEndDetection(deckId) {
        const loopSettings = this.loopSettings[deckId];
        const checkLoopEnd = () => {
            // If loop is disabled, stop checking
            if (!loopSettings.enabled) {
                return;
            }
            
            const currentTime = this.audioEngine.getCurrentTime(deckId);
            
            // If we've reached or passed the end point, jump back to start point
            if (currentTime >= loopSettings.endPoint) {
                this.audioEngine.jumpToTime(deckId, loopSettings.startPoint);
            }
            
            // Continue checking
            requestAnimationFrame(checkLoopEnd);
        };
        
        // Start checking
        requestAnimationFrame(checkLoopEnd);
    }
    
    /**
     * Disable loop for a deck
     */
    disableLoop(deckId) {
        this.loopSettings[deckId].enabled = false;
    }
    
    /**
     * Reset loop points for a deck
     */
    resetLoopPoints(deckId) {
        this.loopSettings[deckId].enabled = false;
        this.loopSettings[deckId].startPoint = 0;
        this.loopSettings[deckId].endPoint = 0;
    }
    
    /**
     * Update loop points based on beats
     */
    updateLoopPointsFromBeats(deckId) {
        const loopSettings = this.loopSettings[deckId];
        const deck = this.audioEngine.decks[deckId];
        
        // Only update if loop is enabled and we have beat data
        if (loopSettings.enabled && deck.beatTracking && deck.beatTracking.beatGrid && deck.beatTracking.beatGrid.length > 0) {
            // Find closest beat to current start point
            let closestStartBeatIndex = this.findClosestBeatIndex(deckId, loopSettings.startPoint);
            
            // Set new start point at closest beat
            const startPoint = deck.beatTracking.beatGrid[closestStartBeatIndex];
            
            // Set new end point based on loop size (in beats)
            const loopSize = loopSettings.size;
            let endBeatIndex = closestStartBeatIndex + loopSize;
            
            // Make sure end beat exists, otherwise calculate based on BPM
            let endPoint;
            if (endBeatIndex < deck.beatTracking.beatGrid.length) {
                endPoint = deck.beatTracking.beatGrid[endBeatIndex];
            } else {
                // Calculate based on BPM
                const beatDuration = 60 / deck.beatTracking.bpm;
                endPoint = startPoint + (beatDuration * loopSize);
            }
            
            // Update loop points
            loopSettings.startPoint = startPoint;
            loopSettings.endPoint = endPoint;
            
            // Dispatch event for UI update
            const event = new CustomEvent('looppointschanged', {
                detail: {
                    deckId: deckId,
                    startPoint: startPoint,
                    endPoint: endPoint
                }
            });
            document.dispatchEvent(event);
        }
    }
    
    /**
     * Find closest beat index to a time position
     */
    findClosestBeatIndex(deckId, time) {
        const deck = this.audioEngine.decks[deckId];
        
        if (!deck.beatTracking || !deck.beatTracking.beatGrid || deck.beatTracking.beatGrid.length === 0) {
            return -1;
        }
        
        let closestBeatIndex = 0;
        let minDistance = Infinity;
        
        for (let i = 0; i < deck.beatTracking.beatGrid.length; i++) {
            const distance = Math.abs(time - deck.beatTracking.beatGrid[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestBeatIndex = i;
            }
        }
        
        return closestBeatIndex;
    }
    
    /**
     * Set loop size (in beats)
     */
    setLoopSize(deckId, size) {
        // Find closest valid loop size
        let closestSizeIndex = 0;
        let minDifference = Infinity;
        
        for (let i = 0; i < this.loopSizeOptions.length; i++) {
            const difference = Math.abs(size - this.loopSizeOptions[i]);
            if (difference < minDifference) {
                minDifference = difference;
                closestSizeIndex = i;
            }
        }
        
        const validSize = this.loopSizeOptions[closestSizeIndex];
        this.loopSettings[deckId].size = validSize;
        
        // If loop is enabled, update loop points
        if (this.loopSettings[deckId].enabled) {
            this.updateLoopPointsFromBeats(deckId);
        }
        
        return validSize;
    }
    
    /**
     * Double loop size
     */
    doubleLoopSize(deckId) {
        const currentSize = this.loopSettings[deckId].size;
        const currentIndex = this.loopSizeOptions.indexOf(currentSize);
        
        if (currentIndex < this.loopSizeOptions.length - 1) {
            const newSize = this.loopSizeOptions[currentIndex + 1];
            return this.setLoopSize(deckId, newSize);
        }
        
        return currentSize;
    }
    
    /**
     * Halve loop size
     */
    halveLoopSize(deckId) {
        const currentSize = this.loopSettings[deckId].size;
        const currentIndex = this.loopSizeOptions.indexOf(currentSize);
        
        if (currentIndex > 0) {
            const newSize = this.loopSizeOptions[currentIndex - 1];
            return this.setLoopSize(deckId, newSize);
        }
        
        return currentSize;
    }
    
    /**
     * Set hot cue point
     */
    setHotCue(deckId, index) {
        // Get current playback position
        const currentTime = this.audioEngine.getCurrentTime(deckId);
        
        // Store position
        this.hotCues[deckId][index] = currentTime;
        
        // Dispatch event for UI update
        const event = new CustomEvent('hotcueset', {
            detail: {
                deckId: deckId,
                index: index,
                position: currentTime
            }
        });
        document.dispatchEvent(event);
        
        return currentTime;
    }
    
    /**
     * Jump to hot cue point
     */
    jumpToHotCue(deckId, index) {
        const position = this.hotCues[deckId][index];
        
        if (position === null) {
            return false;
        }
        
        // Jump to position
        this.audioEngine.jumpToTime(deckId, position);
        
        // Dispatch event for UI update
        const event = new CustomEvent('hotcuejump', {
            detail: {
                deckId: deckId,
                index: index,
                position: position
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Clear hot cue point
     */
    clearHotCue(deckId, index) {
        this.hotCues[deckId][index] = null;
        
        // Dispatch event for UI update
        const event = new CustomEvent('hotcuecleared', {
            detail: {
                deckId: deckId,
                index: index
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Reset all hot cues for a deck
     */
    resetHotCues(deckId) {
        for (let i = 0; i < this.hotCues[deckId].length; i++) {
            this.hotCues[deckId][i] = null;
        }
        
        // Dispatch event for UI update
        const event = new CustomEvent('hotcuesreset', {
            detail: {
                deckId: deckId
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Draw loop markers on waveform
     */
    drawLoopMarkers(deckId, ctx, canvas, startTime, endTime) {
        const loopSettings = this.loopSettings[deckId];
        
        // Only draw if loop points are set
        if (loopSettings.startPoint === 0 && loopSettings.endPoint === 0) {
            return;
        }
        
        // Check if loop points are in visible range
        if (loopSettings.endPoint < startTime || loopSettings.startPoint > endTime) {
            return;
        }
        
        // Calculate positions
        const canvasWidth = canvas.width;
        const timeRange = endTime - startTime;
        
        const startX = ((loopSettings.startPoint - startTime) / timeRange) * canvasWidth;
        const endX = ((loopSettings.endPoint - startTime) / timeRange) * canvasWidth;
        
        // Draw loop region
        ctx.fillStyle = loopSettings.enabled ? 'rgba(255, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(startX, 0, endX - startX, canvas.height);
        
        // Draw loop markers
        ctx.fillStyle = loopSettings.enabled ? '#ffff00' : '#888888';
        
        // Start marker
        ctx.fillRect(startX - 1, 0, 2, canvas.height);
        
        // End marker
        ctx.fillRect(endX - 1, 0, 2, canvas.height);
        
        // Draw loop size text
        if (loopSettings.enabled) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#ffff00';
            ctx.fillText(`${loopSettings.size} beat${loopSettings.size !== 1 ? 's' : ''}`, 
                         startX + 5, 12);
        }
    }
    
    /**
     * Draw hot cue markers on waveform
     */
    drawHotCueMarkers(deckId, ctx, canvas, startTime, endTime) {
        const hotCues = this.hotCues[deckId];
        const canvasWidth = canvas.width;
        const timeRange = endTime - startTime;
        
        // Colors for hot cues
        const colors = [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00',
            '#ff00ff', '#00ffff', '#ff8000', '#8000ff'
        ];
        
        // Draw each hot cue
        hotCues.forEach((position, index) => {
            if (position !== null && position >= startTime && position <= endTime) {
                const x = ((position - startTime) / timeRange) * canvasWidth;
                
                // Draw marker
                ctx.fillStyle = colors[index % colors.length];
                
                // Triangle marker
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x - 5, 10);
                ctx.lineTo(x + 5, 10);
                ctx.closePath();
                ctx.fill();
                
                // Label
                ctx.font = '10px Arial';
                ctx.fillText(`${index + 1}`, x - 3, 20);
            }
        });
    }
}

// Export the class
window.LoopSystem = LoopSystem;
