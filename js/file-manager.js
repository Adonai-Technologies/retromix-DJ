/**
 * RetroMix DJ - File Manager
 * Handles file operations, library management, and cloud storage integration
 */

class FileManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.supportedFormats = [
            'audio/mpeg', // MP3
            'audio/wav', // WAV
            'audio/ogg', // OGG
            'audio/flac', // FLAC
            'audio/aac', // AAC
            'audio/mp4', // M4A
            'audio/webm', // WEBM audio
            'audio/x-m4a' // M4A alternative MIME
        ];
        
        // Local storage for track metadata
        this.trackMetadata = {};
        
        // Initialize local storage
        this.initLocalStorage();
    }
    
    /**
     * Initialize local storage for track metadata
     */
    initLocalStorage() {
        // Load saved metadata from localStorage if available
        try {
            const savedMetadata = localStorage.getItem('retromix_track_metadata');
            if (savedMetadata) {
                this.trackMetadata = JSON.parse(savedMetadata);
            }
        } catch (error) {
            console.error('Error loading track metadata from localStorage:', error);
            // Reset if corrupted
            this.trackMetadata = {};
        }
    }
    
    /**
     * Save metadata to local storage
     */
    saveMetadataToLocalStorage() {
        try {
            localStorage.setItem('retromix_track_metadata', JSON.stringify(this.trackMetadata));
        } catch (error) {
            console.error('Error saving track metadata to localStorage:', error);
        }
    }
    
    /**
     * Check if a file is a supported audio format
     */
    isAudioFile(file) {
        return this.supportedFormats.includes(file.type);
    }
    
    /**
     * Load a file into a deck
     */
    async loadFile(file, deckId) {
        if (!this.isAudioFile(file)) {
            throw new Error(`Unsupported file format: ${file.type}`);
        }
        
        try {
            // Generate a unique ID for the file
            const fileId = await this.generateFileId(file);
            
            // Load track into audio engine
            const trackInfo = await this.audioEngine.loadTrack(deckId, file);
            
            // Extract metadata
            const metadata = await this.extractMetadata(file);
            
            // Store metadata
            this.trackMetadata[fileId] = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                duration: trackInfo.duration,
                sampleRate: trackInfo.sampleRate,
                channels: trackInfo.numberOfChannels,
                metadata: metadata,
                dateAdded: new Date().toISOString()
            };
            
            // Save to local storage
            this.saveMetadataToLocalStorage();
            
            return {
                id: fileId,
                ...trackInfo,
                metadata: metadata
            };
        } catch (error) {
            console.error('Error loading file:', error);
            throw error;
        }
    }
    
    /**
     * Generate a unique ID for a file
     */
    async generateFileId(file) {
        // Use a combination of file properties to create a unique ID
        const fileInfo = `${file.name}-${file.size}-${file.lastModified}`;
        
        // Use SubtleCrypto to create a hash if available
        if (window.crypto && window.crypto.subtle) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(fileInfo);
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return hashHex;
            } catch (error) {
                console.warn('Crypto API failed, using fallback ID generation:', error);
            }
        }
        
        // Fallback to simple hash function
        let hash = 0;
        for (let i = 0; i < fileInfo.length; i++) {
            const char = fileInfo.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'file_' + Math.abs(hash).toString(16);
    }
    
    /**
     * Extract metadata from an audio file
     */
    async extractMetadata(file) {
        // Basic metadata from file object
        const metadata = {
            title: this.getFilenameWithoutExtension(file.name),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            genre: 'Unknown Genre',
            year: null,
            bpm: null
        };
        
        // For MP3 files, try to extract ID3 tags
        if (file.type === 'audio/mpeg') {
            try {
                const tags = await this.extractID3Tags(file);
                if (tags) {
                    if (tags.title) metadata.title = tags.title;
                    if (tags.artist) metadata.artist = tags.artist;
                    if (tags.album) metadata.album = tags.album;
                    if (tags.genre) metadata.genre = tags.genre;
                    if (tags.year) metadata.year = tags.year;
                    if (tags.bpm) metadata.bpm = tags.bpm;
                }
            } catch (error) {
                console.warn('Error extracting ID3 tags:', error);
            }
        }
        
        return metadata;
    }
    
    /**
     * Extract ID3 tags from an MP3 file
     * This is a simplified implementation - in a real app, we would use a proper ID3 library
     */
    async extractID3Tags(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const buffer = e.target.result;
                    const dv = new DataView(buffer);
                    
                    // Check for ID3 header
                    if (dv.getUint8(0) === 73 && dv.getUint8(1) === 68 && dv.getUint8(2) === 51) { // "ID3"
                        // Very basic ID3v2 tag parsing - this is just a placeholder
                        // In a real app, we would use a proper ID3 library
                        resolve({
                            title: 'Extracted Title',
                            artist: 'Extracted Artist',
                            album: 'Extracted Album'
                        });
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Error reading file'));
            };
            
            // Read the first 128KB of the file (ID3 tags are at the beginning)
            const blob = file.slice(0, 131072);
            reader.readAsArrayBuffer(blob);
        });
    }
    
    /**
     * Get filename without extension
     */
    getFilenameWithoutExtension(filename) {
        return filename.replace(/\.[^/.]+$/, '');
    }
    
    /**
     * Save a mix recording
     */
    saveMixRecording(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `RetroMix_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
    
    /**
     * Export track library
     */
    exportTrackLibrary() {
        const data = JSON.stringify(this.trackMetadata);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `RetroMix_Library_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
    
    /**
     * Import track library
     */
    async importTrackLibrary(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.trackMetadata = { ...this.trackMetadata, ...data };
                    this.saveMetadataToLocalStorage();
                    resolve(Object.keys(data).length);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Get all tracks in the library
     */
    getAllTracks() {
        return Object.values(this.trackMetadata);
    }
    
    /**
     * Search tracks by query
     */
    searchTracks(query) {
        if (!query) return this.getAllTracks();
        
        query = query.toLowerCase();
        return Object.values(this.trackMetadata).filter(track => {
            return (
                track.name.toLowerCase().includes(query) ||
                track.metadata.title.toLowerCase().includes(query) ||
                track.metadata.artist.toLowerCase().includes(query) ||
                track.metadata.album.toLowerCase().includes(query) ||
                track.metadata.genre.toLowerCase().includes(query)
            );
        });
    }
    
    /**
     * Delete a track from the library
     */
    deleteTrack(trackId) {
        if (this.trackMetadata[trackId]) {
            delete this.trackMetadata[trackId];
            this.saveMetadataToLocalStorage();
            return true;
        }
        return false;
    }
}

// Export the class
window.FileManager = FileManager;
