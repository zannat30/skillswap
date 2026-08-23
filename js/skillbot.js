document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const text = chatInput.value.trim();
            if (!text) return;
            
            // Add User Message
            const userHtml = `
                <div class="message msg-user">
                    <div class="msg-avatar user-avatar">Z</div>
                    <div class="msg-bubble">${escapeHtml(text)}</div>
                </div>
            `;
            chatMessages.insertAdjacentHTML('beforeend', userHtml);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Simulate AI Response (Gemini mock)
            setTimeout(() => {
                const botHtml = `
                    <div class="message msg-bot">
                        <div class="msg-avatar bot-avatar"><i data-lucide="sparkles" style="width: 20px; height: 20px"></i></div>
                        <div class="msg-bubble">
                            <p class="mb-2">Based on your question about <strong>${escapeHtml(text)}</strong>, here is a suggested learning roadmap:</p>
                            <ol style="margin-left: 20px; color: var(--accent-cyan)">
                                <li>Understand the core fundamentals.</li>
                                <li>Build a small practical project.</li>
                                <li>Book a session with a mentor on our marketplace to review your code!</li>
                            </ol>
                        </div>
                    </div>
                `;
                chatMessages.insertAdjacentHTML('beforeend', botHtml);
                lucide.createIcons();
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1000);
        });
    }
});

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
