'use strict';

let $ = (id) => document.getElementById(id);

const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const cw = canvas.width;
const ch = canvas.height;

const SEQUENCE_LENGTH = 12;
const NUM_NOTES = 12;
const SIDE_LENGTH = ch / NUM_NOTES;

// 55x55 squres

let notes;

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
        if (pattern[(i + offset) % pattern.length]) {
            let y = ch - ((i + 1) * SIDE_LENGTH);
            ctx.fillRect(0, y, SIDE_LENGTH, SIDE_LENGTH);
        }
    }
}

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

function onRectClicked(column, row) {

    if (notes[column][row] == 0) {
        colorBox(column, row);
        notes[column][row] = 1;
    } else {
        clearBox(column, row);
        notes[column][row] = 0;
    }
}

function main() {
    makeNotes();
    drawGrid();
    drawPiano(60);
}


main();
