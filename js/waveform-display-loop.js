/**
 * RetroMix DJ - Waveform Display Loop Extensions
 * Adds loop and hot cue visualization to the waveform display
 */

// Add these methods to the WaveformDisplay class

/**
 * Draw waveform with loop and hot cue markers
 */
WaveformDisplay.prototype.drawWaveformWithLoopMarkers = function(deckId) {
    const canvas = this.canvases[deckId];
    const ctx = this.contexts[deckId];
    const deck = this.audioEngine.decks[deckId];
    
    if (!canvas || !ctx || !deck.buffer) {
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = this.settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    this.drawGrid(deckId);
    
    // Get waveform data
    const waveformData = this.getWaveformData(deckId);
    if (!waveformData || !waveformData.peaks) {
        return;
    }
    
    // Calculate visible range
    const currentTime = this.audioEngine.getCurrentTime(deckId);
    const duration = deck.buffer.duration;
    
    // Adjust scroll offset if following playhead
    if (this.settings.scrollFollowsPlayhead && deck.isPlaying) {
        this.settings.scrollOffset = Math.max(0, currentTime - 2); // Show 2 seconds before playhead
    }
    
    // Calculate visible time range
    const visibleDuration = duration / this.settings.zoomLevel;
    const startTime = this.settings.scrollOffset;
    const endTime = Math.min(duration, startTime + visibleDuration);
    
    // Draw waveform
    this.drawWaveformSegment(deckId, waveformData, startTime, endTime);
    
    // Draw beat grid if enabled
    if (this.settings.beatGridEnabled && window.app.beatManager) {
        window.app.beatManager.drawBeatGrid(deckId, canvas, startTime, endTime);
    }
    
    // Draw loop markers if loop system exists
    if (window.app.loopSystem) {
        window.app.loopSystem.drawLoopMarkers(deckId, ctx, canvas, startTime, endTime);
        window.app.loopSystem.drawHotCueMarkers(deckId, ctx, canvas, startTime, endTime);
    }
    
    // Draw playhead
    if (deck.isPlaying || deck.pauseTime > 0) {
        this.drawPlayhead(deckId, currentTime, startTime, endTime);
    }
};

/**
 * Override the original drawWaveform method to include loop markers
 */
WaveformDisplay.prototype.drawWaveform = function(deckId) {
    // Call the new method that includes loop markers
    this.drawWaveformWithLoopMarkers(deckId);
};
