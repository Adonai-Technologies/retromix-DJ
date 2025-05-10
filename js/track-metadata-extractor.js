/**
 * RetroMix DJ - Track Metadata Extractor
 * Extracts metadata from audio files
 */

class TrackMetadataExtractor {
    constructor() {
        // Supported file types
        this.supportedTypes = [
            'audio/mpeg', // MP3
            'audio/wav', // WAV
            'audio/ogg', // OGG
            'audio/flac', // FLAC
            'audio/aac', // AAC
            'audio/mp4', // M4A
            'audio/webm', // WEBM audio
            'audio/x-m4a' // M4A alternative MIME
        ];
    }
    
    /**
     * Extract metadata from an audio file
     */
    async extractMetadata(file, audioBuffer) {
        try {
            // Basic metadata from file object
            const metadata = {
                title: this.getFilenameWithoutExtension(file.name),
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                genre: 'Unknown Genre',
                year: null,
                bpm: null,
                key: null,
                duration: audioBuffer ? audioBuffer.duration : 0
            };
            
            // Try to extract ID3 tags for MP3 files
            if (file.type === 'audio/mpeg') {
                const id3Tags = await this.extractID3Tags(file);
                if (id3Tags) {
                    Object.assign(metadata, id3Tags);
                }
            }
            
            // Try to extract BPM and key using audio analysis
            if (audioBuffer) {
                const analysisResults = await this.analyzeAudio(audioBuffer);
                if (analysisResults) {
                    // Only use analyzed values if they're not already set from tags
                    if (!metadata.bpm && analysisResults.bpm) {
                        metadata.bpm = analysisResults.bpm;
                    }
                    if (!metadata.key && analysisResults.key) {
                        metadata.key = analysisResults.key;
                    }
                }
            }
            
            return metadata;
        } catch (error) {
            console.error('Error extracting metadata:', error);
            return {
                title: this.getFilenameWithoutExtension(file.name),
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                genre: 'Unknown Genre',
                year: null,
                bpm: null,
                key: null,
                duration: audioBuffer ? audioBuffer.duration : 0
            };
        }
    }
    
    /**
     * Get filename without extension
     */
    getFilenameWithoutExtension(filename) {
        return filename.replace(/\.[^/.]+$/, '');
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
                        
                        // Extract version
                        const version = dv.getUint8(3);
                        const revision = dv.getUint8(4);
                        
                        // Extract size (excluding header)
                        const size = (
                            (dv.getUint8(6) & 0x7F) << 21 |
                            (dv.getUint8(7) & 0x7F) << 14 |
                            (dv.getUint8(8) & 0x7F) << 7 |
                            (dv.getUint8(9) & 0x7F)
                        );
                        
                        // In a real implementation, we would parse the frames here
                        // For now, just return some placeholder data
                        resolve({
                            title: 'Extracted Title',
                            artist: 'Extracted Artist',
                            album: 'Extracted Album',
                            genre: 'Electronic',
                            year: '2023',
                            bpm: 128,
                            key: 'C'
                        });
                    } else {
                        // No ID3 tag found
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error parsing ID3 tags:', error);
                    resolve(null);
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
     * Analyze audio for BPM and key
     */
    async analyzeAudio(audioBuffer) {
        try {
            // In a real implementation, we would use a proper audio analysis library
            // For now, just return some placeholder data based on the audio duration
            
            // Generate a pseudo-random BPM based on buffer duration
            const seed = audioBuffer.duration * 1000;
            const randomBpm = 70 + (seed % 100);
            
            // Generate a pseudo-random key
            const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const randomKey = keys[Math.floor(seed % 12)];
            
            return {
                bpm: Math.round(randomBpm),
                key: randomKey
            };
        } catch (error) {
            console.error('Error analyzing audio:', error);
            return null;
        }
    }
    
    /**
     * Check if a file type is supported
     */
    isSupported(fileType) {
        return this.supportedTypes.includes(fileType);
    }
}

// Export the class
window.TrackMetadataExtractor = TrackMetadataExtractor;
