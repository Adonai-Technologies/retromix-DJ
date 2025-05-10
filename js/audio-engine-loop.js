/**
 * RetroMix DJ - Enhanced Audio Engine with Loop Support
 * Adds loop and hot cue functionality to the audio engine
 */

// Add these methods to the AudioEngine class

/**
 * Jump to a specific time in a track
 */
AudioEngine.prototype.jumpToTime = function(deckId, time) {
    const deck = this.decks[deckId];
    
    if (!deck.buffer) {
        console.warn(`No track loaded in deck ${deckId}`);
        return false;
    }
    
    // Ensure time is within valid range
    time = Math.max(0, Math.min(deck.buffer.duration, time));
    
    // If playing, restart at new position
    if (deck.isPlaying) {
        if (deck.source) {
            deck.source.stop();
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = deck.buffer;
        source.playbackRate.value = deck.playbackRate;
        source.connect(deck.eqLow);
        
        source.start(0, time);
        deck.source = source;
        deck.startTime = this.audioContext.currentTime - time;
        
        // Handle track end
        source.onended = () => {
            if (deck.isPlaying) {
                deck.isPlaying = false;
                deck.pauseTime = 0;
                
                const event = new CustomEvent('trackended', {
                    detail: { deckId: deckId }
                });
                document.dispatchEvent(event);
            }
        };
    } else {
        // Just update pause time
        deck.pauseTime = time;
    }
    
    // Dispatch event for UI update
    const event = new CustomEvent('timechanged', {
        detail: {
            deckId: deckId,
            time: time
        }
    });
    document.dispatchEvent(event);
    
    return true;
};

/**
 * Set loop points for a deck
 */
AudioEngine.prototype.setLoopPoints = function(deckId, startPoint, endPoint) {
    const deck = this.decks[deckId];
    
    if (!deck.buffer) {
        console.warn(`No track loaded in deck ${deckId}`);
        return false;
    }
    
    // Ensure points are within valid range
    startPoint = Math.max(0, Math.min(deck.buffer.duration, startPoint));
    endPoint = Math.max(startPoint + 0.1, Math.min(deck.buffer.duration, endPoint));
    
    // Store loop points
    deck.loopStart = startPoint;
    deck.loopEnd = endPoint;
    
    return true;
};

/**
 * Enable loop for a deck
 */
AudioEngine.prototype.enableLoop = function(deckId) {
    const deck = this.decks[deckId];
    
    if (!deck.buffer || !deck.loopStart || !deck.loopEnd) {
        console.warn(`Cannot enable loop for deck ${deckId}: no loop points set`);
        return false;
    }
    
    deck.loopEnabled = true;
    
    // If current position is past loop end, jump to loop start
    const currentTime = this.getCurrentTime(deckId);
    if (currentTime >= deck.loopEnd) {
        this.jumpToTime(deckId, deck.loopStart);
    }
    
    return true;
};

/**
 * Disable loop for a deck
 */
AudioEngine.prototype.disableLoop = function(deckId) {
    const deck = this.decks[deckId];
    deck.loopEnabled = false;
    return true;
};

/**
 * Check if loop is enabled for a deck
 */
AudioEngine.prototype.isLoopEnabled = function(deckId) {
    return this.decks[deckId].loopEnabled === true;
};

/**
 * Get loop points for a deck
 */
AudioEngine.prototype.getLoopPoints = function(deckId) {
    const deck = this.decks[deckId];
    return {
        start: deck.loopStart || 0,
        end: deck.loopEnd || 0
    };
};

/**
 * Set hot cue point
 */
AudioEngine.prototype.setHotCue = function(deckId, index, position = null) {
    const deck = this.decks[deckId];
    
    if (!deck.buffer) {
        console.warn(`No track loaded in deck ${deckId}`);
        return false;
    }
    
    // Initialize hot cues array if it doesn't exist
    if (!deck.hotCues) {
        deck.hotCues = [];
    }
    
    // If no position provided, use current playback position
    if (position === null) {
        position = this.getCurrentTime(deckId);
    }
    
    // Ensure position is within valid range
    position = Math.max(0, Math.min(deck.buffer.duration, position));
    
    // Store hot cue
    deck.hotCues[index] = position;
    
    return position;
};

/**
 * Jump to hot cue point
 */
AudioEngine.prototype.jumpToHotCue = function(deckId, index) {
    const deck = this.decks[deckId];
    
    if (!deck.buffer || !deck.hotCues || !deck.hotCues[index]) {
        console.warn(`No hot cue at index ${index} for deck ${deckId}`);
        return false;
    }
    
    // Jump to hot cue position
    return this.jumpToTime(deckId, deck.hotCues[index]);
};

/**
 * Clear hot cue point
 */
AudioEngine.prototype.clearHotCue = function(deckId, index) {
    const deck = this.decks[deckId];
    
    if (!deck.hotCues) {
        return false;
    }
    
    deck.hotCues[index] = null;
    return true;
};

/**
 * Get hot cue points for a deck
 */
AudioEngine.prototype.getHotCues = function(deckId) {
    const deck = this.decks[deckId];
    return deck.hotCues || [];
};
