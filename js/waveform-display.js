/**
 * RetroMix DJ - Waveform Display
 * Handles rendering of audio waveforms with beat grid visualization
 */

class WaveformDisplay {
    constructor(audioEngine, beatManager) {
        this.audioEngine = audioEngine;
        this.beatManager = beatManager;
        this.canvases = {};
        this.contexts = {};
        this.settings = {
            zoomLevel: 1.0, // 1.0 = normal, 2.0 = 2x zoom
            scrollOffset: 0, // Offset in seconds
            waveformColor: {
                left: '#ff00ff',
                right: '#00ffff'
            },
            backgroundColor: '#000000',
            gridColor: 'rgba(255, 255, 255, 0.1)',
            playheadColor: '#ffffff',
            beatGridEnabled: true,
            scrollFollowsPlayhead: true,
            displayMode: 'waveform' // 'waveform', 'spectrum', 'combined'
        };
        
        // Animation frame IDs for each canvas
        this.animationFrames = {};
    }
    
    /**
     * Initialize waveform display for a deck
     */
    initDisplay(deckId, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas with ID ${canvasId} not found`);
            return false;
        }
        
        // Store canvas and get context
        this.canvases[deckId] = canvas;
        this.contexts[deckId] = canvas.getContext('2d');
        
        // Set canvas dimensions to match display size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Start animation loop
        this.startAnimation(deckId);
        
        return true;
    }
    
    /**
     * Start animation loop for a deck
     */
    startAnimation(deckId) {
        const animate = () => {
            this.drawWaveform(deckId);
            this.animationFrames[deckId] = requestAnimationFrame(animate);
        };
        
        this.animationFrames[deckId] = requestAnimationFrame(animate);
    }
    
    /**
     * Stop animation loop for a deck
     */
    stopAnimation(deckId) {
        if (this.animationFrames[deckId]) {
            cancelAnimationFrame(this.animationFrames[deckId]);
            delete this.animationFrames[deckId];
        }
    }
    
    /**
     * Draw waveform for a deck
     */
    drawWaveform(deckId) {
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
        if (this.settings.beatGridEnabled) {
            this.beatManager.drawBeatGrid(deckId, canvas, startTime, endTime);
        }
        
        // Draw playhead
        if (deck.isPlaying || deck.pauseTime > 0) {
            this.drawPlayhead(deckId, currentTime, startTime, endTime);
        }
    }
    
    /**
     * Draw grid lines
     */
    drawGrid(deckId) {
        const canvas = this.canvases[deckId];
        const ctx = this.contexts[deckId];
        
        ctx.strokeStyle = this.settings.gridColor;
        ctx.lineWidth = 1;
        
        // Vertical grid lines (every 1 second)
        const secondWidth = canvas.width / (deck.buffer.duration / this.settings.zoomLevel);
        const startSecond = Math.floor(this.settings.scrollOffset);
        const endSecond = Math.ceil(this.settings.scrollOffset + (deck.buffer.duration / this.settings.zoomLevel));
        
        for (let i = startSecond; i <= endSecond; i++) {
            const x = ((i - this.settings.scrollOffset) * secondWidth);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        const numLines = 4;
        for (let i = 1; i < numLines; i++) {
            const y = (i / numLines) * canvas.height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    /**
     * Draw waveform segment
     */
    drawWaveformSegment(deckId, waveformData, startTime, endTime) {
        const canvas = this.canvases[deckId];
        const ctx = this.contexts[deckId];
        const deck = this.audioEngine.decks[deckId];
        
        const peaks = waveformData.peaks;
        const duration = waveformData.duration;
        
        // Calculate indices for the visible portion
        const startIndex = Math.floor((startTime / duration) * peaks.length);
        const endIndex = Math.ceil((endTime / duration) * peaks.length);
        
        // Calculate width of each peak segment
        const segmentWidth = canvas.width / (endIndex - startIndex);
        
        // Draw waveform
        ctx.fillStyle = this.settings.waveformColor[deckId];
        
        for (let i = startIndex; i < endIndex; i++) {
            if (i >= 0 && i < peaks.length) {
                const peak = peaks[i];
                const x = (i - startIndex) * segmentWidth;
                const height = peak * canvas.height;
                
                // Draw from center
                const y = (canvas.height - height) / 2;
                ctx.fillRect(x, y, segmentWidth, height);
            }
        }
    }
    
    /**
     * Draw playhead
     */
    drawPlayhead(deckId, currentTime, startTime, endTime) {
        const canvas = this.canvases[deckId];
        const ctx = this.contexts[deckId];
        
        // Calculate playhead position
        const x = ((currentTime - startTime) / (endTime - startTime)) * canvas.width;
        
        // Only draw if playhead is in visible range
        if (x >= 0 && x <= canvas.width) {
            ctx.strokeStyle = this.settings.playheadColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
    }
    
    /**
     * Get waveform data for a deck
     */
    getWaveformData(deckId) {
        const deck = this.audioEngine.decks[deckId];
        
        // If we don't have waveform data yet, generate it
        if (!deck.waveformData && deck.buffer) {
            deck.waveformData = this.generateWaveformData(deck.buffer);
        }
        
        return deck.waveformData;
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
     * Set zoom level
     */
    setZoom(zoomLevel) {
        this.settings.zoomLevel = Math.max(0.5, Math.min(10, zoomLevel));
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        this.setZoom(this.settings.zoomLevel * 1.5);
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        this.setZoom(this.settings.zoomLevel / 1.5);
    }
    
    /**
     * Scroll to position
     */
    scrollTo(time) {
        const deck = this.audioEngine.decks[this.activeDeck];
        if (!deck.buffer) return;
        
        this.settings.scrollOffset = Math.max(0, Math.min(deck.buffer.duration - (deck.buffer.duration / this.settings.zoomLevel), time));
    }
    
    /**
     * Toggle beat grid display
     */
    toggleBeatGrid() {
        this.settings.beatGridEnabled = !this.settings.beatGridEnabled;
        return this.settings.beatGridEnabled;
    }
    
    /**
     * Toggle playhead following
     */
    togglePlayheadFollowing() {
        this.settings.scrollFollowsPlayhead = !this.settings.scrollFollowsPlayhead;
        return this.settings.scrollFollowsPlayhead;
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        for (const deckId in this.canvases) {
            const canvas = this.canvases[deckId];
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
    }
}

// Export the class
window.WaveformDisplay = WaveformDisplay;
