/**
 * RetroMix DJ - Main Application
 * Initializes and connects all components
 */

// Main application class
class RetroMixApp {
    constructor() {
        try {
            // Initialize components
            this.audioEngine = new AudioEngine();
            console.log('Audio Engine initialized');
            
            // Initialize visualizer
            this.visualizer = new Visualizer(this.audioEngine);
            console.log('Visualizer initialized');
            
            // Check if BeatManager exists
            if (typeof BeatManager !== 'undefined') {
                this.beatManager = new BeatManager(this.audioEngine);
                console.log('Beat Manager initialized');
            } else {
                console.warn('BeatManager not available, some features will be disabled');
                this.beatManager = null;
            }
            
            // Check if WaveformDisplay exists
            if (typeof WaveformDisplay !== 'undefined' && this.beatManager) {
                this.waveformDisplay = new WaveformDisplay(this.audioEngine, this.beatManager);
                console.log('Waveform Display initialized');
            } else {
                console.warn('WaveformDisplay not available, some features will be disabled');
                this.waveformDisplay = null;
            }
            
            // Initialize UI controller
            this.uiController = new UIController(this.audioEngine, this.visualizer);
            console.log('UI Controller initialized');
            
            // App state
            this.appState = {
                isRecording: false,
                recordingData: null,
                currentTheme: 'retro',
                keyboardShortcutsEnabled: true,
                tooltipsEnabled: true
            };
            
            // Initialize application
            this.initialize();
        } catch (error) {
            console.error('Error initializing application:', error);
            alert('Error initializing application: ' + error.message);
        }
    }
    
    /**
     * Initialize application
     */
    initialize() {
        try {
            // Initialize visualizers
            this.initializeVisualizers();
            
            // Initialize waveform displays
            if (this.waveformDisplay) {
                this.initializeWaveformDisplays();
            }
            
            // Set up event listeners for app-level events
            this.setupEventListeners();
            
            // Create sample directories
            this.createSampleDirectories();
            
            console.log('RetroMix DJ initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }
    
    /**
     * Initialize visualizers
     */
    initializeVisualizers() {
        try {
            // Main visualizer
            this.visualizer.initVisualizer('visualizer', 'spectrum');
            console.log('Main visualizer initialized');
        } catch (error) {
            console.error('Error initializing visualizers:', error);
        }
    }
    
    /**
     * Initialize waveform displays
     */
    initializeWaveformDisplays() {
        try {
            // Deck waveforms
            this.waveformDisplay.initDisplay('left', 'waveform-left');
            this.waveformDisplay.initDisplay('right', 'waveform-right');
            console.log('Waveform displays initialized');
        } catch (error) {
            console.error('Error initializing waveform displays:', error);
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        try {
            // Visualizer type selector
            const vizSpectrum = document.getElementById('viz-spectrum');
            if (vizSpectrum) {
                vizSpectrum.addEventListener('click', () => {
                    this.setVisualizerType('spectrum');
                });
            }
            
            const vizWaveform = document.getElementById('viz-waveform');
            if (vizWaveform) {
                vizWaveform.addEventListener('click', () => {
                    this.setVisualizerType('waveform');
                });
            }
            
            const vizCircular = document.getElementById('viz-circular');
            if (vizCircular) {
                vizCircular.addEventListener('click', () => {
                    this.setVisualizerType('circular');
                });
            }
            
            const viz3d = document.getElementById('viz-3d');
            if (viz3d) {
                viz3d.addEventListener('click', () => {
                    this.setVisualizerType('3d');
                });
            }
            
            // Theme selectors
            const themeRetro = document.getElementById('theme-retro');
            if (themeRetro) {
                themeRetro.addEventListener('click', () => {
                    this.setTheme('retro');
                });
            }
            
            const themeModern = document.getElementById('theme-modern');
            if (themeModern) {
                themeModern.addEventListener('click', () => {
                    this.setTheme('modern');
                });
            }
            
            const themeNeon = document.getElementById('theme-neon');
            if (themeNeon) {
                themeNeon.addEventListener('click', () => {
                    this.setTheme('neon');
                });
            }
            
            const themeMinimal = document.getElementById('theme-minimal');
            if (themeMinimal) {
                themeMinimal.addEventListener('click', () => {
                    this.setTheme('minimal');
                });
            }
            
            // BPM detection event
            document.addEventListener('bpmdetected', (e) => {
                this.handleBPMDetected(e.detail);
            });
            
            // Track ended event
            document.addEventListener('trackended', (e) => {
                this.handleTrackEnded(e.detail);
            });
            
            // Window resize event
            window.addEventListener('resize', () => {
                this.handleResize();
            });
            
            console.log('Event listeners set up');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }
    
    /**
     * Set visualizer type
     */
    setVisualizerType(type) {
        try {
            // Update visualizer type
            this.visualizer.visualizerTypes['visualizer'] = type;
            
            // Update UI
            const buttons = document.querySelectorAll('.visualizer-type-selector .btn');
            buttons.forEach(button => button.classList.remove('active'));
            
            const activeButton = document.getElementById(`viz-${type}`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
            
            console.log(`Visualizer type set to: ${type}`);
        } catch (error) {
            console.error('Error setting visualizer type:', error);
        }
    }
    
    /**
     * Set theme
     */
    setTheme(theme) {
        try {
            this.appState.currentTheme = theme;
            document.body.className = `theme-${theme}`;
            
            console.log(`Theme set to: ${theme}`);
        } catch (error) {
            console.error('Error setting theme:', error);
        }
    }
    
    /**
     * Handle BPM detected event
     */
    handleBPMDetected(detail) {
        try {
            const { deckId, bpm, confidence } = detail;
            
            console.log(`BPM detected for ${deckId} deck: ${bpm} (confidence: ${confidence})`);
            
            // Update BPM display
            const bpmDisplay = document.getElementById('bpm-value');
            if (bpmDisplay) {
                bpmDisplay.textContent = Math.round(bpm);
            }
        } catch (error) {
            console.error('Error handling BPM detection:', error);
        }
    }
    
    /**
     * Handle track ended event
     */
    handleTrackEnded(detail) {
        try {
            const { deckId } = detail;
            
            console.log(`Track ended on ${deckId} deck`);
            
            // Update UI
            const playButton = document.getElementById(`play-${deckId}`);
            if (playButton) {
                playButton.textContent = 'PLAY';
            }
            
            const record = document.getElementById(`record-${deckId}`);
            if (record) {
                record.classList.remove('playing');
            }
        } catch (error) {
            console.error('Error handling track ended event:', error);
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        try {
            // Resize visualizers
            if (this.visualizer) {
                this.visualizer.resizeVisualizers();
            }
            
            // Resize waveform displays
            if (this.waveformDisplay) {
                this.waveformDisplay.handleResize();
            }
        } catch (error) {
            console.error('Error handling resize:', error);
        }
    }
    
    /**
     * Create sample directories and placeholder files
     */
    createSampleDirectories() {
        try {
            // In a real application, we would have actual audio samples
            console.log('Sample directories would be created here');
        } catch (error) {
            console.error('Error creating sample directories:', error);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create audio context on user interaction to comply with autoplay policies
    const startButton = document.createElement('button');
    startButton.textContent = 'START RETROMIX DJ';
    startButton.className = 'start-button';
    startButton.addEventListener('click', () => {
        try {
            // Remove start button
            document.body.removeChild(startButton);
            
            // Show loading message
            const loadingMessage = document.createElement('div');
            loadingMessage.textContent = 'Loading...';
            loadingMessage.className = 'loading-message';
            document.body.appendChild(loadingMessage);
            
            // Initialize app after a short delay to show loading animation
            setTimeout(() => {
                try {
                    document.body.removeChild(loadingMessage);
                    window.app = new RetroMixApp();
                } catch (error) {
                    console.error('Error initializing app:', error);
                    alert('Error initializing app: ' + error.message);
                }
            }, 1000);
        } catch (error) {
            console.error('Error starting app:', error);
            alert('Error starting app: ' + error.message);
        }
    });
    
    document.body.appendChild(startButton);
});

// Add styles for start button and loading message
const style = document.createElement('style');
style.textContent = `
    .start-button {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px 40px;
        font-family: 'Press Start 2P', cursive;
        font-size: 1.5rem;
        background-color: #ff00ff;
        color: #ffffff;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        box-shadow: 0 0 20px #00ffff;
        z-index: 1000;
        animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        100% { transform: translate(-50%, -50%) scale(1); }
    }
    
    .loading-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Press Start 2P', cursive;
        font-size: 2rem;
        color: #00ffff;
        z-index: 1000;
        animation: blink 1s infinite;
    }
    
    @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .beat-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #ffff00;
        transition: transform 0.1s, background-color 0.1s;
    }
    
    .beat-indicator.flash {
        transform: scale(1.5);
        background-color: #ffffff;
    }
    
    .downbeat-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #ff00ff;
        transition: transform 0.1s, background-color 0.1s;
    }
    
    .downbeat-indicator.flash {
        transform: scale(1.5);
        background-color: #ffffff;
    }
`;
document.head.appendChild(style);
