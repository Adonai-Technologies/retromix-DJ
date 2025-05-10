/**
 * RetroMix DJ - Fixed UI Controller
 * Handles all user interface interactions and updates
 */

class UIController {
    constructor(audioEngine, visualizer) {
        this.audioEngine = audioEngine;
        this.visualizer = visualizer;
        this.elements = {};
        this.currentDeckToLoad = null;
        
        // Initialize UI
        this.initializeUI();
        
        console.log('UI Controller initialized');
    }
    
    /**
     * Initialize UI elements and event listeners
     */
    initializeUI() {
        // Cache DOM elements
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
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
                loopButton: document.getElementById(`loop-${deck}`),
                volumeSlider: document.getElementById(`volume-${deck}`),
                eqHigh: document.getElementById(`eq-high-${deck}`),
                eqMid: document.getElementById(`eq-mid-${deck}`),
                eqLow: document.getElementById(`eq-low-${deck}`),
                speedKnob: document.getElementById(`speed-${deck}`),
                record: document.getElementById(`record-${deck}`),
                tonearm: document.getElementById(`tonearm-${deck}`),
                waveform: document.getElementById(`waveform-${deck}`)
            };
            
            // Hot cue buttons
            this.elements[`${deck}Deck`].hotCueButtons = [];
            for (let i = 1; i <= 4; i++) {
                const hotCueButton = document.getElementById(`hotcue-${i}-${deck}`);
                if (hotCueButton) {
                    this.elements[`${deck}Deck`].hotCueButtons.push(hotCueButton);
                }
            }
        });
        
        // Mixer elements
        this.elements.mixer = {
            crossfader: document.getElementById('crossfader'),
            visualizer: document.getElementById('visualizer'),
            syncButton: document.getElementById('sync-button'),
            recordButton: document.getElementById('record-button')
        };
        
        // Effect buttons
        this.elements.effectButtons = {
            echo: document.getElementById('effect-1'),
            filter: document.getElementById('effect-2'),
            flanger: document.getElementById('effect-3'),
            bitcrush: document.getElementById('effect-4')
        };
        
        // Sample pads
        this.elements.samplePads = [];
        for (let i = 1; i <= 8; i++) {
            const pad = document.getElementById(`pad-${i}`);
            if (pad) {
                this.elements.samplePads.push(pad);
            }
        }
        
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
        
        // Sync button
        if (this.elements.mixer.syncButton) {
            this.elements.mixer.syncButton.addEventListener('click', () => {
                this.syncDecks();
            });
        }
        
        // Record button
        if (this.elements.mixer.recordButton) {
            this.elements.mixer.recordButton.addEventListener('click', () => {
                this.toggleRecording();
            });
        }
        
        // Effect buttons
        for (const [effect, button] of Object.entries(this.elements.effectButtons)) {
            if (button) {
                button.addEventListener('click', () => {
                    this.toggleEffect(effect);
                });
            }
        }
        
        // Sample pads
        this.elements.samplePads.forEach((pad, index) => {
            pad.addEventListener('click', () => {
                this.playSample(index);
            });
        });
        
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
        
        // BPM detected event
        document.addEventListener('bpmdetected', (e) => {
            const { deckId, bpm } = e.detail;
            this.updateBPMDisplay(bpm);
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
        
        // Loop button
        if (deckElements.loopButton) {
            deckElements.loopButton.addEventListener('click', () => {
                this.toggleLoop(deck);
            });
        }
        
        // Volume slider
        if (deckElements.volumeSlider) {
            deckElements.volumeSlider.addEventListener('input', (e) => {
                this.setVolume(deck, e.target.value);
            });
        }
        
        // EQ knobs
        this.setupKnobInteraction(deckElements.eqHigh, (value) => {
            this.setEQ(deck, 'high', value);
        });
        
        this.setupKnobInteraction(deckElements.eqMid, (value) => {
            this.setEQ(deck, 'mid', value);
        });
        
        this.setupKnobInteraction(deckElements.eqLow, (value) => {
            this.setEQ(deck, 'low', value);
        });
        
        // Speed knob
        this.setupKnobInteraction(deckElements.speedKnob, (value) => {
            this.setSpeed(deck, value);
        });
        
        // Hot cue buttons
        deckElements.hotCueButtons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
                if (e.shiftKey) {
                    // Set hot cue
                    this.setHotCue(deck, index);
                } else {
                    // Jump to hot cue
                    this.jumpToHotCue(deck, index);
                }
            });
        });
        
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
     * Set up knob interaction with mouse
     */
    setupKnobInteraction(knobElement, callback) {
        if (!knobElement) return;
        
        let rotating = false;
        let startY = 0;
        let startRotation = 0;
        
        knobElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            rotating = true;
            startY = e.clientY;
            startRotation = this.getCurrentRotation(knobElement);
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        const handleMouseMove = (e) => {
            if (!rotating) return;
            
            // Calculate vertical movement (up = increase, down = decrease)
            const deltaY = startY - e.clientY;
            
            // Convert to rotation (0-270 degrees)
            const sensitivity = 0.5; // Adjust for sensitivity
            let newRotation = startRotation + deltaY * sensitivity;
            
            // Clamp rotation to 0-270 degrees
            newRotation = Math.max(0, Math.min(270, newRotation));
            
            // Apply rotation
            knobElement.style.transform = `rotate(${newRotation}deg)`;
            
            // Calculate normalized value (0-1)
            const normalizedValue = newRotation / 270;
            
            // Call the callback
            callback(normalizedValue);
        };
        
        const handleMouseUp = () => {
            rotating = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }
    
    /**
     * Get current rotation of a knob element
     */
    getCurrentRotation(element) {
        const transform = element.style.transform;
        if (!transform) return 0;
        
        const match = transform.match(/rotate\(([0-9.]+)deg\)/);
        return match ? parseFloat(match[1]) : 0;
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
        const tonearm = this.elements[`${deck}Deck`].tonearm;
        
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
        
        if (tonearm) {
            if (isPlaying) {
                tonearm.style.transform = 'rotate(0deg)';
            } else {
                tonearm.style.transform = 'rotate(-30deg)';
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
     * Toggle loop on a deck
     */
    toggleLoop(deck) {
        const loopButton = this.elements[`${deck}Deck`].loopButton;
        if (!loopButton) return;
        
        const isActive = loopButton.classList.contains('active');
        
        // Toggle loop state
        if (isActive) {
            loopButton.classList.remove('active');
            // Disable loop in audio engine (if implemented)
        } else {
            loopButton.classList.add('active');
            // Enable loop in audio engine (if implemented)
        }
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
     * Set EQ for a deck
     */
    setEQ(deck, band, normalizedValue) {
        // Convert normalized value (0-1) to gain (-12 to +12 dB)
        const gain = normalizedValue * 24 - 12;
        this.audioEngine.setEQ(deck, band, gain);
    }
    
    /**
     * Set playback speed for a deck
     */
    setSpeed(deck, normalizedValue) {
        // Convert normalized value (0-1) to speed (0.5 to 1.5)
        const speed = 0.5 + normalizedValue;
        this.audioEngine.setPlaybackRate(deck, speed);
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
     * Sync decks (tempo and phase)
     */
    syncDecks() {
        // Determine which deck is the master (the one that's playing)
        let masterDeck, slaveDeck;
        
        if (this.audioEngine.decks.left.isPlaying && !this.audioEngine.decks.right.isPlaying) {
            masterDeck = 'left';
            slaveDeck = 'right';
        } else if (!this.audioEngine.decks.left.isPlaying && this.audioEngine.decks.right.isPlaying) {
            masterDeck = 'right';
            slaveDeck = 'left';
        } else if (this.audioEngine.decks.left.isPlaying && this.audioEngine.decks.right.isPlaying) {
            // Both playing, use left as master by default
            masterDeck = 'left';
            slaveDeck = 'right';
        } else {
            // Neither playing, can't sync
            alert('Please play at least one deck to sync');
            return;
        }
        
        // Sync tempo
        const success = this.audioEngine.syncTempo(masterDeck, slaveDeck);
        
        if (success) {
            // Update UI
            const normalizedValue = (this.audioEngine.decks[slaveDeck].playbackRate - 0.5) / 1.0;
            const speedKnob = this.elements[`${slaveDeck}Deck`].speedKnob;
            if (speedKnob) {
                speedKnob.style.transform = `rotate(${normalizedValue * 270}deg)`;
            }
            
            // Flash sync button for visual feedback
            const syncButton = this.elements.mixer.syncButton;
            if (syncButton) {
                syncButton.classList.add('active');
                setTimeout(() => {
                    syncButton.classList.remove('active');
                }, 200);
            }
            
            console.log(`Synced ${slaveDeck} deck to ${masterDeck} deck`);
        }
    }
    
    /**
     * Toggle effect on/off
     */
    toggleEffect(effect) {
        const button = this.elements.effectButtons[effect];
        if (!button) return;
        
        const isActive = button.classList.contains('active');
        
        // Toggle effect state
        if (isActive) {
            button.classList.remove('active');
            // Disable effect in audio engine (if implemented)
        } else {
            button.classList.add('active');
            // Enable effect in audio engine (if implemented)
        }
    }
    
    /**
     * Play a sample
     */
    playSample(index) {
        const pad = this.elements.samplePads[index];
        if (!pad) return;
        
        // Visual feedback
        pad.classList.add('active');
        setTimeout(() => {
            pad.classList.remove('active');
        }, 200);
        
        // Play sample (if implemented in audio engine)
        console.log(`Playing sample ${index + 1}`);
    }
    
    /**
     * Set hot cue point
     */
    setHotCue(deck, index) {
        const button = this.elements[`${deck}Deck`].hotCueButtons[index];
        if (!button) return;
        
        // Visual feedback
        button.classList.add('set');
        
        console.log(`Set hot cue ${index + 1} for ${deck} deck`);
    }
    
    /**
     * Jump to hot cue point
     */
    jumpToHotCue(deck, index) {
        const button = this.elements[`${deck}Deck`].hotCueButtons[index];
        if (!button) return;
        
        // Visual feedback
        button.classList.add('active');
        setTimeout(() => {
            button.classList.remove('active');
        }, 200);
        
        console.log(`Jump to hot cue ${index + 1} for ${deck} deck`);
    }
    
    /**
     * Toggle recording
     */
    toggleRecording() {
        const recordButton = this.elements.mixer.recordButton;
        if (!recordButton) return;
        
        const isActive = recordButton.classList.contains('active');
        
        if (isActive) {
            recordButton.classList.remove('active');
            // Stop recording (if implemented in audio engine)
            console.log('Recording stopped');
        } else {
            recordButton.classList.add('active');
            // Start recording (if implemented in audio engine)
            console.log('Recording started');
        }
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
