let score1 = parseInt(localStorage.getItem('score1')) || 0;
let score2 = parseInt(localStorage.getItem('score2')) || 0;
let team1Name = localStorage.getItem('team1Name') || 'Team 1';
let team2Name = localStorage.getItem('team2Name') || 'Team 2';

const score1Display = document.getElementById('score1');
const score2Display = document.getElementById('score2');
const team1Input = document.getElementById('team1-name');
const team2Input = document.getElementById('team2-name');
const winMessage = document.getElementById('win-message');
const winnerText = document.getElementById('winner-text');
const resetBtn = document.getElementById('reset-btn');

// Initialize
function init() {
    score1Display.textContent = score1;
    score2Display.textContent = score2;
    team1Input.value = team1Name;
    team2Input.value = team2Name;
    checkWin();
}

init();

// Update names in storage
team1Input.addEventListener('input', (e) => {
    team1Name = e.target.value;
    localStorage.setItem('team1Name', team1Name);
});

team2Input.addEventListener('input', (e) => {
    team2Name = e.target.value;
    localStorage.setItem('team2Name', team2Name);
});

function addPoints(points, teamNum) {
    if (teamNum === 1) {
        score1 += points;
        score1Display.textContent = score1;
        localStorage.setItem('score1', score1);
    } else {
        score2 += points;
        score2Display.textContent = score2;
        localStorage.setItem('score2', score2);
    }
    checkWin();
}

function checkWin() {
    const targetScore = 13;
    if (score1 >= targetScore || score2 >= targetScore) {
        winMessage.classList.remove('hidden');
        if (score1 >= targetScore) {
            winnerText.textContent = `${team1Name} Wins!`;
        } else {
            winnerText.textContent = `${team2Name} Wins!`;
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
    
    // Keep names
    team1Input.value = team1Name;
    team2Input.value = team2Name;
}

resetBtn.addEventListener('click', resetGame);
