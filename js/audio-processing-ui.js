/**
 * RetroMix DJ - Advanced Audio Processing UI
 * Handles the user interface for the advanced audio processing features
 */

/**
 * Initialize Advanced Audio Processing
 */
function initializeAdvancedAudioProcessing() {
    // Create advanced audio processor
    const audioProcessor = new AdvancedAudioProcessor(window.app.audioEngine);
    window.app.audioProcessor = audioProcessor;
    
    // Set up tab switching
    setupTabs();
    
    // Set up deck switching
    setupDeckSwitching();
    
    // Set up effect controls
    setupEffectControls();
    
    // Set up compressor controls
    setupCompressorControls();
    
    // Set up sidechain controls
    setupSidechainControls();
    
    console.log('Advanced Audio Processing initialized');
}

/**
 * Set up tab switching
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.effects-tab');
    const contents = document.querySelectorAll('.effects-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabId = tab.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

/**
 * Set up deck switching
 */
function setupDeckSwitching() {
    const deckButtons = document.querySelectorAll('.deck-button');
    
    deckButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get parent tab
            const tab = button.closest('.effects-content');
            
            // Remove active class from all buttons in this tab
            tab.querySelectorAll('.deck-button').forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding deck controls
            const deck = button.dataset.deck;
            
            if (tab.id === 'effects-tab') {
                document.getElementById('left-effects').style.display = deck === 'left' ? 'grid' : 'none';
                document.getElementById('right-effects').style.display = deck === 'right' ? 'grid' : 'none';
            } else if (tab.id === 'compression-tab') {
                document.getElementById('left-compressor').style.display = deck === 'left' ? 'block' : 'none';
                document.getElementById('right-compressor').style.display = deck === 'right' ? 'block' : 'none';
            }
        });
    });
}

/**
 * Set up effect controls
 */
function setupEffectControls() {
    // Set up effect toggles and sliders for both decks
    ['left', 'right'].forEach(deck => {
        setupEffectControlsForDeck(deck);
    });
}

/**
 * Set up effect controls for a specific deck
 */
function setupEffectControlsForDeck(deck) {
    const audioProcessor = window.app.audioProcessor;
    
    // Reverb
    setupEffectToggle('reverb', deck);
    setupEffectSlider('reverb', 'decay', deck);
    setupEffectSlider('reverb', 'predelay', deck);
    setupEffectSlider('reverb', 'mix', deck);
    
    // Delay
    setupEffectToggle('delay', deck);
    setupEffectSlider('delay', 'time', deck);
    setupEffectSlider('delay', 'feedback', deck);
    setupEffectSlider('delay', 'mix', deck);
    
    // Flanger
    setupEffectToggle('flanger', deck);
    setupEffectSlider('flanger', 'rate', deck);
    setupEffectSlider('flanger', 'depth', deck);
    setupEffectSlider('flanger', 'feedback', deck);
    setupEffectSlider('flanger', 'mix', deck);
    
    // Distortion
    setupEffectToggle('distortion', deck);
    setupEffectSlider('distortion', 'amount', deck);
    setupEffectSlider('distortion', 'mix', deck);
}

/**
 * Set up effect toggle
 */
function setupEffectToggle(effect, deck) {
    const toggle = document.getElementById(`${effect}-toggle-${deck}`);
    if (!toggle) return;
    
    toggle.addEventListener('click', () => {
        const enabled = window.app.audioProcessor.toggleEffect(deck, effect);
        
        if (enabled) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    });
}

/**
 * Set up effect slider
 */
function setupEffectSlider(effect, param, deck) {
    const slider = document.getElementById(`${effect}-${param}-${deck}`);
    if (!slider) return;
    
    const valueDisplay = slider.nextElementSibling;
    
    // Update value display on input
    slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        
        // Update value display with appropriate formatting
        switch (param) {
            case 'decay':
            case 'time':
            case 'release':
                valueDisplay.textContent = `${value.toFixed(1)}s`;
                break;
            case 'predelay':
                valueDisplay.textContent = `${(value * 1000).toFixed(0)}ms`;
                break;
            case 'mix':
            case 'feedback':
                valueDisplay.textContent = `${(value * 100).toFixed(0)}%`;
                break;
            case 'rate':
                valueDisplay.textContent = `${value.toFixed(1)}Hz`;
                break;
            case 'depth':
                valueDisplay.textContent = `${value.toFixed(1)}ms`;
                break;
            default:
                valueDisplay.textContent = value.toFixed(1);
        }
        
        // Update effect parameter
        window.app.audioProcessor.updateEffectParameter(deck, effect, param, value);
    });
}

/**
 * Set up compressor controls
 */
function setupCompressorControls() {
    // Set up compressor toggles and sliders for both decks
    ['left', 'right'].forEach(deck => {
        setupCompressorControlsForDeck(deck);
    });
}

/**
 * Set up compressor controls for a specific deck
 */
function setupCompressorControlsForDeck(deck) {
    const audioProcessor = window.app.audioProcessor;
    
    // Compressor toggle
    const toggle = document.getElementById(`compressor-toggle-${deck}`);
    if (toggle) {
        toggle.addEventListener('click', () => {
            const enabled = audioProcessor.toggleMultibandCompressor(deck);
            
            if (enabled) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        });
    }
    
    // Low band controls
    setupCompressorSlider('low', 'threshold', deck);
    setupCompressorSlider('low', 'ratio', deck);
    setupCompressorSlider('low', 'gain', deck);
    
    // Mid band controls
    setupCompressorSlider('mid', 'threshold', deck);
    setupCompressorSlider('mid', 'ratio', deck);
    setupCompressorSlider('mid', 'gain', deck);
    
    // High band controls
    setupCompressorSlider('high', 'threshold', deck);
    setupCompressorSlider('high', 'ratio', deck);
    setupCompressorSlider('high', 'gain', deck);
    
    // Limiter controls
    setupCompressorSlider('limiter', 'threshold', deck);
    setupCompressorSlider('limiter', 'gain', deck);
}

/**
 * Set up compressor slider
 */
function setupCompressorSlider(band, param, deck) {
    const slider = document.getElementById(`${band}-${param}-${deck}`);
    if (!slider) return;
    
    const valueDisplay = slider.nextElementSibling;
    
    // Update value display on input
    slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        
        // Update value display with appropriate formatting
        switch (param) {
            case 'threshold':
                valueDisplay.textContent = `${value.toFixed(0)}dB`;
                break;
            case 'ratio':
                valueDisplay.textContent = `${value.toFixed(1)}:1`;
                break;
            case 'gain':
                const gainDb = 20 * Math.log10(value);
                valueDisplay.textContent = gainDb === 0 ? '0dB' : `${gainDb.toFixed(1)}dB`;
                break;
            default:
                valueDisplay.textContent = value.toFixed(1);
        }
        
        // Update compressor parameter
        window.app.audioProcessor.updateCompressorParameter(deck, band, param, value);
    });
}

/**
 * Set up sidechain controls
 */
function setupSidechainControls() {
    const audioProcessor = window.app.audioProcessor;
    
    // Sidechain toggle
    const toggle = document.getElementById('sidechain-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const enabled = audioProcessor.toggleSidechain();
            
            if (enabled) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        });
    }
    
    // Source select
    const sourceSelect = document.getElementById('sidechain-source');
    if (sourceSelect) {
        sourceSelect.addEventListener('change', () => {
            audioProcessor.updateSidechainParameter('source', sourceSelect.value);
        });
    }
    
    // Target select
    const targetSelect = document.getElementById('sidechain-target');
    if (targetSelect) {
        targetSelect.addEventListener('change', () => {
            audioProcessor.updateSidechainParameter('target', targetSelect.value);
        });
    }
    
    // Amount slider
    const amountSlider = document.getElementById('sidechain-amount');
    if (amountSlider) {
        const valueDisplay = amountSlider.nextElementSibling;
        
        amountSlider.addEventListener('input', () => {
            const value = parseFloat(amountSlider.value);
            valueDisplay.textContent = `${(value * 100).toFixed(0)}%`;
            audioProcessor.updateSidechainParameter('amount', value);
        });
    }
    
    // Release slider
    const releaseSlider = document.getElementById('sidechain-release');
    if (releaseSlider) {
        const valueDisplay = releaseSlider.nextElementSibling;
        
        releaseSlider.addEventListener('input', () => {
            const value = parseFloat(releaseSlider.value);
            valueDisplay.textContent = `${(value * 1000).toFixed(0)}ms`;
            audioProcessor.updateSidechainParameter('release', value);
        });
    }
}

// Export functions
window.initializeAdvancedAudioProcessing = initializeAdvancedAudioProcessing;
