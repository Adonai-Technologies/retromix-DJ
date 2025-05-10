/**
 * RetroMix DJ - UI Controller Loop Extensions
 * Adds loop and hot cue UI functionality to the UI controller
 */

// Add these methods to the UIController class

/**
 * Initialize loop and hot cue UI elements
 */
UIController.prototype.initializeLoopAndHotCueUI = function() {
    // Add loop controls to each deck
    ['left', 'right'].forEach(deck => {
        this.setupLoopControls(deck);
        this.setupHotCueControls(deck);
    });
    
    // Listen for loop events
    document.addEventListener('looppointschanged', (e) => {
        this.updateLoopUI(e.detail.deckId);
    });
    
    document.addEventListener('hotcueset', (e) => {
        this.updateHotCueUI(e.detail.deckId, e.detail.index);
    });
    
    document.addEventListener('hotcuecleared', (e) => {
        this.updateHotCueUI(e.detail.deckId, e.detail.index);
    });
    
    document.addEventListener('hotcuesreset', (e) => {
        this.resetHotCueUI(e.detail.deckId);
    });
};

/**
 * Set up loop controls for a deck
 */
UIController.prototype.setupLoopControls = function(deck) {
    // Loop button
    const loopButton = document.getElementById(`loop-${deck}`);
    if (loopButton) {
        loopButton.addEventListener('click', () => {
            this.toggleLoop(deck);
        });
    }
    
    // Loop size buttons (if they exist)
    const loopSizeDownButton = document.getElementById(`loop-size-down-${deck}`);
    if (loopSizeDownButton) {
        loopSizeDownButton.addEventListener('click', () => {
            this.halveLoopSize(deck);
        });
    }
    
    const loopSizeUpButton = document.getElementById(`loop-size-up-${deck}`);
    if (loopSizeUpButton) {
        loopSizeUpButton.addEventListener('click', () => {
            this.doubleLoopSize(deck);
        });
    }
    
    // Loop in/out buttons (if they exist)
    const loopInButton = document.getElementById(`loop-in-${deck}`);
    if (loopInButton) {
        loopInButton.addEventListener('click', () => {
            this.setLoopIn(deck);
        });
    }
    
    const loopOutButton = document.getElementById(`loop-out-${deck}`);
    if (loopOutButton) {
        loopOutButton.addEventListener('click', () => {
            this.setLoopOut(deck);
        });
    }
};

/**
 * Set up hot cue controls for a deck
 */
UIController.prototype.setupHotCueControls = function(deck) {
    // Find all hot cue buttons
    for (let i = 1; i <= 8; i++) {
        const hotCueButton = document.getElementById(`hotcue-${i}-${deck}`);
        if (hotCueButton) {
            hotCueButton.addEventListener('click', (e) => {
                const index = i - 1; // Convert to 0-based index
                
                if (e.shiftKey) {
                    // Set hot cue if shift key is pressed
                    this.setHotCue(deck, index);
                } else {
                    // Jump to hot cue
                    this.jumpToHotCue(deck, index);
                }
            });
            
            // Right-click to clear hot cue
            hotCueButton.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const index = i - 1; // Convert to 0-based index
                this.clearHotCue(deck, index);
            });
        }
    }
};

/**
 * Toggle loop on/off for a deck
 */
UIController.prototype.toggleLoop = function(deck) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        console.warn('Loop system not available');
        return;
    }
    
    const loopEnabled = window.app.loopSystem.toggleLoop(deck);
    
    // Update UI
    const loopButton = document.getElementById(`loop-${deck}`);
    if (loopButton) {
        if (loopEnabled) {
            loopButton.classList.add('active');
        } else {
            loopButton.classList.remove('active');
        }
    }
};

/**
 * Set loop in point at current position
 */
UIController.prototype.setLoopIn = function(deck) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        console.warn('Loop system not available');
        return;
    }
    
    const currentTime = this.audioEngine.getCurrentTime(deck);
    const loopPoints = window.app.loopSystem.loopSettings[deck];
    
    // Set new start point, keep existing end point
    window.app.loopSystem.setLoopPoints(deck, currentTime, loopPoints.endPoint);
    
    // Update UI
    const loopInButton = document.getElementById(`loop-in-${deck}`);
    if (loopInButton) {
        loopInButton.classList.add('active');
        setTimeout(() => {
            loopInButton.classList.remove('active');
        }, 200);
    }
};

/**
 * Set loop out point at current position
 */
UIController.prototype.setLoopOut = function(deck) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        console.warn('Loop system not available');
        return;
    }
    
    const currentTime = this.audioEngine.getCurrentTime(deck);
    const loopPoints = window.app.loopSystem.loopSettings[deck];
    
    // Set new end point, keep existing start point
    window.app.loopSystem.setLoopPoints(deck, loopPoints.startPoint, currentTime);
    
    // Update UI
    const loopOutButton = document.getElementById(`loop-out-${deck}`);
    if (loopOutButton) {
        loopOutButton.classList.add('active');
        setTimeout(() => {
            loopOutButton.classList.remove('active');
        }, 200);
    }
};

/**
 * Double loop size
 */
UIController.prototype.doubleLoopSize = function(deck) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        console.warn('Loop system not available');
        return;
    }
    
    const newSize = window.app.loopSystem.doubleLoopSize(deck);
    
    // Update UI
    this.updateLoopSizeUI(deck, newSize);
};

/**
 * Halve loop size
 */
UIController.prototype.halveLoopSize = function(deck) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        console.warn('Loop system not available');
        return;
    }
    
    const newSize = window.app.loopSystem.halveLoopSize(deck);
    
    // Update UI
    this.updateLoopSizeUI(deck, newSize);
};

/**
 * Update loop size UI
 */
UIController.prototype.updateLoopSizeUI = function(deck, size) {
    // Update loop size display if it exists
    const loopSizeDisplay = document.getElementById(`loop-size-${deck}`);
    if (loopSizeDisplay) {
        if (size < 1) {
            // Show as fraction
            loopSizeDisplay.textContent = `1/${Math.round(1/size)}`;
        } else {
            loopSizeDisplay.textContent = `${size}`;
        }
    }
};

/**
 * Update loop UI
 */
UIController.prototype.updateLoopUI = function(deck) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        return;
    }
    
    const loopSettings = window.app.loopSystem.loopSettings[deck];
    
    // Update loop button
    const loopButton = document.getElementById(`loop-${deck}`);
    if (loopButton) {
        if (loopSettings.enabled) {
            loopButton.classList.add('active');
        } else {
            loopButton.classList.remove('active');
        }
    }
    
    // Update loop size display
    this.updateLoopSizeUI(deck, loopSettings.size);
};

/**
 * Set hot cue at current position
 */
UIController.prototype.setHotCue = function(deck, index) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        console.warn('Loop system not available');
        return;
    }
    
    window.app.loopSystem.setHotCue(deck, index);
};

/**
 * Jump to hot cue
 */
UIController.prototype.jumpToHotCue = function(deck, index) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        console.warn('Loop system not available');
        return;
    }
    
    window.app.loopSystem.jumpToHotCue(deck, index);
};

/**
 * Clear hot cue
 */
UIController.prototype.clearHotCue = function(deck, index) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        console.warn('Loop system not available');
        return;
    }
    
    window.app.loopSystem.clearHotCue(deck, index);
};

/**
 * Update hot cue UI
 */
UIController.prototype.updateHotCueUI = function(deck, index) {
    // Check if we have a loop system
    if (!window.app.loopSystem) {
        return;
    }
    
    const hotCues = window.app.loopSystem.hotCues[deck];
    const hotCueButton = document.getElementById(`hotcue-${index + 1}-${deck}`);
    
    if (hotCueButton) {
        if (hotCues[index] !== null) {
            hotCueButton.classList.add('set');
        } else {
            hotCueButton.classList.remove('set');
        }
    }
};

/**
 * Reset hot cue UI
 */
UIController.prototype.resetHotCueUI = function(deck) {
    // Find all hot cue buttons for this deck and reset them
    for (let i = 1; i <= 8; i++) {
        const hotCueButton = document.getElementById(`hotcue-${i}-${deck}`);
        if (hotCueButton) {
            hotCueButton.classList.remove('set');
        }
    }
};
