/**
 * RetroMix DJ - Drag and Drop & Enhanced Storage
 * Adds drag and drop support for the library and enhances storage capabilities
 */

// Add drag and drop support for the track browser
function setupTrackBrowserDragAndDrop() {
    const trackBrowser = document.querySelector('.track-browser');
    if (!trackBrowser) return;
    
    console.log('Setting up drag and drop for track browser');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        trackBrowser.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        trackBrowser.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        trackBrowser.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        trackBrowser.classList.add('drag-highlight');
    }
    
    function unhighlight() {
        trackBrowser.classList.remove('drag-highlight');
    }
    
    // Handle dropped files
    trackBrowser.addEventListener('drop', handleDrop, false);
    
    async function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        console.log(`Dropped ${files.length} files`);
        
        // Process each dropped file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('audio/')) {
                try {
                    console.log(`Processing audio file: ${file.name}`);
                    
                    // Extract metadata
                    const audioBuffer = await loadAudioBuffer(file);
                    const metadata = await window.app.metadataExtractor.extractMetadata(file, audioBuffer);
                    
                    // Add to library
                    const track = window.app.libraryManager.addTrackToLibrary(file, metadata, audioBuffer.duration);
                    
                    console.log(`Added track to library: ${track.title}`);
                } catch (error) {
                    console.error('Error processing dropped file:', error);
                }
            } else {
                console.warn(`Skipping non-audio file: ${file.name} (${file.type})`);
            }
        }
    }
    
    // Load audio buffer from file
    async function loadAudioBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const audioBuffer = await window.app.audioEngine.audioContext.decodeAudioData(arrayBuffer);
                    resolve(audioBuffer);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
}

// Enhance local storage functionality with IndexedDB
function enhanceLocalStorage() {
    console.log('Enhancing local storage with IndexedDB');
    
    // Add indexedDB support for larger storage
    const dbName = 'RetroMixDB';
    const dbVersion = 1;
    let db;
    
    // Open database
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onerror = function(event) {
        console.error('IndexedDB error:', event.target.error);
    };
    
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('tracks')) {
            db.createObjectStore('tracks', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('playlists')) {
            db.createObjectStore('playlists', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('audioFiles')) {
            db.createObjectStore('audioFiles', { keyPath: 'id' });
        }
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('IndexedDB initialized successfully');
        
        // Extend the library manager with IndexedDB methods
        extendLibraryManager();
    };
    
    function extendLibraryManager() {
        const libraryManager = window.app.libraryManager;
        
        // Override saveLibrary method
        const originalSaveLibrary = libraryManager.saveLibrary;
        libraryManager.saveLibrary = function() {
            // Call original method for backward compatibility
            originalSaveLibrary.call(this);
            
            // Save to IndexedDB
            const transaction = db.transaction(['tracks', 'playlists'], 'readwrite');
            
            // Save tracks
            const trackStore = transaction.objectStore('tracks');
            this.tracks.forEach(track => {
                trackStore.put(track);
            });
            
            // Save playlists
            const playlistStore = transaction.objectStore('playlists');
            Object.values(this.playlists).forEach(playlist => {
                playlistStore.put(playlist);
            });
            
            console.log('Library saved to IndexedDB');
        };
        
        // Override loadLibrary method
        const originalLoadLibrary = libraryManager.loadLibrary;
        libraryManager.loadLibrary = async function() {
            // Call original method for backward compatibility
            originalLoadLibrary.call(this);
            
            // Try to load from IndexedDB
            try {
                const tracks = await getAllFromStore('tracks');
                const playlists = await getAllFromStore('playlists');
                
                if (tracks.length > 0) {
                    this.tracks = tracks;
                }
                
                if (playlists.length > 0) {
                    this.playlists = {};
                    playlists.forEach(playlist => {
                        this.playlists[playlist.id] = playlist;
                    });
                }
                
                console.log(`Loaded from IndexedDB: ${tracks.length} tracks, ${playlists.length} playlists`);
            } catch (error) {
                console.error('Error loading from IndexedDB:', error);
            }
        };
        
        // Helper function to get all items from a store
        function getAllFromStore(storeName) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                
                request.onsuccess = function() {
                    resolve(request.result);
                };
                
                request.onerror = function(error) {
                    reject(error);
                };
            });
        }
    }
}

// Add drag highlight styles
function addDragHighlightStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .drag-highlight {
            border: 2px dashed var(--highlight-color) !important;
            background-color: rgba(255, 255, 255, 0.1);
        }
    `;
    document.head.appendChild(style);
}

// Export functions
window.setupTrackBrowserDragAndDrop = setupTrackBrowserDragAndDrop;
window.enhanceLocalStorage = enhanceLocalStorage;
window.addDragHighlightStyles = addDragHighlightStyles;
