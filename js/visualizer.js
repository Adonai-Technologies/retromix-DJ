/**
 * RetroMix DJ - Advanced Visualizer
 * Handles all visualization rendering including waveforms, spectrum, and 3D effects
 */

class Visualizer {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.canvases = {};
        this.contexts = {};
        this.visualizerTypes = {};
        this.animationFrames = {};
        this.settings = {
            theme: 'retro', // 'retro', 'modern', 'minimal', 'neon'
            quality: 'high', // 'low', 'medium', 'high'
            fps: 30,
            showFPS: false
        };
        
        // Performance metrics
        this.fpsCounter = {
            lastTime: 0,
            frames: 0,
            currentFPS: 0
        };
        
        // Initialize WebGL if available
        this.hasWebGL = this.checkWebGLSupport();
    }
    
    /**
     * Check if WebGL is supported
     */
    checkWebGLSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return gl instanceof WebGLRenderingContext;
    }
    
    /**
     * Initialize a visualizer on a canvas
     */
    initVisualizer(canvasId, type = 'spectrum') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas with ID ${canvasId} not found`);
            return false;
        }
        
        // Store canvas and get context
        this.canvases[canvasId] = canvas;
        
        // Set canvas dimensions to match display size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Get appropriate context based on visualizer type
        if (type === '3d' && this.hasWebGL) {
            this.contexts[canvasId] = canvas.getContext('webgl');
            // Initialize WebGL visualizer
            this.init3DVisualizer(canvasId);
        } else {
            this.contexts[canvasId] = canvas.getContext('2d');
        }
        
        // Store visualizer type
        this.visualizerTypes[canvasId] = type;
        
        // Start animation loop
        this.startAnimation(canvasId);
        
        return true;
    }
    
    /**
     * Initialize 3D WebGL visualizer
     */
    init3DVisualizer(canvasId) {
        const gl = this.contexts[canvasId];
        
        // Set up WebGL scene (simplified)
        gl.clearColor(0.0, 0.0, 0.1, 1.0);
        gl.enable(gl.DEPTH_TEST);
        
        // In a real implementation, we would set up shaders, buffers, etc.
    }
    
    /**
     * Start animation loop for a visualizer
     */
    startAnimation(canvasId) {
        const animate = (timestamp) => {
            // Calculate FPS
            if (this.settings.showFPS) {
                this.updateFPS(timestamp);
            }
            
            // Draw the appropriate visualizer
            this.drawVisualizer(canvasId);
            
            // Schedule next frame
            this.animationFrames[canvasId] = requestAnimationFrame(animate);
        };
        
        this.animationFrames[canvasId] = requestAnimationFrame(animate);
    }
    
    /**
     * Stop animation loop for a visualizer
     */
    stopAnimation(canvasId) {
        if (this.animationFrames[canvasId]) {
            cancelAnimationFrame(this.animationFrames[canvasId]);
            delete this.animationFrames[canvasId];
        }
    }
    
    /**
     * Update FPS counter
     */
    updateFPS(timestamp) {
        if (!this.fpsCounter.lastTime) {
            this.fpsCounter.lastTime = timestamp;
            return;
        }
        
        this.fpsCounter.frames++;
        
        // Update FPS every second
        if (timestamp - this.fpsCounter.lastTime >= 1000) {
            this.fpsCounter.currentFPS = this.fpsCounter.frames;
            this.fpsCounter.frames = 0;
            this.fpsCounter.lastTime = timestamp;
        }
    }
    
    /**
     * Draw the appropriate visualizer based on type
     */
    drawVisualizer(canvasId) {
        const type = this.visualizerTypes[canvasId];
        const ctx = this.contexts[canvasId];
        const canvas = this.canvases[canvasId];
        
        if (!ctx || !canvas) return;
        
        switch (type) {
            case 'spectrum':
                this.drawSpectrumVisualizer(canvasId);
                break;
            case 'waveform':
                this.drawWaveformVisualizer(canvasId);
                break;
            case 'circular':
                this.drawCircularVisualizer(canvasId);
                break;
            case '3d':
                if (this.hasWebGL) {
                    this.draw3DVisualizer(canvasId);
                } else {
                    this.drawSpectrumVisualizer(canvasId); // Fallback
                }
                break;
            case 'dual-deck':
                this.drawDualDeckVisualizer(canvasId);
                break;
            default:
                this.drawSpectrumVisualizer(canvasId);
        }
        
        // Draw FPS counter if enabled
        if (this.settings.showFPS) {
            this.drawFPSCounter(canvasId);
        }
    }
    
    /**
     * Draw spectrum analyzer visualizer
     */
    drawSpectrumVisualizer(canvasId) {
        const ctx = this.contexts[canvasId];
        const canvas = this.canvases[canvasId];
        const frequencyData = this.audioEngine.getAnalyzerData('frequency');
        
        if (!frequencyData) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background grid based on theme
        this.drawBackgroundGrid(canvasId);
        
        // Draw frequency bars
        const barWidth = (canvas.width / frequencyData.length) * 2.5;
        let x = 0;
        
        for (let i = 0; i < frequencyData.length; i++) {
            const barHeight = (frequencyData[i] / 255) * canvas.height;
            
            // Create gradient based on theme
            const gradient = this.createBarGradient(ctx, canvas.height, barHeight);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }
    
    /**
     * Draw waveform visualizer
     */
    drawWaveformVisualizer(canvasId) {
        const ctx = this.contexts[canvasId];
        const canvas = this.canvases[canvasId];
        const waveformData = this.audioEngine.getAnalyzerData('waveform');
        
        if (!waveformData) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background grid
        this.drawBackgroundGrid(canvasId);
        
        // Draw waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.getThemeColor('waveform');
        ctx.beginPath();
        
        const sliceWidth = canvas.width / waveformData.length;
        let x = 0;
        
        for (let i = 0; i < waveformData.length; i++) {
            const v = waveformData[i] / 128.0;
            const y = v * canvas.height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
    }
    
    /**
     * Draw circular visualizer
     */
    drawCircularVisualizer(canvasId) {
        const ctx = this.contexts[canvasId];
        const canvas = this.canvases[canvasId];
        const frequencyData = this.audioEngine.getAnalyzerData('frequency');
        
        if (!frequencyData) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = this.getThemeColor('background');
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Center of the circle
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        // Draw frequency bars in a circle
        const barCount = Math.min(frequencyData.length, 180); // Limit for performance
        const angleStep = (2 * Math.PI) / barCount;
        
        for (let i = 0; i < barCount; i++) {
            const angle = i * angleStep;
            const barHeight = (frequencyData[i] / 255) * radius * 0.5;
            
            // Calculate start and end points
            const startX = centerX + Math.cos(angle) * radius;
            const startY = centerY + Math.sin(angle) * radius;
            const endX = centerX + Math.cos(angle) * (radius + barHeight);
            const endY = centerY + Math.sin(angle) * (radius + barHeight);
            
            // Draw bar
            ctx.lineWidth = 2;
            ctx.strokeStyle = this.getThemeColor('bar', i / barCount);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
        ctx.fillStyle = this.getThemeColor('accent');
        ctx.fill();
    }
    
    /**
     * Draw 3D WebGL visualizer
     */
    draw3DVisualizer(canvasId) {
        const gl = this.contexts[canvasId];
        const frequencyData = this.audioEngine.getAnalyzerData('frequency');
        
        if (!frequencyData || !gl) return;
        
        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // In a real implementation, we would update and render 3D objects
        // based on the frequency data
    }
    
    /**
     * Draw dual deck visualizer showing both decks
     */
    drawDualDeckVisualizer(canvasId) {
        const ctx = this.contexts[canvasId];
        const canvas = this.canvases[canvasId];
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = this.getThemeColor('background');
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw dividing line
        ctx.strokeStyle = this.getThemeColor('accent');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        
        // Draw waveforms for both decks
        this.drawDeckWaveform('left', ctx, 0, 0, canvas.width / 2, canvas.height);
        this.drawDeckWaveform('right', ctx, canvas.width / 2, 0, canvas.width / 2, canvas.height);
    }
    
    /**
     * Draw waveform for a specific deck
     */
    drawDeckWaveform(deckId, ctx, x, y, width, height) {
        const deck = this.audioEngine.decks[deckId];
        
        if (!deck || !deck.waveformData || !deck.waveformData.peaks) {
            return;
        }
        
        const peaks = deck.waveformData.peaks;
        const currentTime = this.audioEngine.getCurrentTime(deckId);
        const duration = deck.waveformData.duration;
        
        // Calculate which portion of the waveform to display
        const startPosition = Math.max(0, currentTime - 5); // 5 seconds before current position
        const endPosition = Math.min(duration, currentTime + 5); // 5 seconds after current position
        
        const startIndex = Math.floor(startPosition / duration * peaks.length);
        const endIndex = Math.ceil(endPosition / duration * peaks.length);
        
        // Draw waveform
        ctx.strokeStyle = deckId === 'left' ? '#ff00ff' : '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const sliceWidth = width / (endIndex - startIndex);
        
        for (let i = startIndex; i < endIndex; i++) {
            const peak = peaks[i] || 0;
            const xPos = x + (i - startIndex) * sliceWidth;
            const yPos = y + height / 2 + (peak * height / 2);
            
            if (i === startIndex) {
                ctx.moveTo(xPos, yPos);
            } else {
                ctx.lineTo(xPos, yPos);
            }
        }
        
        ctx.stroke();
        
        // Draw playhead
        const playheadX = x + ((currentTime - startPosition) / (endPosition - startPosition)) * width;
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(playheadX, y);
        ctx.lineTo(playheadX, y + height);
        ctx.stroke();
        
        // Draw beat markers if available
        if (deck.beatTracking && deck.beatTracking.beatGrid) {
            ctx.fillStyle = '#ffff00';
            
            for (const beatTime of deck.beatTracking.beatGrid) {
                if (beatTime >= startPosition && beatTime <= endPosition) {
                    const beatX = x + ((beatTime - startPosition) / (endPosition - startPosition)) * width;
                    ctx.fillRect(beatX - 1, y, 2, 10);
                }
            }
        }
    }
    
    /**
     * Draw background grid
     */
    drawBackgroundGrid(canvasId) {
        const ctx = this.contexts[canvasId];
        const canvas = this.canvases[canvasId];
        
        ctx.strokeStyle = this.getThemeColor('grid');
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let x = 0; x < canvas.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 0; y < canvas.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    /**
     * Create gradient for bars based on theme
     */
    createBarGradient(ctx, canvasHeight, barHeight) {
        const gradient = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight - barHeight);
        
        switch (this.settings.theme) {
            case 'retro':
                gradient.addColorStop(0, '#00ffff');
                gradient.addColorStop(0.5, '#ff00ff');
                gradient.addColorStop(1, '#ffff00');
                break;
            case 'modern':
                gradient.addColorStop(0, '#2196F3');
                gradient.addColorStop(0.5, '#E91E63');
                gradient.addColorStop(1, '#FFC107');
                break;
            case 'minimal':
                gradient.addColorStop(0, '#555555');
                gradient.addColorStop(1, '#ffffff');
                break;
            case 'neon':
                gradient.addColorStop(0, '#00ff00');
                gradient.addColorStop(0.5, '#ff00ff');
                gradient.addColorStop(1, '#00ffff');
                break;
            default:
                gradient.addColorStop(0, '#00ffff');
                gradient.addColorStop(1, '#ff00ff');
        }
        
        return gradient;
    }
    
    /**
     * Get color based on current theme
     */
    getThemeColor(element, position = 0) {
        const themes = {
            retro: {
                background: '#000033',
                grid: 'rgba(0, 255, 255, 0.2)',
                waveform: '#ff00ff',
                bar: `hsl(${position * 360}, 100%, 50%)`,
                accent: '#ffff00'
            },
            modern: {
                background: '#121212',
                grid: 'rgba(255, 255, 255, 0.1)',
                waveform: '#2196F3',
                bar: `hsl(${position * 360}, 80%, 60%)`,
                accent: '#FFC107'
            },
            minimal: {
                background: '#000000',
                grid: 'rgba(255, 255, 255, 0.1)',
                waveform: '#ffffff',
                bar: `rgba(255, 255, 255, ${0.5 + position * 0.5})`,
                accent: '#ffffff'
            },
            neon: {
                background: '#000000',
                grid: 'rgba(0, 255, 0, 0.2)',
                waveform: '#00ff00',
                bar: `hsl(${120 + position * 240}, 100%, 50%)`,
                accent: '#ff00ff'
            }
        };
        
        return themes[this.settings.theme][element] || themes.retro[element];
    }
    
    /**
     * Draw FPS counter
     */
    drawFPSCounter(canvasId) {
        const ctx = this.contexts[canvasId];
        const canvas = this.canvases[canvasId];
        
        ctx.font = '12px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`FPS: ${this.fpsCounter.currentFPS}`, 10, 20);
    }
    
    /**
     * Render track waveform to a canvas
     */
    renderTrackWaveform(deckId, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        const deck = this.audioEngine.decks[deckId];
        
        if (!deck || !deck.waveformData || !deck.waveformData.peaks) {
            return false;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw waveform
        const peaks = deck.waveformData.peaks;
        const peakSegmentWidth = canvas.width / peaks.length;
        
        ctx.strokeStyle = deckId === 'left' ? '#ff00ff' : '#00ffff';
        ctx.lineWidth = 1;
        
        // Draw center line
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        
        // Draw peaks
        ctx.beginPath();
        
        for (let i = 0; i < peaks.length; i++) {
            const x = i * peakSegmentWidth;
            const y = (1 - peaks[i]) * canvas.height / 2; // Invert and scale
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        for (let i = peaks.length - 1; i >= 0; i--) {
            const x = i * peakSegmentWidth;
            const y = (1 + peaks[i]) * canvas.height / 2; // Non-inverted and scale
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fillStyle = deckId === 'left' ? 'rgba(255, 0, 255, 0.5)' : 'rgba(0, 255, 255, 0.5)';
        ctx.fill();
        
        // Draw beat markers if available
        if (deck.beatTracking && deck.beatTracking.beatGrid) {
            ctx.fillStyle = '#ffff00';
            
            for (const beatTime of deck.beatTracking.beatGrid) {
                const beatPosition = beatTime / deck.waveformData.duration;
                const x = beatPosition * canvas.width;
                ctx.fillRect(x - 1, 0, 2, canvas.height);
            }
        }
        
        return true;
    }
    
    /**
     * Change visualizer theme
     */
    setTheme(theme) {
        if (['retro', 'modern', 'minimal', 'neon'].includes(theme)) {
            this.settings.theme = theme;
        }
    }
    
    /**
     * Change visualizer quality
     */
    setQuality(quality) {
        if (['low', 'medium', 'high'].includes(quality)) {
            this.settings.quality = quality;
            
            // Adjust analyzer settings based on quality
            if (this.audioEngine.masterAnalyser) {
                switch (quality) {
                    case 'low':
                        this.audioEngine.masterAnalyser.fftSize = 512;
                        break;
                    case 'medium':
                        this.audioEngine.masterAnalyser.fftSize = 1024;
                        break;
                    case 'high':
                        this.audioEngine.masterAnalyser.fftSize = 2048;
                        break;
                }
            }
        }
    }
    
    /**
     * Toggle FPS display
     */
    toggleFPS(show) {
        this.settings.showFPS = show;
    }
    
    /**
     * Resize all visualizers
     */
    resizeVisualizers() {
        for (const canvasId in this.canvases) {
            const canvas = this.canvases[canvasId];
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
    }
}

// Export the class
window.Visualizer = Visualizer;
