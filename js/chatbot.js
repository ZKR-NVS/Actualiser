class Chatbot {
    constructor() {
        this.chatButton = document.querySelector('.chat-button');
        this.chatWindow = document.querySelector('.chat-window');
        this.closeButton = document.querySelector('.close-chat');
        this.sendButton = document.querySelector('.send-message');
        this.input = document.querySelector('.chat-input input');
        this.messagesContainer = document.querySelector('.chat-messages');

        this.initializeEventListeners();
        this.botResponses = {
            greeting: [
                "Bonjour ! Comment puis-je vous aider ?",
                "Bienvenue sur Actualiter ! Que souhaitez-vous savoir ?"
            ],
            default: [
                "Je suis désolé, je ne peux pas répondre à cette question pour le moment. Voulez-vous être mis en relation avec notre équipe ?",
                "Cette question est intéressante. Laissez-moi chercher la réponse la plus précise possible."
            ]
        };
    }

    initializeEventListeners() {
        // Ouvrir/Fermer le chat
        this.chatButton.addEventListener('click', () => this.toggleChat());
        this.closeButton.addEventListener('click', () => this.toggleChat());

        // Envoyer un message
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        const isHidden = this.chatWindow.style.display === 'none';
        this.chatWindow.style.display = isHidden ? 'flex' : 'none';
        
        if (isHidden) {
            this.addMessage("bot", this.getRandomResponse('greeting'));
        }
    }

    sendMessage() {
        const message = this.input.value.trim();
        if (message) {
            this.addMessage("user", message);
            this.input.value = '';
            
            // Simuler une réponse du bot après un court délai
            setTimeout(() => {
                this.addMessage("bot", this.getRandomResponse('default'));
            }, 1000);
        }
    }

    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        
        const content = document.createElement('p');
        content.textContent = text;
        messageDiv.appendChild(content);
        
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    getRandomResponse(type) {
        const responses = this.botResponses[type];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Initialiser le chatbot quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new Chatbot();
}); 