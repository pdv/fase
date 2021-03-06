'use strict';

let $ = (id) => document.getElementById(id);

const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const cw = canvas.width;
const ch = canvas.height;

var actx = new AudioContext();

const SEQUENCE_LENGTH = 12;
const NUM_NOTES = 12;
const SIDE_LENGTH = ch / NUM_NOTES;

let notes;
let pianoBuffer = [];
let marimbaBuffer;
let clapBuffer;
let root = 60;
let reverbNode;

function makeNotes() {
    notes = [];
    for (let i = 0; i < SEQUENCE_LENGTH; i++) {
        notes[i] = [];
        for (let j = 0; j < NUM_NOTES; j++) {
            notes[i][j] = 0;
        }
    }
    return notes;
}


////////////////////////////////////////////////// Root draw


function drawGrid() {
    ctx.strokeStyle = 'black';

    // Horizontal
    for (let y = 0; y <= ch; y += SIDE_LENGTH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
    }

    // Vertical
    for (let x = 0; x <= cw; x += SIDE_LENGTH) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
    }
}

function drawPiano(root) {
    // starting at c
    let pattern = [false, true, false, true, false, false, true, false, true, false, true, false];
    let offset = (root - 60) % 12;
    ctx.fillStyle = 'black';
    for (let i = 0; i < NUM_NOTES; i++) {
        let index = (i + offset) % pattern.length;
        if (index < 0) {
            index = pattern.length + index;
        }

        if (pattern[index]) {
            let y = ch - ((i + 1) * SIDE_LENGTH);
            ctx.fillRect(0, y, SIDE_LENGTH, SIDE_LENGTH);
        }
    }
}


////////////////////////////////////////////////// Click handling


function fillBox(column, row, color) {
    const x = (column + 1) * SIDE_LENGTH + 1;
    const y = row * SIDE_LENGTH + 1;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, SIDE_LENGTH - 2, SIDE_LENGTH - 2);
}

function clearBox(column, row) {
    fillBox(column, row, 'white');
}

function colorBox(column, row) {
    const color = 'rgb(0,' + (255 - column * 10) + ',' + (255 - row * 10) + ')';
    fillBox(column, row, color);
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const column = Math.floor(x / SIDE_LENGTH);
    const row = Math.floor(y / SIDE_LENGTH);
    if (column > 0) {
        onRectClicked(column - 1, row);
    }
});

function onRectClicked(column, row) {

    if (notes[column][row] == 0) {
        colorBox(column, row);
        notes[column][row] = 1;
    } else {
        clearBox(column, row);
        notes[column][row] = 0;
    }
}


////////////////////////////////////////////////// Sound

function loadSound(url, callback) {
    let request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
        actx.decodeAudioData(
            request.response,
            callback,
            (e) => console.log("Error loading sound")
        );
    };
    request.send();
}

function loadPiano() {
    for (let i = 1; i <= 64; i++) {
        const fileName = 'piano/' + i + '.wav';
        loadSound(fileName, (buffer) => pianoBuffer[i + 20] = buffer);
    }
}

function loadMarimba() {
    loadSound('marimba/g3.wav', (buffer) => marimbaBuffer = buffer);
}

function loadClap() {
    loadSound('clap/clap.wav', (buffer) => clapBuffer = buffer);
}

function loadReverb() {
    reverbNode = actx.createConvolver();
    loadSound('StAndrewsChurch.wav', (buffer) => reverbNode.buffer = buffer);
    reverbNode.connect(actx.destination);
}

function playNote(note, delay) {
    let source = actx.createBufferSource();
    let gain = actx.createGain();
    if ($('instrument').value == 'piano') {
        source.buffer = pianoBuffer[note];
        gain.gain.value = 0.7;
    } else if ($('instrument').value == 'marimba') {
        source.buffer = marimbaBuffer;
        const interval = note - 55;
        source.playbackRate.value = 1 * Math.pow(2**interval, 1/12);
        gain.gain.value = 1.8;
    } else if ($('instrument').value == 'clap') {
        source.buffer = clapBuffer;
    }
    source.connect(gain);
    if ($('reverb').checked) {
        gain.connect(reverbNode);
    } else {
        gain.connect(actx.destination);
    }
    source.start(actx.currentTime + delay);
}

function play() {
    const cycleLength = 16;
    const transitionLength = 4;
    const bartime = 60 / $('tempo').value;
    const notetime = bartime / SEQUENCE_LENGTH;
    const transitionNoteTime = (bartime * transitionLength) / (SEQUENCE_LENGTH * transitionLength + 1);

    var p1delay = 0;
    var p2delay = 0;
    for (var bar = 0; bar < 100; bar++) {
        for (var column = 0; column < SEQUENCE_LENGTH; column++) {
            for (var row = 0; row < NUM_NOTES; row++) {
                if (notes[column][row] == 1) {
                    const note = root + NUM_NOTES - row;
                    playNote(note, p1delay);
                    playNote(note, p2delay);
                }
            }
            p1delay += notetime;
            if (bar % cycleLength < (cycleLength - transitionLength)) {
                p2delay += notetime;
            } else {
                p2delay += transitionNoteTime;
            }
        }
    }
}


$('play').addEventListener('click', play);
$('stop').addEventListener('click', reloadAudio);

$('rootUp').addEventListener('click', () => {
    root++;
    redraw();
});

$('rootDown').addEventListener('click', () => {
    root--;
    redraw();
});

function redraw() {
    ctx.clearRect(0, 0, cw, ch);
    drawGrid();
    drawPiano(root);
}

function reloadAudio() {
    actx.close();
    actx = new AudioContext();
    loadReverb();
}

function main() {
    makeNotes();
    redraw();
    reloadAudio();
    loadPiano();
    loadMarimba();
    loadClap();
}


main();
