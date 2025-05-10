# RetroMix DJ Sample Files

This directory contains the audio samples used by the RetroMix DJ application for the sample pads.

## Default Samples

The application expects the following sample files:

- `beat1.mp3`: A kick drum sound
- `beat2.mp3`: A snare drum sound
- `vocal.mp3`: A vocal effect
- `horn.mp3`: A horn sound
- `scratch.mp3`: A vinyl scratch effect
- `drop.mp3`: A bass drop effect
- `siren.mp3`: A siren sound
- `noise.mp3`: A white noise effect

## Adding Your Own Samples

You can add your own sample files to this directory and load them into the sample pads by:

1. Right-clicking on a sample pad
2. Selecting "Load Sample" from the context menu
3. Choosing your audio file

## Sample Generation

The included `create-samples.js` script can generate basic test samples using the Web Audio API. These are simple synthesized sounds for testing purposes.

In a real DJ setup, you would want to use high-quality audio samples from sample packs or your own recordings.

## Supported Formats

The application supports the following audio formats:

- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- FLAC (.flac)
- AAC (.aac, .m4a)
- WebM Audio (.webm)

## Sample Credits

The default samples included with RetroMix DJ are synthesized using the Web Audio API and are free to use.
