# RetroMix DJ

A retro-style digital DJ system created for the "That's Entertainment!" Challenge using Amazon Q Developer.

![RetroMix DJ Screenshot](screenshot.png)

## About RetroMix DJ

RetroMix DJ is a browser-based DJ application that simulates a classic DJ setup with a nostalgic 90s interface. It features virtual turntables, a mixer with crossfader, sample pads, and visual effects - all designed with a retro aesthetic reminiscent of the 90s demo scene.

## Features

- **Dual Virtual Turntables**: Load and mix two tracks simultaneously
- **Mixer Controls**: Crossfader, volume controls, and 3-band EQ
- **Visual Effects**: Retro-style waveform and spectrum visualizers
- **Sample Pads**: Trigger audio samples and effects
- **File Loading**: Load your own audio files or use demo tracks
- **Retro UI**: Nostalgic 90s-inspired interface with neon colors and pixelated fonts

## How Amazon Q Developer Helped Create This Project

Amazon Q Developer was instrumental in creating RetroMix DJ:

1. **Code Generation**: Amazon Q helped generate the HTML, CSS, and JavaScript code for the application, including the complex Web Audio API implementation.

2. **Problem Solving**: When implementing the visualizer and audio processing features, Amazon Q provided solutions to technical challenges like creating the frequency analyzer and connecting audio nodes.

3. **UI Design**: Amazon Q suggested the retro aesthetic and helped create the CSS styles that give the application its distinctive 90s look.

4. **Audio Processing Logic**: Amazon Q helped implement the audio routing, effects processing, and crossfader functionality.

5. **Debugging Assistance**: When issues arose with the Web Audio API implementation, Amazon Q identified problems and suggested fixes.

## Testing Instructions

1. Clone this repository
2. Open the `index.html` file in a modern web browser (Chrome or Firefox recommended)
3. Click the "LOAD" button on either deck to load an audio file from your computer
4. Use the play/pause buttons to control playback
5. Adjust the crossfader to mix between the two decks
6. Try the effect buttons and sample pads for additional sounds
7. Watch the visualizer respond to the audio

## Technical Implementation

RetroMix DJ uses:

- **HTML5/CSS3**: For the user interface
- **JavaScript**: For application logic
- **Web Audio API**: For audio processing and effects
- **Canvas API**: For the visualizer

## Future Enhancements

With more time, these features could be added:

- Beat detection and synchronization
- Loop and hot cue points
- Recording mixes
- More audio effects
- MIDI controller support

## Credits

Created by Akua Konadu for the "That's Entertainment!" Challenge using Amazon Q Developer.

## License

This project is open source and available under the MIT License.
