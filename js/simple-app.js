/**
 * RetroMix DJ - Simple Application
 * A simplified version that works without the advanced components
 */

// Main application class
class SimpleRetroMixApp {
    constructor() {
        // Initialize components
        this.audioEngine = new AudioEngine();
        this.visualizer = new Visualizer(this.audioEngine);
        this.uiController = new UIController(this.audioEngine, this.visualizer);
        
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
    }
    
    /**
     * Initialize application
     */
    initialize() {
        // Initialize visualizers
        this.initializeVisualizers();
        
        // Set up event listeners for app-level events
        this.setupEventListeners();
        
        console.log('Simple RetroMix DJ initialized');
    }
    
    /**
     * Initialize visualizers
     */
    initializeVisualizers() {
        // Main visualizer
        this.visualizer.initVisualizer('visualizer', 'spectrum');
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Visualizer type selector
        document.getElementById('viz-spectrum').addEventListener('click', () => {
            this.setVisualizerType('spectrum');
        });
        
        document.getElementById('viz-waveform').addEventListener('click', () => {
            this.setVisualizerType('waveform');
        });
        
        document.getElementById('viz-circular').addEventListener('click', () => {
            this.setVisualizerType('circular');
        });
        
        document.getElementById('viz-3d').addEventListener('click', () => {
            this.setVisualizerType('3d');
        });
        
        // Theme selectors
        document.getElementById('theme-retro').addEventListener('click', () => {
            this.setTheme('retro');
        });
        
        document.getElementById('theme-modern').addEventListener('click', () => {
            this.setTheme('modern');
        });
        
        document.getElementById('theme-neon').addEventListener('click', () => {
            this.setTheme('neon');
        });
        
        document.getElementById('theme-minimal').addEventListener('click', () => {
            this.setTheme('minimal');
        });
    }
    
    /**
     * Set visualizer type
     */
    setVisualizerType(type) {
        // Update visualizer type
        this.visualizer.visualizerTypes['visualizer'] = type;
        
        // Update UI
        const buttons = document.querySelectorAll('.visualizer-type-selector .btn');
        buttons.forEach(button => button.classList.remove('active'));
        
        document.getElementById(`viz-${type}`).classList.add('active');
    }
    
    /**
     * Set theme
     */
    setTheme(theme) {
        this.appState.currentTheme = theme;
        document.body.className = `theme-${theme}`;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create audio context on user interaction to comply with autoplay policies
    const startButton = document.createElement('button');
    startButton.textContent = 'START RETROMIX DJ';
    startButton.className = 'start-button';
    startButton.addEventListener('click', () => {
        // Remove start button
        document.body.removeChild(startButton);
        
        // Show loading message
        const loadingMessage = document.createElement('div');
        loadingMessage.textContent = 'Loading...';
        loadingMessage.className = 'loading-message';
        document.body.appendChild(loadingMessage);
        
        // Initialize app after a short delay to show loading animation
        setTimeout(() => {
            document.body.removeChild(loadingMessage);
            window.app = new SimpleRetroMixApp();
        }, 1000);
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
`;
document.head.appendChild(style);
