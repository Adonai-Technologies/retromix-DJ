/**
 * RetroMix DJ - Track Library Manager
 * Handles track metadata storage, retrieval, and management
 */

class TrackLibraryManager {
    constructor() {
        // Track library storage
        this.tracks = [];
        this.playlists = {};
        this.history = [];
        
        // Track metadata cache
        this.metadataCache = {};
        
        // Load library from local storage
        this.loadLibrary();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for track loaded events
        document.addEventListener('trackloaded', (e) => {
            const { deckId, file, metadata, duration } = e.detail;
            this.addTrackToLibrary(file, metadata, duration);
        });
        
        // Listen for track played events
        document.addEventListener('trackplayed', (e) => {
            const { deckId, trackId } = e.detail;
            this.addTrackToHistory(trackId, deckId);
        });
    }
    
    /**
     * Load library from local storage
     */
    loadLibrary() {
        try {
            // Load tracks
            const tracksJson = localStorage.getItem('retromix_tracks');
            if (tracksJson) {
                this.tracks = JSON.parse(tracksJson);
            }
            
            // Load playlists
            const playlistsJson = localStorage.getItem('retromix_playlists');
            if (playlistsJson) {
                this.playlists = JSON.parse(playlistsJson);
            } else {
                // Create default playlists
                this.playlists = {
                    favorites: {
                        id: 'favorites',
                        name: 'Favorites',
                        tracks: []
                    },
                    recent: {
                        id: 'recent',
                        name: 'Recently Played',
                        tracks: []
                    }
                };
            }
            
            // Load history
            const historyJson = localStorage.getItem('retromix_history');
            if (historyJson) {
                this.history = JSON.parse(historyJson);
            }
            
            console.log(`Loaded library: ${this.tracks.length} tracks, ${Object.keys(this.playlists).length} playlists`);
        } catch (error) {
            console.error('Error loading library from local storage:', error);
            // Initialize with empty data
            this.tracks = [];
            this.playlists = {
                favorites: {
                    id: 'favorites',
                    name: 'Favorites',
                    tracks: []
                },
                recent: {
                    id: 'recent',
                    name: 'Recently Played',
                    tracks: []
                }
            };
            this.history = [];
        }
    }
    
    /**
     * Save library to local storage
     */
    saveLibrary() {
        try {
            // Save tracks
            localStorage.setItem('retromix_tracks', JSON.stringify(this.tracks));
            
            // Save playlists
            localStorage.setItem('retromix_playlists', JSON.stringify(this.playlists));
            
            // Save history
            localStorage.setItem('retromix_history', JSON.stringify(this.history));
            
            console.log('Library saved to local storage');
        } catch (error) {
            console.error('Error saving library to local storage:', error);
        }
    }
    
    /**
     * Add track to library
     */
    addTrackToLibrary(file, metadata, duration) {
        // Generate track ID
        const trackId = this.generateTrackId(file, metadata);
        
        // Check if track already exists
        const existingTrack = this.tracks.find(track => track.id === trackId);
        if (existingTrack) {
            // Update last played time
            existingTrack.lastPlayed = new Date().toISOString();
            this.saveLibrary();
            return existingTrack;
        }
        
        // Create new track object
        const track = {
            id: trackId,
            title: metadata.title || file.name.split('.')[0],
            artist: metadata.artist || 'Unknown Artist',
            album: metadata.album || 'Unknown Album',
            genre: metadata.genre || 'Unknown Genre',
            bpm: metadata.bpm || 0,
            key: metadata.key || '',
            duration: duration || 0,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            dateAdded: new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
            playCount: 0,
            favorite: false
        };
        
        // Add to tracks array
        this.tracks.push(track);
        
        // Add to recent playlist
        this.addTrackToPlaylist('recent', trackId);
        
        // Save library
        this.saveLibrary();
        
        // Dispatch event for UI update
        const event = new CustomEvent('tracklibraryadded', {
            detail: {
                track: track
            }
        });
        document.dispatchEvent(event);
        
        return track;
    }
    
    /**
     * Generate a unique track ID
     */
    generateTrackId(file, metadata) {
        // Create a unique ID based on file properties and metadata
        const idString = `${file.name}-${file.size}-${metadata.title}-${metadata.artist}`;
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < idString.length; i++) {
            const char = idString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return `track_${Math.abs(hash).toString(16)}`;
    }
    
    /**
     * Get track by ID
     */
    getTrack(trackId) {
        return this.tracks.find(track => track.id === trackId);
    }
    
    /**
     * Update track metadata
     */
    updateTrackMetadata(trackId, metadata) {
        const track = this.getTrack(trackId);
        if (!track) {
            return false;
        }
        
        // Update metadata
        Object.assign(track, metadata);
        
        // Save library
        this.saveLibrary();
        
        // Dispatch event for UI update
        const event = new CustomEvent('tracklibraryupdated', {
            detail: {
                track: track
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Delete track from library
     */
    deleteTrack(trackId) {
        const trackIndex = this.tracks.findIndex(track => track.id === trackId);
        if (trackIndex === -1) {
            return false;
        }
        
        // Remove from tracks array
        this.tracks.splice(trackIndex, 1);
        
        // Remove from all playlists
        for (const playlistId in this.playlists) {
            const playlist = this.playlists[playlistId];
            const trackIndex = playlist.tracks.indexOf(trackId);
            if (trackIndex !== -1) {
                playlist.tracks.splice(trackIndex, 1);
            }
        }
        
        // Save library
        this.saveLibrary();
        
        // Dispatch event for UI update
        const event = new CustomEvent('tracklibrarydeleted', {
            detail: {
                trackId: trackId
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Toggle track favorite status
     */
    toggleFavorite(trackId) {
        const track = this.getTrack(trackId);
        if (!track) {
            return false;
        }
        
        // Toggle favorite status
        track.favorite = !track.favorite;
        
        // Add or remove from favorites playlist
        if (track.favorite) {
            this.addTrackToPlaylist('favorites', trackId);
        } else {
            this.removeTrackFromPlaylist('favorites', trackId);
        }
        
        // Save library
        this.saveLibrary();
        
        // Dispatch event for UI update
        const event = new CustomEvent('trackfavoritetoggled', {
            detail: {
                trackId: trackId,
                favorite: track.favorite
            }
        });
        document.dispatchEvent(event);
        
        return track.favorite;
    }
    
    /**
     * Create a new playlist
     */
    createPlaylist(name) {
        // Generate playlist ID
        const playlistId = `playlist_${Date.now()}`;
        
        // Create playlist object
        const playlist = {
            id: playlistId,
            name: name,
            tracks: []
        };
        
        // Add to playlists
        this.playlists[playlistId] = playlist;
        
        // Save library
        this.saveLibrary();
        
        // Dispatch event for UI update
        const event = new CustomEvent('playlistcreated', {
            detail: {
                playlist: playlist
            }
        });
        document.dispatchEvent(event);
        
        return playlist;
    }
    
    /**
     * Update playlist
     */
    updatePlaylist(playlistId, name) {
        const playlist = this.playlists[playlistId];
        if (!playlist) {
            return false;
        }
        
        // Update name
        playlist.name = name;
        
        // Save library
        this.saveLibrary();
        
        // Dispatch event for UI update
        const event = new CustomEvent('playlistupdated', {
            detail: {
                playlist: playlist
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Delete playlist
     */
    deletePlaylist(playlistId) {
        // Don't allow deleting default playlists
        if (playlistId === 'favorites' || playlistId === 'recent') {
            return false;
        }
        
        if (!this.playlists[playlistId]) {
            return false;
        }
        
        // Remove playlist
        delete this.playlists[playlistId];
        
        // Save library
        this.saveLibrary();
        
        // Dispatch event for UI update
        const event = new CustomEvent('playlistdeleted', {
            detail: {
                playlistId: playlistId
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Add track to playlist
     */
    addTrackToPlaylist(playlistId, trackId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) {
            return false;
        }
        
        // Check if track already in playlist
        if (playlist.tracks.includes(trackId)) {
            return true;
        }
        
        // Add track to playlist
        playlist.tracks.push(trackId);
        
        // For 'recent' playlist, limit to 50 tracks
        if (playlistId === 'recent' && playlist.tracks.length > 50) {
            playlist.tracks.shift();
        }
        
        // Save library
        this.saveLibrary();
        
        // Dispatch event for UI update
        const event = new CustomEvent('playlisttrackadded', {
            detail: {
                playlistId: playlistId,
                trackId: trackId
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Remove track from playlist
     */
    removeTrackFromPlaylist(playlistId, trackId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) {
            return false;
        }
        
        // Find track in playlist
        const trackIndex = playlist.tracks.indexOf(trackId);
        if (trackIndex === -1) {
            return false;
        }
        
        // Remove track from playlist
        playlist.tracks.splice(trackIndex, 1);
        
        // Save library
        this.saveLibrary();
        
        // Dispatch event for UI update
        const event = new CustomEvent('playlisttrackremoved', {
            detail: {
                playlistId: playlistId,
                trackId: trackId
            }
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Get all playlists
     */
    getPlaylists() {
        return Object.values(this.playlists);
    }
    
    /**
     * Get tracks in a playlist
     */
    getPlaylistTracks(playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) {
            return [];
        }
        
        // Get track objects for all track IDs in playlist
        return playlist.tracks
            .map(trackId => this.getTrack(trackId))
            .filter(track => track !== undefined);
    }
    
    /**
     * Add track to history
     */
    addTrackToHistory(trackId, deckId) {
        const track = this.getTrack(trackId);
        if (!track) {
            return false;
        }
        
        // Increment play count
        track.playCount++;
        track.lastPlayed = new Date().toISOString();
        
        // Add to history
        this.history.unshift({
            trackId: trackId,
            deckId: deckId,
            timestamp: new Date().toISOString()
        });
        
        // Limit history to 100 entries
        if (this.history.length > 100) {
            this.history.pop();
        }
        
        // Add to recent playlist
        this.addTrackToPlaylist('recent', trackId);
        
        // Save library
        this.saveLibrary();
        
        return true;
    }
    
    /**
     * Get play history
     */
    getHistory(limit = 50) {
        // Get track objects for all track IDs in history
        return this.history
            .slice(0, limit)
            .map(historyItem => {
                const track = this.getTrack(historyItem.trackId);
                return {
                    track: track,
                    deckId: historyItem.deckId,
                    timestamp: historyItem.timestamp
                };
            })
            .filter(item => item.track !== undefined);
    }
    
    /**
     * Search tracks
     */
    searchTracks(query) {
        if (!query) {
            return this.tracks;
        }
        
        query = query.toLowerCase();
        
        return this.tracks.filter(track => {
            return (
                track.title.toLowerCase().includes(query) ||
                track.artist.toLowerCase().includes(query) ||
                track.album.toLowerCase().includes(query) ||
                track.genre.toLowerCase().includes(query)
            );
        });
    }
    
    /**
     * Get track suggestions based on a reference track
     */
    getTrackSuggestions(referenceTrackId, limit = 10) {
        const referenceTrack = this.getTrack(referenceTrackId);
        if (!referenceTrack) {
            return [];
        }
        
        // Get all tracks except the reference track
        const candidates = this.tracks.filter(track => track.id !== referenceTrackId);
        
        // Score each track based on similarity to reference track
        const scoredTracks = candidates.map(track => {
            let score = 0;
            
            // BPM similarity (max 50 points)
            if (referenceTrack.bpm > 0 && track.bpm > 0) {
                const bpmDiff = Math.abs(referenceTrack.bpm - track.bpm);
                if (bpmDiff < 5) {
                    score += 50;
                } else if (bpmDiff < 10) {
                    score += 30;
                } else if (bpmDiff < 20) {
                    score += 10;
                }
            }
            
            // Key similarity (max 50 points)
            if (referenceTrack.key && track.key) {
                if (referenceTrack.key === track.key) {
                    score += 50;
                } else if (this.areKeysCompatible(referenceTrack.key, track.key)) {
                    score += 30;
                }
            }
            
            // Genre similarity (max 20 points)
            if (referenceTrack.genre === track.genre) {
                score += 20;
            }
            
            // Artist similarity (max 10 points)
            if (referenceTrack.artist === track.artist) {
                score += 10;
            }
            
            return { track, score };
        });
        
        // Sort by score (descending)
        scoredTracks.sort((a, b) => b.score - a.score);
        
        // Return top tracks
        return scoredTracks.slice(0, limit).map(item => item.track);
    }
    
    /**
     * Check if two musical keys are compatible for mixing
     */
    areKeysCompatible(key1, key2) {
        // This is a simplified version of key compatibility
        // In a real app, we would use the Circle of Fifths and Camelot Wheel
        
        // Same key is compatible
        if (key1 === key2) {
            return true;
        }
        
        // Define some basic key relationships
        const keyRelationships = {
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
            'Db': ['Ab', 'Gb', 'Bbm'],
            'Gb': ['Db', 'Cb', 'Ebm'],
            'Am': ['C', 'Em', 'Dm'],
            'Em': ['G', 'Bm', 'Am'],
            'Bm': ['D', 'F#m', 'Em'],
            'F#m': ['A', 'C#m', 'Bm'],
            'C#m': ['E', 'G#m', 'F#m'],
            'G#m': ['B', 'D#m', 'C#m'],
            'D#m': ['F#', 'A#m', 'G#m'],
            'A#m': ['C#', 'Fm', 'D#m'],
            'Dm': ['F', 'Am', 'Gm'],
            'Gm': ['Bb', 'Dm', 'Cm'],
            'Cm': ['Eb', 'Gm', 'Fm'],
            'Fm': ['Ab', 'Cm', 'Bbm'],
            'Bbm': ['Db', 'Fm', 'Ebm'],
            'Ebm': ['Gb', 'Bbm', 'Abm']
        };
        
        // Check if keys are related
        if (keyRelationships[key1] && keyRelationships[key1].includes(key2)) {
            return true;
        }
        
        if (keyRelationships[key2] && keyRelationships[key2].includes(key1)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Export library as JSON
     */
    exportLibrary() {
        const libraryData = {
            tracks: this.tracks,
            playlists: this.playlists,
            history: this.history
        };
        
        const json = JSON.stringify(libraryData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `retromix_library_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Import library from JSON
     */
    importLibrary(jsonData) {
        try {
            const libraryData = JSON.parse(jsonData);
            
            // Validate data structure
            if (!libraryData.tracks || !Array.isArray(libraryData.tracks)) {
                throw new Error('Invalid library data: tracks missing or invalid');
            }
            
            if (!libraryData.playlists || typeof libraryData.playlists !== 'object') {
                throw new Error('Invalid library data: playlists missing or invalid');
            }
            
            // Import data
            this.tracks = libraryData.tracks;
            this.playlists = libraryData.playlists;
            
            if (libraryData.history && Array.isArray(libraryData.history)) {
                this.history = libraryData.history;
            }
            
            // Save to local storage
            this.saveLibrary();
            
            // Dispatch event for UI update
            const event = new CustomEvent('libraryimported', {
                detail: {
                    trackCount: this.tracks.length,
                    playlistCount: Object.keys(this.playlists).length
                }
            });
            document.dispatchEvent(event);
            
            return true;
        } catch (error) {
            console.error('Error importing library:', error);
            return false;
        }
    }
}

// Export the class
window.TrackLibraryManager = TrackLibraryManager;
