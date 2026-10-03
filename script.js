let score1 = parseInt(localStorage.getItem('score1')) || 0;
let score2 = parseInt(localStorage.getItem('score2')) || 0;

const score1Display = document.getElementById('score1');
const score2Display = document.getElementById('score2');
const resetBtn = document.getElementById('reset-btn');
const winMessage = document.getElementById('win-message');
const winnerText = document.getElementById('winner-text');

// Initialize
function init() {
    score1Display.textContent = score1;
    score2Display.textContent = score2;
    checkWin();
}

init();

function animateScoreUpdate(display, newValue, isIncreasing) {
    // Move element up when increasing, down when decreasing
    if (isIncreasing) {
        display.classList.add('move-up');
    } else {
        display.classList.add('move-down');
    }
    setTimeout(() => {
        display.textContent = newValue;
        display.classList.remove(isIncreasing ? 'move-up' : 'move-down');
    }, 150);
}

function changeScore(teamNum, amount) {
    const isIncreasing = amount > 0;
    if (teamNum === 1) {
        score1 += amount;
        if (score1 < 0) score1 = 0; // Prevent negative scores
        animateScoreUpdate(score1Display, score1, isIncreasing);
        localStorage.setItem('score1', score1);
    } else {
        score2 += amount;
        if (score2 < 0) score2 = 0;
        animateScoreUpdate(score2Display, score2, isIncreasing);
        localStorage.setItem('score2', score2);
    }
    checkWin();
}

function checkWin() {
    const targetScore = 13;
    if (score1 >= targetScore || score2 >= targetScore) {
        winMessage.classList.remove('hidden');
        if (score1 >= targetScore) {
            winnerText.textContent = "Team 1 Wins!";
        } else {
            winnerText.textContent = "Team 2 Wins!";
        }
    }
}

function resetGame() {
    score1 = 0;
    score2 = 0;
    localStorage.setItem('score1', '0');
    localStorage.setItem('score2', '0');
    
    score1Display.textContent = score1;
    score2Display.textContent = score2;
    
    winMessage.classList.add('hidden');
}

resetBtn.addEventListener('click', resetGame);