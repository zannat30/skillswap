document.addEventListener('DOMContentLoaded', () => {
    // End Session Modal
    const feedbackModal = document.getElementById('feedback-modal');
    const endSessionBtn = document.getElementById('end-session-btn');
    
    if (endSessionBtn && feedbackModal) {
        endSessionBtn.addEventListener('click', () => {
            feedbackModal.classList.add('active');
            if (timerInterval) clearInterval(timerInterval);
        });
    }

    startSessionTimer();
});

let timerInterval;
function startSessionTimer() {
    let timeLeft = 3600;
    const timerDisplay = document.getElementById('session-timer');
    if (!timerDisplay) return;
    
    timerDisplay.innerText = "60:00";
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.innerText = "00:00";
            return;
        }
        
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        timerDisplay.innerText = `${m}:${s}`;
    }, 1000);
}
