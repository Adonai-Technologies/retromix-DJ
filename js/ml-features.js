/**
 * RetroMix DJ - Machine Learning Features
 * Provides AI-powered features for automatic DJ, recommendations, and audio processing
 */

class MLFeatures {
    constructor(audioEngine, libraryManager) {
        this.audioEngine = audioEngine;
        this.libraryManager = libraryManager;
        this.isAutoDJActive = false;
        this.autoDJQueue = [];
        this.currentStyle = "electronic";
        this.vocalIsolationEnabled = {
            left: false,
            right: false
        };
        
        // Initialize ML models (in a real implementation, these would be actual ML models)
        this.initializeModels();
    }
    
    /**
     * Initialize ML models
     */
    initializeModels() {
        console.log("Initializing ML models...");
        // In a real implementation, we would load pre-trained models here
        // For this demo, we'll simulate the models
        
        // Dispatch event when models are loaded
        setTimeout(() => {
            const event = new CustomEvent('mlmodelsloaded', {
                detail: {
                    success: true
                }
            });
            document.dispatchEvent(event);
        }, 1500);
    }
    
    /**
     * Start Auto DJ mode
     */
    startAutoDJ() {
        if (this.isAutoDJActive) return false;
        
        this.isAutoDJActive = true;
        this.autoDJQueue = this.generateAutoDJQueue();
        
        // Start playing the first track if queue is not empty
        if (this.autoDJQueue.length > 0) {
            this.playNextTrack();
        }
        
        // Dispatch event
        const event = new CustomEvent('autodjstarted', {
            detail: {
                queueLength: this.autoDJQueue.length
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Stop Auto DJ mode
     */
    stopAutoDJ() {
        if (!this.isAutoDJActive) return false;
        
        this.isAutoDJActive = false;
        this.autoDJQueue = [];
        
        // Dispatch event
        const event = new CustomEvent('autodjstopped', {});
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Generate Auto DJ queue based on current library and preferences
     */
    generateAutoDJQueue() {
        const allTracks = this.libraryManager.tracks;
        if (!allTracks || allTracks.length === 0) {
            console.warn('No tracks in library for Auto DJ');
            return [];
        }
        
        const queue = [];
        
        // Sort tracks by compatibility with current style
        const sortedTracks = this.sortTracksByStyle(allTracks, this.currentStyle);
        
        // Take top 10 tracks
        for (let i = 0; i < Math.min(10, sortedTracks.length); i++) {
            queue.push(sortedTracks[i].id);
        }
        
        return queue;
    }
    
    /**
     * Play next track in Auto DJ queue
     */
    playNextTrack() {
        if (!this.isAutoDJActive || this.autoDJQueue.length === 0) return false;
        
        const nextTrackId = this.autoDJQueue.shift();
        const track = this.libraryManager.getTrack(nextTrackId);
        
        if (!track) return false;
        
        // Determine which deck to use (alternate between left and right)
        const currentlyPlayingDeck = this.audioEngine.decks.left.isPlaying ? 'left' : 'right';
        const targetDeck = currentlyPlayingDeck === 'left' ? 'right' : 'left';
        
        // Load track to deck
        // In a real implementation, we would actually load the audio file
        console.log(`Auto DJ loading ${track.title} to ${targetDeck} deck`);
        
        // Dispatch event to load track
        const event = new CustomEvent('loadtrackfromlibrary', {
            detail: {
                trackId: nextTrackId,
                deckId: targetDeck
            }
        });
        document.dispatchEvent(event);
        
        // Set up transition to next track
        setTimeout(() => {
            // Start playing the loaded track
            this.audioEngine.playDeck(targetDeck);
            
            // Crossfade from current deck to target deck
            this.autoCrossfade(currentlyPlayingDeck, targetDeck);
            
            // Queue up the next track
            if (this.autoDJQueue.length > 0) {
                // Wait until near the end of this track to queue the next one
                const trackDuration = track.duration || 180; // Default to 3 minutes if duration unknown
                setTimeout(() => {
                    this.playNextTrack();
                }, (trackDuration - 30) * 1000); // Queue 30 seconds before end
            }
        }, 2000); // Wait 2 seconds before starting playback
        
        return true;
    }
    
    /**
     * Automatically crossfade between decks
     */
    autoCrossfade(fromDeck, toDeck) {
        // Start with crossfader at the source deck
        const startPosition = fromDeck === 'left' ? 0 : 100;
        const endPosition = fromDeck === 'left' ? 100 : 0;
        
        // Set initial position
        this.audioEngine.setCrossfader(startPosition / 100);
        
        // Animate crossfader over 4 seconds
        const duration = 4000; // 4 seconds
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Calculate current position
            const currentPosition = startPosition + (endPosition - startPosition) * progress;
            
            // Update crossfader
            this.audioEngine.setCrossfader(currentPosition / 100);
            
            // Update UI
            document.getElementById('crossfader').value = currentPosition;
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Stop the source deck when crossfade is complete
                this.audioEngine.stopDeck(fromDeck);
            }
        };
        
        // Start animation
        requestAnimationFrame(animate);
    }
    
    /**
     * Get track recommendations based on a reference track
     */
    getTrackRecommendations(referenceTrackId, count = 5) {
        const referenceTrack = this.libraryManager.getTrack(referenceTrackId);
        if (!referenceTrack) return [];
        
        // Get all tracks except the reference track
        const allTracks = this.libraryManager.tracks.filter(t => t.id !== referenceTrackId);
        if (allTracks.length === 0) return [];
        
        // Calculate similarity scores
        const scoredTracks = allTracks.map(track => {
            const score = this.calculateTrackSimilarity(referenceTrack, track);
            return { track, score };
        });
        
        // Sort by score (descending)
        scoredTracks.sort((a, b) => b.score - a.score);
        
        // Return top tracks
        return scoredTracks.slice(0, count).map(item => item.track);
    }
    
    /**
     * Calculate similarity between two tracks
     */
    calculateTrackSimilarity(track1, track2) {
        let score = 0;
        
        // BPM similarity (max 30 points)
        if (track1.bpm > 0 && track2.bpm > 0) {
            const bpmDiff = Math.abs(track1.bpm - track2.bpm);
            if (bpmDiff < 5) score += 30;
            else if (bpmDiff < 10) score += 20;
            else if (bpmDiff < 20) score += 10;
        }
        
        // Key similarity (max 25 points)
        if (track1.key && track2.key) {
            if (track1.key === track2.key) score += 25;
            else if (this.areKeysCompatible(track1.key, track2.key)) score += 15;
        }
        
        // Genre similarity (max 20 points)
        if (track1.genre === track2.genre) score += 20;
        
        // Style similarity (max 15 points)
        const style1 = this.detectTrackStyle(track1);
        const style2 = this.detectTrackStyle(track2);
        if (style1 === style2) score += 15;
        
        // Energy level similarity (max 10 points)
        const energy1 = this.estimateTrackEnergy(track1);
        const energy2 = this.estimateTrackEnergy(track2);
        const energyDiff = Math.abs(energy1 - energy2);
        if (energyDiff < 0.2) score += 10;
        else if (energyDiff < 0.4) score += 5;
        
        return score;
    }
    
    /**
     * Check if two musical keys are compatible
     */
    areKeysCompatible(key1, key2) {
        // Simplified key compatibility check
        const compatibleKeys = {
            'C': ['G', 'F', 'Am'],
            'G': ['C', 'D', 'Em'],
            'D': ['G', 'A', 'Bm'],
            'A': ['D', 'E', 'F#m'],
            'E': ['A', 'B', 'C#m'],
            'B': ['E', 'F#', 'G#m'],
            'F#': ['B', 'C#', 'D#m'],
            'C#': ['F#', 'G#', 'A#m'],
            'F': ['C', 'Bb', 'Dm'],
            'Bb': ['F', 'Eb', 'Gm'],
            'Eb': ['Bb', 'Ab', 'Cm'],
            'Ab': ['Eb', 'Db', 'Fm'],
            'Am': ['C', 'Em', 'Dm'],
            'Em': ['G', 'Bm', 'Am'],
            'Bm': ['D', 'F#m', 'Em'],
            'F#m': ['A', 'C#m', 'Bm'],
            'C#m': ['E', 'G#m', 'F#m'],
            'G#m': ['B', 'D#m', 'C#m'],
            'Dm': ['F', 'Am', 'Cm'],
            'Gm': ['Bb', 'Dm', 'Fm'],
            'Cm': ['Eb', 'Gm', 'Bbm']
        };
        
        if (key1 === key2) return true;
        if (compatibleKeys[key1] && compatibleKeys[key1].includes(key2)) return true;
        if (compatibleKeys[key2] && compatibleKeys[key2].includes(key1)) return true;
        
        return false;
    }
    
    /**
     * Detect the style of a track
     */
    detectTrackStyle(track) {
        // In a real implementation, this would use ML to analyze audio features
        // For this demo, we'll use genre as a proxy for style
        
        const genre = (track.genre || '').toLowerCase();
        
        if (genre.includes('house') || genre.includes('techno') || genre.includes('trance') || genre.includes('edm')) {
            return 'electronic';
        } else if (genre.includes('hip') || genre.includes('rap')) {
            return 'hiphop';
        } else if (genre.includes('rock')) {
            return 'rock';
        } else if (genre.includes('pop')) {
            return 'pop';
        } else {
            return 'other';
        }
    }
    
    /**
     * Estimate the energy level of a track (0-1)
     */
    estimateTrackEnergy(track) {
        // In a real implementation, this would use ML to analyze audio features
        // For this demo, we'll use BPM as a proxy for energy
        
        if (!track.bpm) return 0.5; // Default to medium energy
        
        // Map BPM to energy level
        if (track.bpm < 80) return 0.2;
        if (track.bpm < 100) return 0.4;
        if (track.bpm < 120) return 0.6;
        if (track.bpm < 140) return 0.8;
        return 1.0;
    }
    
    /**
     * Sort tracks by compatibility with a given style
     */
    sortTracksByStyle(tracks, style) {
        return tracks.map(track => {
            const trackStyle = this.detectTrackStyle(track);
            const styleScore = trackStyle === style ? 100 : 0;
            return { id: track.id, score: styleScore };
        }).sort((a, b) => b.score - a.score);
    }
    
    /**
     * Toggle vocal isolation for a deck
     */
    toggleVocalIsolation(deckId) {
        this.vocalIsolationEnabled[deckId] = !this.vocalIsolationEnabled[deckId];
        
        // In a real implementation, we would apply a vocal isolation filter
        // For this demo, we'll just log the action
        console.log(`Vocal isolation ${this.vocalIsolationEnabled[deckId] ? 'enabled' : 'disabled'} for ${deckId} deck`);
        
        // Dispatch event
        const event = new CustomEvent('vocalisolationchanged', {
            detail: {
                deckId: deckId,
                enabled: this.vocalIsolationEnabled[deckId]
            }
        });
        document.dispatchEvent(event);
        
        return this.vocalIsolationEnabled[deckId];
    }
    
    /**
     * Set current style for Auto DJ and recommendations
     */
    setCurrentStyle(style) {
        this.currentStyle = style;
        
        // If Auto DJ is active, regenerate the queue
        if (this.isAutoDJActive) {
            this.autoDJQueue = this.generateAutoDJQueue();
        }
        
        // Dispatch event
        const event = new CustomEvent('stylechanged', {
            detail: {
                style: this.currentStyle
            }
        });
        document.dispatchEvent(event);
        
        return this.currentStyle;
    }
    
    /**
     * Get available styles
     */
    getAvailableStyles() {
        return [
            { id: 'electronic', name: 'Electronic' },
            { id: 'hiphop', name: 'Hip Hop' },
            { id: 'rock', name: 'Rock' },
            { id: 'pop', name: 'Pop' },
            { id: 'other', name: 'Other' }
        ];
    }
}

// Export the class
window.MLFeatures = MLFeatures;
