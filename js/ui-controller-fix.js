/**
 * RetroMix DJ - Fixed UI Controller
 * This version fixes the track loading and playback issues
 */

class UIController {
    constructor(audioEngine, visualizer) {
        this.audioEngine = audioEngine;
        this.visualizer = visualizer;
        this.elements = {};
        this.currentDeckToLoad = null;
        
        // Initialize UI
        this.initializeUI();
    }
    
    /**
     * Initialize UI elements and event listeners
     */
    initializeUI() {
        // Cache DOM elements
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('UI Controller initialized');
    }
    
    /**
     * Cache DOM elements for faster access
     */
    cacheElements() {
        // Deck elements
        ['left', 'right'].forEach(deck => {
            this.elements[`${deck}Deck`] = {
                trackInfo: document.getElementById(`track-info-${deck}`),
                playButton: document.getElementById(`play-${deck}`),
                cueButton: document.getElementById(`cue-${deck}`),
                loadButton: document.getElementById(`load-${deck}`),
                volumeSlider: document.getElementById(`volume-${deck}`),
                eqHigh: document.getElementById(`eq-high-${deck}`),
                eqMid: document.getElementById(`eq-mid-${deck}`),
                eqLow: document.getElementById(`eq-low-${deck}`),
                speedKnob: document.getElementById(`speed-${deck}`),
                record: document.getElementById(`record-${deck}`),
                tonearm: document.getElementById(`tonearm-${deck}`)
            };
        });
        
        // Mixer elements
        this.elements.mixer = {
            crossfader: document.getElementById('crossfader'),
            visualizer: document.getElementById('visualizer')
        };
        
        // File dialog
        this.elements.fileDialog = document.getElementById('file-dialog');
        this.elements.fileInput = document.getElementById('audio-file-input');
        this.elements.loadFileBtn = document.getElementById('load-file-btn');
        this.elements.closeFileDialog = this.elements.fileDialog.querySelector('.close');
        
        // BPM display
        this.elements.bpmDisplay = document.getElementById('bpm-value');
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Ensure audio context is resumed on user interaction
        document.body.addEventListener('click', () => {
            this.audioEngine.resumeAudioContext();
        });
        
        // Deck controls - Left
        this.setupDeckEventListeners('left');
        
        // Deck controls - Right
        this.setupDeckEventListeners('right');
        
        // Crossfader
        if (this.elements.mixer.crossfader) {
            this.elements.mixer.crossfader.addEventListener('input', (e) => {
                this.handleCrossfader(e.target.value);
            });
        }
        
        // File dialog
        if (this.elements.closeFileDialog) {
            this.elements.closeFileDialog.addEventListener('click', () => {
                this.closeFileDialog();
            });
        }
        
        if (this.elements.loadFileBtn) {
            this.elements.loadFileBtn.addEventListener('click', () => {
                this.loadSelectedFile();
            });
        }
        
        // Track ended event
        document.addEventListener('trackended', (e) => {
            const { deckId } = e.detail;
            this.updatePlayButtonState(deckId, false);
        });
    }
    
    /**
     * Set up event listeners for a specific deck
     */
    setupDeckEventListeners(deck) {
        const deckElements = this.elements[`${deck}Deck`];
        
        // Load button
        if (deckElements.loadButton) {
            deckElements.loadButton.addEventListener('click', () => {
                this.openFileDialog(deck);
            });
        }
        
        // Play button
        if (deckElements.playButton) {
            deckElements.playButton.addEventListener('click', () => {
                this.togglePlay(deck);
            });
        }
        
        // Cue button
        if (deckElements.cueButton) {
            deckElements.cueButton.addEventListener('click', () => {
                this.cueTrack(deck);
            });
        }
        
        // Volume slider
        if (deckElements.volumeSlider) {
            deckElements.volumeSlider.addEventListener('input', (e) => {
                this.setVolume(deck, e.target.value);
            });
        }
        
        // Setup drag and drop for this deck
        this.setupDragAndDrop(deck);
    }
    
    /**
     * Set up drag and drop for a deck
     */
    setupDragAndDrop(deck) {
        const deckElement = document.querySelector(`.deck-${deck}`);
        if (!deckElement) return;
        
        deckElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            deckElement.classList.add('drag-over');
        });
        
        deckElement.addEventListener('dragleave', () => {
            deckElement.classList.remove('drag-over');
        });
        
        deckElement.addEventListener('drop', (e) => {
            e.preventDefault();
            deckElement.classList.remove('drag-over');
            
            // Check if files were dropped
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('audio/')) {
                    this.loadTrack(deck, file);
                } else {
                    alert('Please drop an audio file.');
                }
            }
        });
    }
    
    /**
     * Open file dialog for track loading
     */
    openFileDialog(deck) {
        // Store target deck
        this.currentDeckToLoad = deck;
        
        // Reset file input
        if (this.elements.fileInput) {
            this.elements.fileInput.value = '';
        }
        
        // Show dialog
        if (this.elements.fileDialog) {
            this.elements.fileDialog.style.display = 'block';
        }
    }
    
    /**
     * Close file dialog
     */
    closeFileDialog() {
        if (this.elements.fileDialog) {
            this.elements.fileDialog.style.display = 'none';
        }
    }
    
    /**
     * Load selected file from dialog
     */
    loadSelectedFile() {
        const fileInput = this.elements.fileInput;
        
        if (!fileInput || fileInput.files.length === 0) {
            alert('Please select an audio file.');
            return;
        }
        
        const file = fileInput.files[0];
        
        // Check if it's an audio file
        if (!file.type.startsWith('audio/')) {
            alert('Please select an audio file.');
            return;
        }
        
        this.loadTrack(this.currentDeckToLoad, file);
        
        // Close dialog
        this.closeFileDialog();
    }
    
    /**
     * Load track into deck
     */
    async loadTrack(deck, file) {
        try {
            // Update UI to show loading state
            this.updateTrackInfo(deck, `Loading: ${file.name}...`);
            
            // Load track into audio engine
            await this.audioEngine.loadTrack(deck, file);
            
            // Update UI with track info
            this.updateTrackInfo(deck, file.name);
            
            // Log success
            console.log(`Track loaded successfully: ${file.name} in ${deck} deck`);
            
            return true;
        } catch (error) {
            console.error('Error loading track:', error);
            this.updateTrackInfo(deck, 'Error loading track');
            alert(`Error loading track: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Update track info display
     */
    updateTrackInfo(deck, text) {
        if (this.elements[`${deck}Deck`].trackInfo) {
            this.elements[`${deck}Deck`].trackInfo.textContent = text;
        }
    }
    
    /**
     * Toggle play/pause on a deck
     */
    togglePlay(deck) {
        // Check if deck is loaded by directly querying the audio engine
        if (!this.audioEngine.isDeckLoaded(deck)) {
            alert('Please load a track first.');
            return;
        }
        
        const deckState = this.audioEngine.decks[deck];
        
        if (deckState.isPlaying) {
            // Pause
            this.audioEngine.pauseDeck(deck);
            this.updatePlayButtonState(deck, false);
        } else {
            // Play
            const success = this.audioEngine.playDeck(deck);
            if (success) {
                this.updatePlayButtonState(deck, true);
            }
        }
    }
    
    /**
     * Update play button state and record animation
     */
    updatePlayButtonState(deck, isPlaying) {
        const playButton = this.elements[`${deck}Deck`].playButton;
        const record = this.elements[`${deck}Deck`].record;
        
        if (playButton) {
            playButton.textContent = isPlaying ? 'PAUSE' : 'PLAY';
        }
        
        if (record) {
            if (isPlaying) {
                record.classList.add('playing');
            } else {
                record.classList.remove('playing');
            }
        }
    }
    
    /**
     * Cue track (stop and return to cue point)
     */
    cueTrack(deck) {
        this.audioEngine.stopDeck(deck);
        this.updatePlayButtonState(deck, false);
    }
    
    /**
     * Set volume for a deck
     */
    setVolume(deck, value) {
        // Convert range 0-100 to 0-1
        const volume = value / 100;
        this.audioEngine.setVolume(deck, volume);
    }
    
    /**
     * Handle crossfader movement
     */
    handleCrossfader(value) {
        // Convert range 0-100 to 0-1
        const position = value / 100;
        this.audioEngine.setCrossfader(position);
    }
    
    /**
     * Update BPM display
     */
    updateBPMDisplay(bpm) {
        if (this.elements.bpmDisplay && bpm) {
            this.elements.bpmDisplay.textContent = Math.round(bpm);
        }
    }
}

// Export the class
window.UIController = UIController;
