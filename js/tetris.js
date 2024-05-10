// DOM elements
const canvas = document.getElementById('tetrisCanvas');
const context = canvas.getContext('2d');
const audio = document.getElementById("myAudio");
const musicBtn = document.getElementById("musicBtn");
const scoreElement = document.getElementById('score');
const nextBlock = document.getElementById('nextBlock');
const nextCtx = nextBlock.getContext('2d');

// parameters and states
const blockSize = 30;
const rows = 20;
const cols = 10;

const tetrominoes = [
    [[1, 1, 1, 1]],  // I
    [[1, 1, 1], [0, 1, 0]],  // T
    [[1, 1], [1, 1]],  // O
    [[0, 1, 1], [1, 1, 0]],  // S
    [[1, 1, 0], [0, 1, 1]],  // Z
    [[1, 0, 0], [1, 1, 1]],  // J
    [[0, 0, 1], [1, 1, 1]]   // L
];
let currentPos = { x: 4, y: 0 };
let currentTetromino = tetrominoes[0];
let nextTetromino = tetrominoes[getRandomTetrominoIndex()];
let dropInterval = 500; //ms
let lastTime = 0;
let dropCounter = 0;
let score = 0;
let isPaused = false;
let gameOver = false;
let animationFrameId;  // store the ID of the animation fram

//  use two-dimensional array to store positions
let board = Array.from({ length: rows }, () => Array(cols).fill(0));

// initialize the game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    gameOver = false; 
    resetGame();
    lastTime = performance.now();  // get current time
    animationFrameId = requestAnimationFrame(updateGame); // begin game loop
});

// get Random Tetromino Index
function getRandomTetrominoIndex() {
    return Math.floor(Math.random() * tetrominoes.length);
}

// uoggle music play/pause
musicBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        musicBtn.textContent = "Pause Music";
    } else {
        audio.pause();
        musicBtn.textContent = "Play Music";
    }
})

// keyboard is pressed
document.addEventListener('keydown', e => {
    if (e.keyCode === 27) {  // ESC to toggle pause
        togglePause();
        return;
    }
    if (!isPaused) {
        switch(e.keyCode) {
            case 13:  // ENTER to reset the game
                resetGame();
                break;
            case 37:  // LEFT arrow to move left
                currentPos.x--;
                if (!isValidPosition(currentTetromino, currentPos)) currentPos.x++;
                break;
            case 39:  // RIGHT arrow to move right
                currentPos.x++;
                if (!isValidPosition(currentTetromino, currentPos)) currentPos.x--;
                break;
            case 40:  // DOWN arrow to increase drop speed
                dropInterval = 75;
                break;
            case 38:  // UP arrow to rotate tetromino
                let rotated = rotate(currentTetromino);
                if (isValidPosition(rotate(currentTetromino), currentPos)) {
                    currentTetromino = rotated;
                }
                break;
        }
    }
})

// reset drop speed when DOWN arrow is released
document.addEventListener('keyup', e => {
    if (e.keyCode === 40) {  
        dropInterval = 500;
    }
})

// main game update loop
function updateGame(time = 0) {
    if (!isPaused && !gameOver) {
        // calculate time
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        // update game
        if (dropCounter > dropInterval) {
            dropTetromino();
            dropCounter = 0;
        }
        drawBoard();
        drawTetromino();
    }
    animationFrameId = requestAnimationFrame(updateGame);
}

// draw a single block
function drawBlock(x, y) {
    context.fillStyle = '#afbeff';
    // draw square
    context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
    // draw lines of block
    context.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
}

// draw tetromino
function drawTetromino() {
    // nested for loop to draw each block in the two-dimensional array
    currentTetromino.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(currentPos.x + x, currentPos.y + y);
            }
        });
    });
}


// draw game board
function drawBoard() {
    // clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    // draw the entire board inlcuding tetrominos have already fallen
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            // check block
            if (board[y][x] === 1) {
                drawBlock(x, y);
            }
        }
    }
}

// rotate the tetromino matrix
function rotate(matrix) {
    const matrixRows = matrix.length;
    const matrixCols = matrix[0].length;
    const newMatrix = Array.from({ length: matrixCols }, () => new Array(matrixRows).fill(0));
    for (let y = 0; y < matrixRows; y++) {
        for (let x = 0; x < matrixCols; x++) {
            // rotate 90 degree
            newMatrix[x][matrixRows - 1 - y] = matrix[y][x];
        }
    }
    return newMatrix;
}

// check if the tetromino position is valid
// matrix is the tetromino; offset is a object about position
function isValidPosition(matrix, offset) {
    // check every position in matrix
    return matrix.every((row, y) => row.every((value, x) => {
        const newX = offset.x + x;
        const newY = offset.y + y;
        return (
            value === 0 ||
            // check border
            (newY >= 0 && newY < rows && newX >= 0 && newX < cols && board[newY][newX] === 0)
        );
    }));
}

// merge the fallen tetromino with the board
function merge() {
    // assign values two the borad array
    currentTetromino.forEach((row, y) => row.forEach((value, x) => {
        if (value !== 0) {
            board[currentPos.y + y][currentPos.x + x] = value;
        }
    }));
}

// handle the fallen tetromino
function dropTetromino() {
    currentPos.y++; // move down the tetromino
    // check if the new position is valid
    if (!isValidPosition(currentTetromino, currentPos)) {
        currentPos.y--; // move back
        merge();
        updateTetromino(); 
        clearLines();
    }
    dropCounter = 0;
}

// clear complete lines
function clearLines() {
    // count lines
    let lines = 0;
    // check every row from bottom
    outer: for (let y = board.length - 1; y > 0; --y) {
        // check each block in the row is filled
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        // remove the line and fill 0s in returned deleted line
        const row = board.splice(y, 1)[0].fill(0);
        // add a new line of 0
        board.unshift(row);
        y++;
        lines++;
    }
    // update score
    if (lines > 0) updateScore(lines);
}

// update game score
function updateScore(lines) {
    // increase scored based on the number of eliminated rows
    const linePoints = [0, 100, 300, 600, 1000];
    score += linePoints[lines];
    scoreElement.innerText = score;
}

// Draw the next tetromino in the preview window
function drawNextBlock() {
    // clear preview
    nextCtx.clearRect(0, 0, nextBlock.width, nextBlock.height);
    // draw next tetromino
    nextTetromino.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                nextCtx.fillStyle = '#afbeff';
                nextCtx.fillRect(x * 30 + 10, y * 30 + 10, 30, 30);
                nextCtx.strokeRect(x * 30 + 10, y * 30 + 10, 30, 30);
            }
        });
    });
}

// create new square in gaming area and new next square in preview
function updateTetromino() {
    currentTetromino = nextTetromino;
    currentPos = { x: Math.floor((cols - currentTetromino[0].length) / 2), y: 0 };
    nextTetromino = tetrominoes[getRandomTetrominoIndex()];
    drawNextBlock();
    // check game over
    if (!isValidPosition(currentTetromino, currentPos)) {
        gameOver = true;
        displayGameOver();
    }
}

// reset the game to the initial state
function resetGame() {
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    score = 0;
    updateScore(0);
    gameOver = false;
    currentPos = { x: 4, y: 0 };
    dropInterval = 500;
    lastTime = 0;
    dropCounter = 0;
    currentTetromino = tetrominoes[getRandomTetrominoIndex()];
    nextTetromino = tetrominoes[getRandomTetrominoIndex()];
    drawNextBlock();
    updateGame();
}

// toggle the pause state of the game
function togglePause() {
    isPaused = !isPaused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (isPaused) {
        pauseOverlay.style.display = 'flex';
        // stop the game loop
        cancelAnimationFrame(animationFrameId);  
    } else {
        pauseOverlay.style.display = 'none';
        // reset last update time
        lastTime = performance.now();  
        dropCounter = 0;
        // Restart the game loop
        animationFrameId = requestAnimationFrame(updateGame);  
    }
}

// display game over screen and offer restart option
function displayGameOver() {
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    gameOverOverlay.style.display = 'flex';
    gameOverOverlay.textContent = 'Game Over - Click to restart!';
    gameOverOverlay.addEventListener('click', function() {
        gameOverOverlay.style.display = 'none';
        resetGame();
    });
}
