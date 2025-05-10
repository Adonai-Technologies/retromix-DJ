/**
 * RetroMix DJ - Beat Detection Worker
 * Analyzes audio data to detect BPM and beat grid
 */

// Receive message from main thread
self.onmessage = function(e) {
    const { deckId, audioData, sampleRate } = e.data;
    
    // Process the audio data to detect BPM
    const result = detectBPM(audioData, sampleRate);
    
    // Send results back to main thread
    self.postMessage({
        deckId: deckId,
        bpm: result.bpm,
        beatGrid: result.beatGrid,
        confidence: result.confidence
    });
};

/**
 * Detect BPM from audio data
 * Uses energy detection and autocorrelation
 */
function detectBPM(audioData, sampleRate) {
    // Step 1: Downsample for efficiency
    const downsampleFactor = Math.floor(sampleRate / 11025); // Target ~11kHz
    const downsampledData = downsample(audioData, downsampleFactor);
    const downsampledRate = sampleRate / downsampleFactor;
    
    // Step 2: Apply low-pass filter to focus on bass frequencies
    const filteredData = lowPassFilter(downsampledData, downsampledRate);
    
    // Step 3: Compute energy and find peaks
    const energyData = computeEnergy(filteredData);
    const peaks = findPeaks(energyData, downsampledRate);
    
    // Step 4: Analyze intervals between peaks
    const intervals = analyzeIntervals(peaks);
    
    // Step 5: Determine most likely BPM
    const bpmResult = determineBPM(intervals, downsampledRate);
    
    // Step 6: Generate beat grid
    const beatGrid = generateBeatGrid(bpmResult.bpm, audioData.length / sampleRate);
    
    return {
        bpm: bpmResult.bpm,
        beatGrid: beatGrid,
        confidence: bpmResult.confidence
    };
}

/**
 * Downsample audio data by taking every nth sample
 */
function downsample(data, factor) {
    const result = new Float32Array(Math.floor(data.length / factor));
    
    for (let i = 0; i < result.length; i++) {
        result[i] = data[i * factor];
    }
    
    return result;
}

/**
 * Apply a simple low-pass filter to focus on bass frequencies
 */
function lowPassFilter(data, sampleRate) {
    // Simple IIR low-pass filter
    // Cutoff around 150Hz to focus on bass drum
    const result = new Float32Array(data.length);
    const alpha = 0.05; // Smoothing factor
    
    result[0] = data[0];
    
    for (let i = 1; i < data.length; i++) {
        result[i] = alpha * data[i] + (1 - alpha) * result[i - 1];
    }
    
    return result;
}

/**
 * Compute energy (squared amplitude) of the signal
 */
function computeEnergy(data) {
    const result = new Float32Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
        result[i] = data[i] * data[i];
    }
    
    return result;
}

/**
 * Find peaks in the energy signal that likely correspond to beats
 */
function findPeaks(energyData, sampleRate) {
    const peaks = [];
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms window
    const minPeakDistance = Math.floor(sampleRate * 0.3); // Minimum 300ms between peaks
    
    let lastPeakIndex = -minPeakDistance;
    
    for (let i = windowSize; i < energyData.length - windowSize; i++) {
        // Check if this is a local maximum
        let isPeak = true;
        
        for (let j = i - windowSize; j <= i + windowSize; j++) {
            if (j !== i && energyData[j] >= energyData[i]) {
                isPeak = false;
                break;
            }
        }
        
        // Check if it's above threshold and far enough from last peak
        if (isPeak && i - lastPeakIndex >= minPeakDistance) {
            peaks.push(i / sampleRate); // Convert to seconds
            lastPeakIndex = i;
        }
    }
    
    return peaks;
}

/**
 * Analyze intervals between detected peaks
 */
function analyzeIntervals(peaks) {
    const intervals = [];
    
    for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    return intervals;
}

/**
 * Determine most likely BPM from intervals
 */
function determineBPM(intervals, sampleRate) {
    if (intervals.length === 0) {
        return { bpm: 120, confidence: 0 }; // Default fallback
    }
    
    // Create histogram of intervals
    const histogram = {};
    
    intervals.forEach(interval => {
        // Round to nearest 0.01 seconds
        const roundedInterval = Math.round(interval * 100) / 100;
        histogram[roundedInterval] = (histogram[roundedInterval] || 0) + 1;
    });
    
    // Find most common interval
    let maxCount = 0;
    let mostCommonInterval = 0;
    
    for (const interval in histogram) {
        if (histogram[interval] > maxCount) {
            maxCount = histogram[interval];
            mostCommonInterval = parseFloat(interval);
        }
    }
    
    // Convert interval to BPM
    let bpm = 60 / mostCommonInterval;
    
    // Check if we need to double or halve the BPM to get it in a reasonable range
    if (bpm < 60) {
        bpm *= 2;
    } else if (bpm > 180) {
        bpm /= 2;
    }
    
    // Calculate confidence based on histogram peak sharpness
    const totalIntervals = intervals.length;
    const confidence = maxCount / totalIntervals;
    
    return {
        bpm: Math.round(bpm * 10) / 10, // Round to 1 decimal place
        confidence: confidence
    };
}

/**
 * Generate beat grid based on BPM and track duration
 */
function generateBeatGrid(bpm, duration) {
    const beatInterval = 60 / bpm;
    const numBeats = Math.floor(duration / beatInterval) + 1;
    const beatGrid = new Array(numBeats);
    
    for (let i = 0; i < numBeats; i++) {
        beatGrid[i] = i * beatInterval;
    }
    
    return beatGrid;
}
