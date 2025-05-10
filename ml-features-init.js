                            // Set up AI features
                            document.getElementById('auto-dj-start').addEventListener('click', () => {
                                mlFeatures.startAutoDJ();
                                document.getElementById('auto-dj-start').disabled = true;
                                document.getElementById('auto-dj-stop').disabled = false;
                            });
                            
                            document.getElementById('auto-dj-stop').addEventListener('click', () => {
                                mlFeatures.stopAutoDJ();
                                document.getElementById('auto-dj-start').disabled = false;
                                document.getElementById('auto-dj-stop').disabled = true;
                            });
                            
                            // Style selector buttons
                            document.querySelectorAll('.style-button').forEach(button => {
                                button.addEventListener('click', () => {
                                    const style = button.dataset.style;
                                    mlFeatures.setCurrentStyle(style);
                                    
                                    // Update UI
                                    document.querySelectorAll('.style-button').forEach(btn => {
                                        btn.classList.remove('active');
                                    });
                                    button.classList.add('active');
                                });
                            });
                            
                            // Vocal isolation toggles
                            document.getElementById('vocal-isolation-left').addEventListener('click', () => {
                                const enabled = mlFeatures.toggleVocalIsolation('left');
                                if (enabled) {
                                    document.getElementById('vocal-isolation-left').classList.add('active');
                                } else {
                                    document.getElementById('vocal-isolation-left').classList.remove('active');
                                }
                            });
                            
                            document.getElementById('vocal-isolation-right').addEventListener('click', () => {
                                const enabled = mlFeatures.toggleVocalIsolation('right');
                                if (enabled) {
                                    document.getElementById('vocal-isolation-right').classList.add('active');
                                } else {
                                    document.getElementById('vocal-isolation-right').classList.remove('active');
                                }
                            });
                            
                            // Listen for track selection to show recommendations
                            document.addEventListener('trackselected', (e) => {
                                const { trackId } = e.detail;
                                const recommendations = mlFeatures.getTrackRecommendations(trackId, 5);
                                
                                // Update recommendations UI
                                const recommendationList = document.getElementById('recommendation-list');
                                recommendationList.innerHTML = '';
                                
                                if (recommendations.length === 0) {
                                    recommendationList.innerHTML = '<div class="recommendation-item">No recommendations available</div>';
                                    return;
                                }
                                
                                recommendations.forEach(track => {
                                    const item = document.createElement('div');
                                    item.className = 'recommendation-item';
                                    item.innerHTML = `
                                        <div class="recommendation-info">
                                            <div class="recommendation-title">${track.title}</div>
                                            <div class="recommendation-details">${track.artist} • ${track.bpm || '?'} BPM</div>
                                        </div>
                                    `;
                                    
                                    item.addEventListener('click', () => {
                                        // Load track to inactive deck
                                        const leftDeckActive = audioEngine.decks.left.isPlaying;
                                        const targetDeck = leftDeckActive ? 'right' : 'left';
                                        
                                        // Dispatch event to load track
                                        const event = new CustomEvent('loadtrackfromlibrary', {
                                            detail: {
                                                trackId: track.id,
                                                deckId: targetDeck
                                            }
                                        });
                                        document.dispatchEvent(event);
                                    });
                                    
                                    recommendationList.appendChild(item);
                                });
                            });
