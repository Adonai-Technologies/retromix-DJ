                            // Initialize drag and drop and enhanced storage
                            setupTrackBrowserDragAndDrop();
                            enhanceLocalStorage();
                            addDragHighlightStyles();
                            
                            // Add drag and drop instructions to track browser
                            const trackList = document.getElementById('track-list');
                            if (trackList && trackList.innerHTML.trim() === '') {
                                trackList.innerHTML = '<div class="empty-message">Drag and drop audio files here to add them to your library</div>';
                            }
