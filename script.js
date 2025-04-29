document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const gameStatus = document.getElementById('game-status');
    const statusMessage = document.getElementById('status-message');
    const resetButton = document.getElementById('reset-button');
    const trophy = document.getElementById('trophy');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    const humanPlayer = 'X';
    const aiPlayer = 'O';
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = humanPlayer;
    let isGameActive = true;
    let currentDifficulty = 'medium'; // Default difficulty
    let winningLine = [];

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // --- Matrix Background ---
    let matrixInterval; // Stores the requestAnimationFrame ID
    let resizeTimeout;

    function setupMatrix() {
        // Clear previous interval/animation frame if running
        if (matrixInterval) {
            cancelAnimationFrame(matrixInterval); // Use cancelAnimationFrame
        }

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // ***** UPDATED CHARACTER SET *****
        const katakana = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const symbols = "!@#$%^&*()_+=-{}[]|:;\"'<>,.?/"; // Common symbols
        // Combine all characters
        const chars = katakana + alphabet + numbers + symbols;
        // ***** END OF CHARACTER SET UPDATE *****

        const charArray = chars.split("");
        const fontSize = 14; // Font size for matrix characters
        const columns = Math.ceil(canvas.width / fontSize); // Calculate number of columns

        // Array to store the y-position of the drop for each column
        let drops = [];
        for (let x = 0; x < columns; x++) {
            // Start drops at random heights for a more chaotic effect
            drops[x] = Math.floor(Math.random() * canvas.height / fontSize);
        }

        // Limit redraw rate using requestAnimationFrame for smoother visuals
        let lastTimestamp = 0;
        // Target FPS - Adjust this value to balance smoothness and performance
        // Lower FPS (e.g., 15-20) uses less CPU, Higher FPS (e.g., 30) is smoother
        const targetFps = 20; // Aiming for 20 frames per second
        const fpsInterval = 1000 / targetFps; // ms per frame

        function drawMatrix(timestamp) {
            // Request the next frame
            matrixInterval = requestAnimationFrame(drawMatrix);

            // Calculate elapsed time since the last frame
            const elapsed = timestamp - lastTimestamp;

            // If enough time has passed, draw the next frame
            if (elapsed > fpsInterval) {
                 // Adjust lastTimestamp to keep timing consistent
                 lastTimestamp = timestamp - (elapsed % fpsInterval);

                 // Draw semi-transparent black rectangle over the entire canvas
                 // This creates the fading trail effect
                 ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // Adjust alpha (0.04-0.1) for trail length
                 ctx.fillRect(0, 0, canvas.width, canvas.height);

                 // Set color and font for the falling characters
                 ctx.fillStyle = "#0F0"; // Matrix Green color
                 ctx.font = fontSize + "px monospace"; // Monospace font looks best

                 // Loop through each column
                 for (let i = 0; i < drops.length; i++) {
                     // Pick a random character from the charArray
                     const text = charArray[Math.floor(Math.random() * charArray.length)];
                     // Calculate x and y coordinates for the character
                     const xPos = i * fontSize;
                     const yPos = drops[i] * fontSize;
                     // Draw the character
                     ctx.fillText(text, xPos, yPos);

                     // Reset drop position back to the top randomly after it goes off-screen
                     // The random check adds variation to the rain effect
                     if (yPos > canvas.height && Math.random() > 0.975) {
                         drops[i] = 0; // Reset to top
                     }
                     // Move the drop down by one character height for the next frame
                     drops[i]++;
                 }
            }
        }

        // Cancel any previous animation frame request before starting a new one
        cancelAnimationFrame(matrixInterval);
        // Start the animation loop
        matrixInterval = requestAnimationFrame(drawMatrix);
    }


    // Debounced resize handler for performance
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
             // Cancel the current animation frame before resizing
             if (matrixInterval) cancelAnimationFrame(matrixInterval);
             // Re-setup matrix dimensions and restart animation
             setupMatrix();
        }, 250); // Wait 250ms after resize stops before running setupMatrix
    }

    window.addEventListener('resize', handleResize);

    // --- Game Logic Functions ---
    // (handleCellClick, makeMove, checkResult, highlightWinningCells, endGame, resetGame, getEmptyCells - Remain unchanged)

    const handleCellClick = (e) => {
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
        if (board[clickedCellIndex] !== '' || !isGameActive || currentPlayer !== humanPlayer) return;
        makeMove(clickedCell, clickedCellIndex, humanPlayer);
        if (checkResult()) return;
        currentPlayer = aiPlayer;
        setTimeout(aiTurn, 400);
    };

    const makeMove = (cellElement, index, player) => {
        board[index] = player;
        cellElement.classList.add(player.toLowerCase());
        cellElement.style.cursor = 'not-allowed';
    };

    const checkResult = () => {
        let roundWon = false;
        let winner = null;
        winningLine = [];
        for (let i = 0; i < winningConditions.length; i++) {
            const winCondition = winningConditions[i];
            const a = board[winCondition[0]];
            const b = board[winCondition[1]];
            const c = board[winCondition[2]];
            if (a === '' || b === '' || c === '') continue;
            if (a === b && b === c) {
                roundWon = true; winner = a; winningLine = winCondition; break;
            }
        }
        if (roundWon) { endGame(false, winner); highlightWinningCells(); return true; }
        if (!board.includes('')) { endGame(true); return true; }
        return false;
    };

    const highlightWinningCells = () => {
        winningLine.forEach(index => {
            const cell = document.querySelector(`.cell[data-index='${index}']`);
            if(cell) cell.classList.add('winning-cell');
        });
    };

    const endGame = (isDraw, winner = null) => {
        isGameActive = false;
        resetButton.style.display = 'flex';
        if (isDraw) {
            statusMessage.textContent = "It's a Draw!"; statusMessage.className = 'draw'; trophy.style.display = 'none';
        } else {
            if (winner === humanPlayer) { statusMessage.textContent = "You Win!"; statusMessage.className = 'win'; trophy.style.display = 'inline'; }
            else { statusMessage.textContent = "You Lose!"; statusMessage.className = 'lose'; trophy.style.display = 'none'; }
        }
        gameStatus.style.visibility = 'visible';
    };

    const resetGame = () => {
        board = ['', '', '', '', '', '', '', '', ''];
        isGameActive = true;
        currentPlayer = humanPlayer;
        statusMessage.textContent = ''; statusMessage.className = '';
        gameStatus.style.visibility = 'hidden';
        resetButton.style.display = 'none';
        trophy.style.display = 'none';
        winningLine = [];
        cells.forEach(cell => { cell.classList.remove('x', 'o', 'winning-cell'); cell.style.cursor = 'pointer'; });
    };

    const getEmptyCells = () => {
        return board.map((val, index) => val === '' ? index : null).filter(val => val !== null);
    };


    // --- AI Logic ---
    // (aiTurn, getRandomMove, findBestMoveMediumOrHard, checkWin - Remain unchanged)

    const aiTurn = () => {
        if (!isGameActive) return;
        let bestMove;
        const emptyCells = getEmptyCells();
        if (emptyCells.length === 0) return;
        if (currentDifficulty === 'easy') { bestMove = getRandomMove(emptyCells); }
        else { bestMove = findBestMoveMediumOrHard(emptyCells); }
        if (bestMove !== undefined) {
            const cellElement = document.querySelector(`.cell[data-index='${bestMove}']`);
            makeMove(cellElement, bestMove, aiPlayer);
            if (checkResult()) return;
            currentPlayer = humanPlayer;
        }
    };

    const getRandomMove = (emptyCells) => {
        if (emptyCells.length === 0) return undefined;
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    };

    const findBestMoveMediumOrHard = (emptyCells) => {
        for (const index of emptyCells) { board[index] = aiPlayer; if (checkWin(aiPlayer)) { board[index] = ''; return index; } board[index] = ''; }
        for (const index of emptyCells) { board[index] = humanPlayer; if (checkWin(humanPlayer)) { board[index] = ''; return index; } board[index] = ''; }
        if (board[4] === '') { return 4; }
        const corners = [0, 2, 6, 8];
        for (const corner of corners) { if (board[corner] === humanPlayer && board[8 - corner] === '') { return 8 - corner; } }
        const emptyCorners = corners.filter(i => board[i] === '');
        if (emptyCorners.length > 0) { return getRandomMove(emptyCorners); }
        const sides = [1, 3, 5, 7].filter(i => board[i] === '');
        if (sides.length > 0) { return getRandomMove(sides); }
        return getRandomMove(emptyCells);
    };

    const checkWin = (player) => {
        return winningConditions.some(condition => condition.every(index => board[index] === player));
    };


    // --- Difficulty Selection ---
    // (handleDifficultyChange - Remains unchanged)
    const handleDifficultyChange = (e) => {
        const selectedButton = e.target;
        currentDifficulty = selectedButton.id;
        difficultyButtons.forEach(button => button.classList.remove('active'));
        selectedButton.classList.add('active');
        resetGame();
    };


    // --- Event Listeners Setup ---
    // (Remain unchanged)
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    resetButton.addEventListener('click', resetGame);
    difficultyButtons.forEach(button => button.addEventListener('click', handleDifficultyChange));


    // --- Initial Setup ---
    // (Remain unchanged)
    setupMatrix(); // Start matrix animation
    resetGame(); // Initialize the game state
    document.querySelector(`#${currentDifficulty}`).classList.add('active');
    gameStatus.style.visibility = 'hidden';
});