// Mentor Data & Rendering
const mentorsData = [
    {
        id: 1, name: "Alex Rivera", initials: "AR", rating: 4.9, sessions: 124, category: "technology",
        skillsHave: ["React.js", "Node.js"], skillsWant: ["UI/UX Design"]
    },
    {
        id: 2, name: "Sarah Chen", initials: "SC", rating: 5.0, sessions: 89, category: "creative",
        skillsHave: ["Figma", "Graphic Design"], skillsWant: ["English Speaking"]
    },
    {
        id: 3, name: "David Kim", initials: "DK", rating: 4.8, sessions: 56, category: "languages",
        skillsHave: ["Korean", "English IELTS"], skillsWant: ["Python"]
    },
    {
        id: 4, name: "Emily Watson", initials: "EW", rating: 4.7, sessions: 42, category: "academic",
        skillsHave: ["Statistics", "Calculus"], skillsWant: ["Data Science"]
    }
];

function renderMentors(category = 'all') {
    const grid = document.getElementById('mentors-grid');
    if (!grid) return;
    
    grid.innerHTML = ''; 
    const filtered = category === 'all' ? mentorsData : mentorsData.filter(m => m.category === category);

    filtered.forEach(mentor => {
        const skillsHaveHtml = mentor.skillsHave.map(s => `<span class="tag tag-emerald">${s}</span>`).join('');
        const skillsWantHtml = mentor.skillsWant.map(s => `<span class="tag tag-violet">${s}</span>`).join('');

        const card = document.createElement('div');
        card.className = 'mentor-card glass-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="mentor-info">
                    <div class="avatar-sm">${mentor.initials}</div>
                    <div>
                        <h4>${mentor.name}</h4>
                        <div class="rating"><i data-lucide="star"></i> ${mentor.rating} (${mentor.sessions} sessions)</div>
                    </div>
                </div>
                <div class="rate-badge">50 <i data-lucide="coins"></i></div>
            </div>
            
            <div class="card-body">
                <div class="skill-group"><span class="label">Teaches:</span><div class="tags">${skillsHaveHtml}</div></div>
                <div class="skill-group mt-3"><span class="label">Wants to learn:</span><div class="tags">${skillsWantHtml}</div></div>
            </div>
            
            <div class="card-footer">
                <button class="btn btn-primary w-full justify-center" onclick="openBookingModal('${mentor.name}')">Book Session</button>
            </div>
        `;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

function openBookingModal(mentorName) {
    const nameEl = document.getElementById('modal-mentor-name');
    if (nameEl) nameEl.innerText = mentorName;
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    renderMentors();
    
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderMentors(e.target.dataset.category);
        });
    });

    // Modals
    const bookingModal = document.getElementById('booking-modal');
    const closeBtns = document.querySelectorAll('.close-modal');
    closeBtns.forEach(btn => btn.addEventListener('click', () => bookingModal.classList.remove('active')));

    const confirmBtn = document.getElementById('confirm-booking-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            window.location.href = 'sessions.html';
        });
    }
});
