/**
 * RetroMix DJ - Track Library UI
 * Handles the user interface for the track library
 */

class TrackLibraryUI {
    constructor(libraryManager) {
        this.libraryManager = libraryManager;
        this.currentPlaylistId = null;
        this.searchQuery = '';
        this.sortField = 'title';
        this.sortDirection = 'asc';
        
        // DOM elements
        this.elements = {
            trackList: document.getElementById('track-list'),
            searchInput: document.getElementById('track-search'),
            playlistSelector: document.getElementById('playlist-selector'),
            createPlaylistBtn: document.getElementById('create-playlist-btn'),
            exportLibraryBtn: document.getElementById('export-library-btn'),
            importLibraryBtn: document.getElementById('import-library-btn')
        };
        
        // Initialize UI
        this.initializeUI();
    }
    
    /**
     * Initialize UI
     */
    initializeUI() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Populate playlists dropdown
        this.populatePlaylistSelector();
        
        // Display tracks
        this.displayTracks();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.displayTracks();
            });
        }
        
        // Playlist selector
        if (this.elements.playlistSelector) {
            this.elements.playlistSelector.addEventListener('change', (e) => {
                this.currentPlaylistId = e.target.value || null;
                this.displayTracks();
            });
        }
        
        // Create playlist button
        if (this.elements.createPlaylistBtn) {
            this.elements.createPlaylistBtn.addEventListener('click', () => {
                this.showCreatePlaylistDialog();
            });
        }
        
        // Export library button
        if (this.elements.exportLibraryBtn) {
            this.elements.exportLibraryBtn.addEventListener('click', () => {
                this.libraryManager.exportLibrary();
            });
        }
        
        // Import library button
        if (this.elements.importLibraryBtn) {
            this.elements.importLibraryBtn.addEventListener('click', () => {
                this.showImportLibraryDialog();
            });
        }
        
        // Listen for library events
        document.addEventListener('tracklibraryadded', () => this.displayTracks());
        document.addEventListener('tracklibraryupdated', () => this.displayTracks());
        document.addEventListener('tracklibrarydeleted', () => this.displayTracks());
        document.addEventListener('playlistcreated', () => this.populatePlaylistSelector());
        document.addEventListener('playlistupdated', () => this.populatePlaylistSelector());
        document.addEventListener('playlistdeleted', () => this.populatePlaylistSelector());
        document.addEventListener('playlisttrackadded', () => {
            if (this.currentPlaylistId) this.displayTracks();
        });
        document.addEventListener('playlisttrackremoved', () => {
            if (this.currentPlaylistId) this.displayTracks();
        });
        document.addEventListener('libraryimported', () => {
            this.populatePlaylistSelector();
            this.displayTracks();
        });
    }
    
    /**
     * Populate playlist selector dropdown
     */
    populatePlaylistSelector() {
        if (!this.elements.playlistSelector) return;
        
        // Clear existing options
        this.elements.playlistSelector.innerHTML = '';
        
        // Add "All Tracks" option
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'All Tracks';
        this.elements.playlistSelector.appendChild(allOption);
        
        // Add playlists
        const playlists = this.libraryManager.getPlaylists();
        playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.id;
            option.textContent = playlist.name;
            this.elements.playlistSelector.appendChild(option);
        });
        
        // Select current playlist
        if (this.currentPlaylistId) {
            this.elements.playlistSelector.value = this.currentPlaylistId;
        }
    }
    
    /**
     * Display tracks based on current filters
     */
    displayTracks() {
        if (!this.elements.trackList) return;
        
        // Clear track list
        this.elements.trackList.innerHTML = '';
        
        // Get tracks based on current playlist and search query
        let tracks;
        
        if (this.currentPlaylistId) {
            // Get tracks from playlist
            tracks = this.libraryManager.getPlaylistTracks(this.currentPlaylistId);
            
            // Apply search filter if needed
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                tracks = tracks.filter(track => {
                    return (
                        track.title.toLowerCase().includes(query) ||
                        track.artist.toLowerCase().includes(query) ||
                        track.album.toLowerCase().includes(query) ||
                        track.genre.toLowerCase().includes(query)
                    );
                });
            }
        } else {
            // Search all tracks
            tracks = this.libraryManager.searchTracks(this.searchQuery);
        }
        
        // Sort tracks
        tracks = this.sortTracks(tracks);
        
        // Display tracks
        if (tracks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = this.searchQuery 
                ? 'No tracks found matching your search' 
                : 'No tracks in this playlist';
            this.elements.trackList.appendChild(emptyMessage);
            return;
        }
        
        // Create track items
        tracks.forEach(track => {
            const trackItem = this.createTrackItem(track);
            this.elements.trackList.appendChild(trackItem);
        });
    }
    
    /**
     * Create a track item element
     */
    createTrackItem(track) {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        trackItem.dataset.trackId = track.id;
        
        // Create track info
        const trackInfo = document.createElement('div');
        trackInfo.className = 'track-info';
        
        const title = document.createElement('div');
        title.className = 'track-title';
        title.textContent = track.title;
        
        const artist = document.createElement('div');
        artist.className = 'track-artist';
        artist.textContent = track.artist;
        
        const details = document.createElement('div');
        details.className = 'track-details';
        
        // Add BPM and key if available
        let detailsText = '';
        if (track.bpm) detailsText += `${track.bpm} BPM`;
        if (track.key) detailsText += detailsText ? ` • ${track.key}` : track.key;
        if (track.duration) {
            const minutes = Math.floor(track.duration / 60);
            const seconds = Math.floor(track.duration % 60);
            detailsText += detailsText ? ` • ${minutes}:${seconds.toString().padStart(2, '0')}` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        details.textContent = detailsText;
        
        trackInfo.appendChild(title);
        trackInfo.appendChild(artist);
        trackInfo.appendChild(details);
        
        // Create track actions
        const trackActions = document.createElement('div');
        trackActions.className = 'track-actions';
        
        // Load to deck buttons
        const loadLeftBtn = document.createElement('button');
        loadLeftBtn.className = 'btn small-btn';
        loadLeftBtn.textContent = 'A';
        loadLeftBtn.title = 'Load to Deck A';
        loadLeftBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.loadTrackToDeck(track.id, 'left');
        });
        
        const loadRightBtn = document.createElement('button');
        loadRightBtn.className = 'btn small-btn';
        loadRightBtn.textContent = 'B';
        loadRightBtn.title = 'Load to Deck B';
        loadRightBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.loadTrackToDeck(track.id, 'right');
        });
        
        // Favorite button
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'btn icon-btn' + (track.favorite ? ' active' : '');
        favoriteBtn.innerHTML = '★';
        favoriteBtn.title = track.favorite ? 'Remove from Favorites' : 'Add to Favorites';
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(track.id);
        });
        
        trackActions.appendChild(loadLeftBtn);
        trackActions.appendChild(loadRightBtn);
        trackActions.appendChild(favoriteBtn);
        
        // Add to track item
        trackItem.appendChild(trackInfo);
        trackItem.appendChild(trackActions);
        
        // Add click handler for track item
        trackItem.addEventListener('click', () => {
            this.showTrackDetailsDialog(track.id);
        });
        
        // Add context menu
        trackItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showTrackContextMenu(track.id, e.clientX, e.clientY);
        });
        
        return trackItem;
    }
    
    /**
     * Sort tracks by field
     */
    sortTracks(tracks) {
        return tracks.sort((a, b) => {
            let valueA, valueB;
            
            switch (this.sortField) {
                case 'title':
                    valueA = a.title.toLowerCase();
                    valueB = b.title.toLowerCase();
                    break;
                case 'artist':
                    valueA = a.artist.toLowerCase();
                    valueB = b.artist.toLowerCase();
                    break;
                case 'album':
                    valueA = a.album.toLowerCase();
                    valueB = b.album.toLowerCase();
                    break;
                case 'bpm':
                    valueA = a.bpm || 0;
                    valueB = b.bpm || 0;
                    break;
                case 'key':
                    valueA = a.key || '';
                    valueB = b.key || '';
                    break;
                case 'duration':
                    valueA = a.duration || 0;
                    valueB = b.duration || 0;
                    break;
                case 'dateAdded':
                    valueA = new Date(a.dateAdded).getTime();
                    valueB = new Date(b.dateAdded).getTime();
                    break;
                case 'lastPlayed':
                    valueA = new Date(a.lastPlayed).getTime();
                    valueB = new Date(b.lastPlayed).getTime();
                    break;
                case 'playCount':
                    valueA = a.playCount || 0;
                    valueB = b.playCount || 0;
                    break;
                default:
                    valueA = a.title.toLowerCase();
                    valueB = b.title.toLowerCase();
            }
            
            // Compare values
            if (valueA < valueB) {
                return this.sortDirection === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return this.sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
    
    /**
     * Set sort field and direction
     */
    setSortField(field) {
        if (this.sortField === field) {
            // Toggle direction if same field
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Set new field and default to ascending
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        // Update display
        this.displayTracks();
    }
    
    /**
     * Load track to deck
     */
    loadTrackToDeck(trackId, deckId) {
        // In a real implementation, we would load the track from storage
        // For now, just dispatch an event
        const event = new CustomEvent('loadtrackfromlibrary', {
            detail: {
                trackId: trackId,
                deckId: deckId
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Toggle favorite status
     */
    toggleFavorite(trackId) {
        const isFavorite = this.libraryManager.toggleFavorite(trackId);
        
        // Update UI
        const trackItems = document.querySelectorAll(`.track-item[data-track-id="${trackId}"]`);
        trackItems.forEach(item => {
            const favoriteBtn = item.querySelector('.icon-btn');
            if (favoriteBtn) {
                if (isFavorite) {
                    favoriteBtn.classList.add('active');
                    favoriteBtn.title = 'Remove from Favorites';
                } else {
                    favoriteBtn.classList.remove('active');
                    favoriteBtn.title = 'Add to Favorites';
                }
            }
        });
    }
    
    /**
     * Show track context menu
     */
    showTrackContextMenu(trackId, x, y) {
        // Remove any existing context menu
        const existingMenu = document.getElementById('track-context-menu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }
        
        const track = this.libraryManager.getTrack(trackId);
        if (!track) return;
        
        // Create context menu
        const menu = document.createElement('div');
        menu.id = 'track-context-menu';
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.backgroundColor = 'var(--panel-color)';
        menu.style.border = '1px solid var(--primary-color)';
        menu.style.borderRadius = '5px';
        menu.style.padding = '5px 0';
        menu.style.zIndex = '1000';
        menu.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        
        // Add menu items
        const loadLeftItem = this.createMenuItem('Load to Deck A', () => {
            this.loadTrackToDeck(trackId, 'left');
        });
        
        const loadRightItem = this.createMenuItem('Load to Deck B', () => {
            this.loadTrackToDeck(trackId, 'right');
        });
        
        const favoriteItem = this.createMenuItem(
            track.favorite ? 'Remove from Favorites' : 'Add to Favorites', 
            () => {
                this.toggleFavorite(trackId);
            }
        );
        
        const editItem = this.createMenuItem('Edit Metadata', () => {
            this.showTrackDetailsDialog(trackId);
        });
        
        const addToPlaylistItem = this.createMenuItem('Add to Playlist', () => {
            this.showAddToPlaylistDialog(trackId);
        });
        
        const deleteItem = this.createMenuItem('Delete from Library', () => {
            if (confirm(`Are you sure you want to delete "${track.title}" from your library?`)) {
                this.libraryManager.deleteTrack(trackId);
            }
        });
        
        menu.appendChild(loadLeftItem);
        menu.appendChild(loadRightItem);
        menu.appendChild(this.createMenuDivider());
        menu.appendChild(favoriteItem);
        menu.appendChild(addToPlaylistItem);
        menu.appendChild(this.createMenuDivider());
        menu.appendChild(editItem);
        menu.appendChild(deleteItem);
        
        // Add to document
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Add small delay to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }
    
    /**
     * Create a menu item
     */
    createMenuItem(text, onClick) {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = text;
        item.style.padding = '8px 15px';
        item.style.cursor = 'pointer';
        item.style.transition = 'background-color 0.2s';
        
        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = 'var(--button-active)';
        });
        
        item.addEventListener('mouseout', () => {
            item.style.backgroundColor = 'transparent';
        });
        
        item.addEventListener('click', onClick);
        
        return item;
    }
    
    /**
     * Create a menu divider
     */
    createMenuDivider() {
        const divider = document.createElement('div');
        divider.className = 'context-menu-divider';
        divider.style.height = '1px';
        divider.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        divider.style.margin = '5px 0';
        return divider;
    }
    
    /**
     * Show track details dialog
     */
    showTrackDetailsDialog(trackId) {
        const track = this.libraryManager.getTrack(trackId);
        if (!track) return;
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.style.display = 'block';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        // Close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Track Details';
        
        // Form
        const form = document.createElement('form');
        
        // Title field
        const titleField = this.createFormField('Title', 'title', track.title);
        
        // Artist field
        const artistField = this.createFormField('Artist', 'artist', track.artist);
        
        // Album field
        const albumField = this.createFormField('Album', 'album', track.album);
        
        // Genre field
        const genreField = this.createFormField('Genre', 'genre', track.genre);
        
        // BPM field
        const bpmField = this.createFormField('BPM', 'bpm', track.bpm || '', 'number');
        
        // Key field
        const keyField = this.createFormField('Key', 'key', track.key || '');
        
        // Year field
        const yearField = this.createFormField('Year', 'year', track.year || '', 'number');
        
        // Add fields to form
        form.appendChild(titleField);
        form.appendChild(artistField);
        form.appendChild(albumField);
        form.appendChild(genreField);
        form.appendChild(bpmField);
        form.appendChild(keyField);
        form.appendChild(yearField);
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn';
        saveBtn.textContent = 'Save Changes';
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get form values
            const metadata = {
                title: form.elements.title.value,
                artist: form.elements.artist.value,
                album: form.elements.album.value,
                genre: form.elements.genre.value,
                bpm: form.elements.bpm.value ? parseFloat(form.elements.bpm.value) : null,
                key: form.elements.key.value,
                year: form.elements.year.value ? parseInt(form.elements.year.value) : null
            };
            
            // Update track metadata
            this.libraryManager.updateTrackMetadata(trackId, metadata);
            
            // Close dialog
            document.body.removeChild(dialog);
        });
        
        form.appendChild(saveBtn);
        
        // Add elements to content
        content.appendChild(closeBtn);
        content.appendChild(title);
        content.appendChild(form);
        
        // Add content to dialog
        dialog.appendChild(content);
        
        // Add dialog to document
        document.body.appendChild(dialog);
    }
    
    /**
     * Create a form field
     */
    createFormField(label, name, value, type = 'text') {
        const field = document.createElement('div');
        field.className = 'form-field';
        
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.htmlFor = name;
        
        const input = document.createElement('input');
        input.type = type;
        input.id = name;
        input.name = name;
        input.value = value;
        
        field.appendChild(labelElement);
        field.appendChild(input);
        
        return field;
    }
    
    /**
     * Show create playlist dialog
     */
    showCreatePlaylistDialog() {
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.style.display = 'block';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        // Close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Create Playlist';
        
        // Form
        const form = document.createElement('form');
        
        // Name field
        const nameField = this.createFormField('Playlist Name', 'name', '');
        
        form.appendChild(nameField);
        
        // Create button
        const createBtn = document.createElement('button');
        createBtn.className = 'btn';
        createBtn.textContent = 'Create';
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const name = form.elements.name.value.trim();
            if (!name) {
                alert('Please enter a playlist name');
                return;
            }
            
            // Create playlist
            this.libraryManager.createPlaylist(name);
            
            // Close dialog
            document.body.removeChild(dialog);
        });
        
        form.appendChild(createBtn);
        
        // Add elements to content
        content.appendChild(closeBtn);
        content.appendChild(title);
        content.appendChild(form);
        
        // Add content to dialog
        dialog.appendChild(content);
        
        // Add dialog to document
        document.body.appendChild(dialog);
    }
    
    /**
     * Show add to playlist dialog
     */
    showAddToPlaylistDialog(trackId) {
        const track = this.libraryManager.getTrack(trackId);
        if (!track) return;
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.style.display = 'block';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        // Close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Add to Playlist';
        
        // Subtitle
        const subtitle = document.createElement('p');
        subtitle.textContent = `Select a playlist to add "${track.title}" to:`;
        
        // Playlist list
        const playlistList = document.createElement('div');
        playlistList.className = 'playlist-list';
        
        // Get playlists
        const playlists = this.libraryManager.getPlaylists();
        
        // Add playlists to list
        playlists.forEach(playlist => {
            // Skip "Recent" playlist
            if (playlist.id === 'recent') return;
            
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item';
            playlistItem.textContent = playlist.name;
            
            // Check if track is already in playlist
            const isInPlaylist = playlist.tracks.includes(trackId);
            if (isInPlaylist) {
                playlistItem.classList.add('in-playlist');
                playlistItem.textContent += ' (Already added)';
            }
            
            playlistItem.addEventListener('click', () => {
                if (!isInPlaylist) {
                    this.libraryManager.addTrackToPlaylist(playlist.id, trackId);
                    document.body.removeChild(dialog);
                }
            });
            
            playlistList.appendChild(playlistItem);
        });
        
        // Create new playlist button
        const newPlaylistBtn = document.createElement('button');
        newPlaylistBtn.className = 'btn';
        newPlaylistBtn.textContent = 'Create New Playlist';
        newPlaylistBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.showCreatePlaylistWithTrackDialog(trackId);
        });
        
        // Add elements to content
        content.appendChild(closeBtn);
        content.appendChild(title);
        content.appendChild(subtitle);
        content.appendChild(playlistList);
        content.appendChild(newPlaylistBtn);
        
        // Add content to dialog
        dialog.appendChild(content);
        
        // Add dialog to document
        document.body.appendChild(dialog);
    }
    
    /**
     * Show create playlist with track dialog
     */
    showCreatePlaylistWithTrackDialog(trackId) {
        const track = this.libraryManager.getTrack(trackId);
        if (!track) return;
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.style.display = 'block';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        // Close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Create Playlist';
        
        // Form
        const form = document.createElement('form');
        
        // Name field
        const nameField = this.createFormField('Playlist Name', 'name', '');
        
        form.appendChild(nameField);
        
        // Create button
        const createBtn = document.createElement('button');
        createBtn.className = 'btn';
        createBtn.textContent = 'Create';
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const name = form.elements.name.value.trim();
            if (!name) {
                alert('Please enter a playlist name');
                return;
            }
            
            // Create playlist
            const playlist = this.libraryManager.createPlaylist(name);
            
            // Add track to playlist
            this.libraryManager.addTrackToPlaylist(playlist.id, trackId);
            
            // Close dialog
            document.body.removeChild(dialog);
        });
        
        form.appendChild(createBtn);
        
        // Add elements to content
        content.appendChild(closeBtn);
        content.appendChild(title);
        content.appendChild(form);
        
        // Add content to dialog
        dialog.appendChild(content);
        
        // Add dialog to document
        document.body.appendChild(dialog);
    }
    
    /**
     * Show import library dialog
     */
    showImportLibraryDialog() {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'application/json';
        fileInput.style.display = 'none';
        
        // Add to document
        document.body.appendChild(fileInput);
        
        // Set up file selection handler
        fileInput.addEventListener('change', async (e) => {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                
                try {
                    // Read file
                    const text = await this.readFileAsText(file);
                    
                    // Import library
                    const success = this.libraryManager.importLibrary(text);
                    
                    if (success) {
                        alert('Library imported successfully');
                    } else {
                        alert('Failed to import library. Invalid format.');
                    }
                } catch (error) {
                    console.error('Error importing library:', error);
                    alert('Error importing library: ' + error.message);
                }
            }
            
            // Remove file input
            document.body.removeChild(fileInput);
        });
        
        // Trigger file dialog
        fileInput.click();
    }
    
    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsText(file);
        });
    }
}

// Export the class
window.TrackLibraryUI = TrackLibraryUI;
