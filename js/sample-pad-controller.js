/**
 * RetroMix DJ - Sample Pad Controller
 * Handles UI interactions for the sample pads
 */

class SamplePadController {
    constructor(sampleManager) {
        this.sampleManager = sampleManager;
        this.pads = {};
        this.isEditMode = false;
        
        // Initialize
        this.initializePads();
        this.setupEventListeners();
    }
    
    /**
     * Initialize sample pads
     */
    initializePads() {
        // Find all sample pads
        const padElements = document.querySelectorAll('.sample-pads .pad');
        
        padElements.forEach(pad => {
            const padId = pad.id;
            
            this.pads[padId] = {
                element: pad,
                volume: 1.0,
                isLoaded: false
            };
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Set up click handlers for all pads
        for (const padId in this.pads) {
            const pad = this.pads[padId];
            
            pad.element.addEventListener('click', (e) => {
                if (this.isEditMode) {
                    // In edit mode, clicking opens file dialog
                    this.openSampleFileDialog(padId);
                } else {
                    // Normal mode, clicking plays sample
                    this.playSample(padId);
                }
            });
            
            // Right-click to open context menu
            pad.element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showPadContextMenu(padId, e.clientX, e.clientY);
            });
        }
        
        // Listen for sample loading events
        document.addEventListener('sampleloadingprogress', (e) => {
            this.updateLoadingProgress(e.detail);
        });
        
        document.addEventListener('sampleloadingcomplete', (e) => {
            this.handleLoadingComplete(e.detail);
        });
        
        document.addEventListener('customsampleloaded', (e) => {
            this.handleCustomSampleLoaded(e.detail);
        });
    }
    
    /**
     * Play a sample
     */
    playSample(padId) {
        const success = this.sampleManager.playSample(padId, this.pads[padId].volume);
        
        if (success) {
            // Visual feedback
            this.pads[padId].element.classList.add('active');
            setTimeout(() => {
                this.pads[padId].element.classList.remove('active');
            }, 200);
        }
    }
    
    /**
     * Open file dialog to load custom sample
     */
    openSampleFileDialog(padId) {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'audio/*';
        fileInput.style.display = 'none';
        
        // Add to document
        document.body.appendChild(fileInput);
        
        // Set up file selection handler
        fileInput.addEventListener('change', async (e) => {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                await this.loadCustomSample(padId, file);
            }
            
            // Remove file input
            document.body.removeChild(fileInput);
        });
        
        // Trigger file dialog
        fileInput.click();
    }
    
    /**
     * Load custom sample
     */
    async loadCustomSample(padId, file) {
        // Show loading state
        this.pads[padId].element.classList.add('loading');
        
        // Load sample
        const success = await this.sampleManager.loadCustomSample(padId, file);
        
        // Update UI
        this.pads[padId].element.classList.remove('loading');
        
        if (success) {
            // Update pad label with file name
            const fileName = file.name.split('.')[0];
            this.pads[padId].element.textContent = fileName.toUpperCase();
            this.pads[padId].isLoaded = true;
            
            // Visual feedback
            this.pads[padId].element.classList.add('loaded');
            setTimeout(() => {
                this.pads[padId].element.classList.remove('loaded');
            }, 500);
        }
    }
    
    /**
     * Show context menu for a pad
     */
    showPadContextMenu(padId, x, y) {
        // Remove any existing context menu
        const existingMenu = document.getElementById('pad-context-menu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }
        
        // Create context menu
        const menu = document.createElement('div');
        menu.id = 'pad-context-menu';
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
        const loadItem = this.createMenuItem('Load Sample', () => {
            this.openSampleFileDialog(padId);
        });
        
        const resetItem = this.createMenuItem('Reset to Default', () => {
            this.resetPadToDefault(padId);
        });
        
        menu.appendChild(loadItem);
        menu.appendChild(resetItem);
        
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
     * Reset pad to default sample
     */
    async resetPadToDefault(padId) {
        // Show loading state
        this.pads[padId].element.classList.add('loading');
        
        // Load default sample
        const url = this.sampleManager.sampleUrls[padId];
        const success = await this.sampleManager.loadSample(padId, url);
        
        // Update UI
        this.pads[padId].element.classList.remove('loading');
        
        if (success) {
            // Reset pad label
            const defaultName = padId.replace('pad-', 'PAD ');
            this.pads[padId].element.textContent = defaultName;
            
            // Visual feedback
            this.pads[padId].element.classList.add('reset');
            setTimeout(() => {
                this.pads[padId].element.classList.remove('reset');
            }, 500);
        }
    }
    
    /**
     * Update loading progress
     */
    updateLoadingProgress(detail) {
        const { progress, total, loaded } = detail;
        console.log(`Sample loading progress: ${loaded}/${total} (${Math.round(progress * 100)}%)`);
    }
    
    /**
     * Handle loading complete
     */
    handleLoadingComplete(detail) {
        const { total, loaded } = detail;
        console.log(`Sample loading complete: ${loaded}/${total} samples loaded`);
        
        // Mark all pads as loaded
        for (const padId in this.pads) {
            this.pads[padId].isLoaded = true;
        }
    }
    
    /**
     * Handle custom sample loaded
     */
    handleCustomSampleLoaded(detail) {
        const { id, fileName } = detail;
        console.log(`Custom sample loaded for ${id}: ${fileName}`);
    }
    
    /**
     * Toggle edit mode
     */
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        // Update UI
        for (const padId in this.pads) {
            if (this.isEditMode) {
                this.pads[padId].element.classList.add('edit-mode');
            } else {
                this.pads[padId].element.classList.remove('edit-mode');
            }
        }
        
        return this.isEditMode;
    }
}

// Export the class
window.SamplePadController = SamplePadController;
