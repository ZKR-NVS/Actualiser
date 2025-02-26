document.addEventListener('DOMContentLoaded', () => {
    const articleForm = document.getElementById('articleForm');
    const previewButton = document.getElementById('previewButton');
    const articlePreview = document.getElementById('articlePreview');
    const addSourceButton = document.getElementById('addSource');
    const sourcesList = document.getElementById('sourcesList');
    const publishedArticles = document.getElementById('publishedArticles');

    // Cacher l'aperçu par défaut
    if (articlePreview) {
        articlePreview.style.display = 'none';
    }

    // Charger les articles existants
    loadPublishedArticles();

    // Gérer l'ajout de sources
    addSourceButton.addEventListener('click', () => {
        const sourceItem = document.createElement('div');
        sourceItem.className = 'source-item';
        sourceItem.innerHTML = `
            <input type="text" placeholder="Nom de la source">
            <button type="button" class="btn-remove"><i class="fas fa-times"></i></button>
        `;
        sourcesList.appendChild(sourceItem);

        // Ajouter l'événement de suppression
        const removeButton = sourceItem.querySelector('.btn-remove');
        removeButton.addEventListener('click', () => sourceItem.remove());
    });

    // Gérer la prévisualisation
    previewButton.addEventListener('click', () => {
        if (articlePreview) {
            articlePreview.style.display = 'block';
            updatePreview();
        }
    });

    // Écouter les changements dans les champs pour mettre à jour l'aperçu
    ['title', 'description', 'content', 'author', 'status'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                if (articlePreview.style.display === 'block') {
                    updatePreview();
                }
            });
        }
    });

    // Gérer la soumission du formulaire
    articleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Récupérer les sources
        const sources = Array.from(document.querySelectorAll('#sourcesList input')).map(input => input.value.trim()).filter(Boolean);
        
        // Créer l'article
        const article = {
            id: Date.now(), // Utiliser timestamp comme ID temporaire
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            fullContent: document.getElementById('content').value,
            author: document.getElementById('author').value,
            date: new Date().toISOString().split('T')[0],
            status: document.getElementById('status').value,
            sources: sources,
            comments: []
        };

        // Sauvegarder l'article
        saveArticle(article);
        
        // Réinitialiser le formulaire
        articleForm.reset();
        sourcesList.innerHTML = `
            <div class="source-item">
                <input type="text" placeholder="Nom de la source">
                <button type="button" class="btn-remove"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        // Mettre à jour la liste des articles
        loadPublishedArticles();
        
        // Afficher une confirmation
        showNotification('Article publié avec succès !');
    });

    // Gérer l'éditeur riche
    const editorButtons = document.querySelectorAll('.editor-toolbar button');
    editorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const format = button.dataset.format;
            const textarea = document.getElementById('content');
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            
            let formattedText = '';
            switch(format) {
                case 'bold':
                    formattedText = `<strong>${selectedText}</strong>`;
                    break;
                case 'italic':
                    formattedText = `<em>${selectedText}</em>`;
                    break;
                case 'list':
                    formattedText = `\n<ul>\n  <li>${selectedText}</li>\n</ul>`;
                    break;
                case 'link':
                    const url = prompt('Entrez l\'URL :', 'https://');
                    if (url) {
                        formattedText = `<a href="${url}">${selectedText}</a>`;
                    }
                    break;
            }

            if (formattedText) {
                textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
                updatePreview();
            }
        });
    });

    // Mettre à jour l'aperçu initial
    updatePreview();

    // Gérer le bouton de génération de lien de démo
    const generateDemoButton = document.getElementById('generateDemoLink');
    if (generateDemoButton) {
        generateDemoButton.addEventListener('click', showDemoLink);
    }

    // Nettoyer les liens expirés au chargement
    cleanExpiredDemoLinks();
});

// Fonctions utilitaires
function updatePreview() {
    const preview = document.getElementById('articlePreview');
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const content = document.getElementById('content').value;
    const author = document.getElementById('author').value || 'Anonyme';
    const status = document.getElementById('status').value;
    const sources = Array.from(document.querySelectorAll('#sourcesList input')).map(input => input.value.trim()).filter(Boolean);

    const readTime = calculateReadTime(content);
    const formattedDate = formatDate(new Date());

    preview.innerHTML = `
        <div class="article-header">
            <div class="status ${status.toLowerCase()}">${status}</div>
            <div class="article-meta">
                <span class="author"><i class="fas fa-user"></i> ${author}</span>
                <span class="read-time"><i class="fas fa-clock"></i> ${readTime} min</span>
                <time><i class="fas fa-calendar"></i> ${formattedDate}</time>
            </div>
        </div>
        <h3>${title || 'Titre de l\'article'}</h3>
        <p class="article-description">${description || 'Description de l\'article'}</p>
        <div class="article-content">
            ${content || 'Contenu de l\'article'}
        </div>
        ${sources.length > 0 ? `
            <div class="article-sources">
                <h4><i class="fas fa-link"></i> Sources vérifiées</h4>
                <ul>
                    ${sources.map(source => `<li>${source}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

function saveArticle(article) {
    // Récupérer les articles existants
    let articles = JSON.parse(localStorage.getItem('articles') || '[]');
    
    // Calculer automatiquement le temps de lecture
    const readTime = calculateReadTime(article.fullContent);
    
    // Formater l'article avec les standards
    const formattedArticle = {
        ...article,
        readTime: `${readTime} min`,
        date: formatDate(new Date()),
        author: article.author || 'Anonyme'
    };
    
    // Ajouter le nouvel article
    articles.push(formattedArticle);
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('articles', JSON.stringify(articles));
}

function loadPublishedArticles() {
    const publishedArticles = document.getElementById('publishedArticles');
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');
    const articlesPerPage = 10; // Nombre d'articles par page
    let currentPage = parseInt(localStorage.getItem('currentPage') || '1');
    const totalPages = Math.ceil(articles.length / articlesPerPage);

    // Assurer que la page courante est valide
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    // Calculer les articles à afficher
    const start = (currentPage - 1) * articlesPerPage;
    const end = start + articlesPerPage;
    const displayedArticles = articles.slice(start, end);

    // Afficher les articles
    publishedArticles.innerHTML = articles.length ? `
        <div class="articles-list">
            ${displayedArticles.map(article => `
                <div class="article-list-item">
                    <div class="article-info">
                        <h3>${article.title}</h3>
                        <div class="article-meta-info">
                            <span><i class="fas fa-user"></i> ${article.author}</span>
                            <span><i class="fas fa-calendar"></i> ${article.date}</span>
                            <span class="status ${article.status.toLowerCase()}">${article.status}</span>
                        </div>
                    </div>
                    <div class="article-actions">
                        <button class="btn btn-secondary" onclick="editArticle(${article.id})">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn btn-primary" onclick="deleteArticle(${article.id})">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        ${totalPages > 1 ? `
            <div class="pagination">
                <button class="btn btn-secondary" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i> Précédent
                </button>
                <span>Page ${currentPage} sur ${totalPages}</span>
                <button class="btn btn-secondary" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
                    Suivant <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        ` : ''}
    ` : '<p>Aucun article publié</p>';
}

function deleteArticle(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
        let articles = JSON.parse(localStorage.getItem('articles') || '[]');
        articles = articles.filter(article => article.id !== id);
        localStorage.setItem('articles', JSON.stringify(articles));
        loadPublishedArticles();
        showNotification('Article supprimé avec succès !');
    }
}

function editArticle(id) {
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');
    const article = articles.find(a => a.id === id);
    
    if (article) {
        document.getElementById('title').value = article.title;
        document.getElementById('description').value = article.description;
        document.getElementById('content').value = article.fullContent;
        document.getElementById('author').value = article.author;
        document.getElementById('status').value = article.status;

        // Mettre à jour les sources
        sourcesList.innerHTML = article.sources.map(source => `
            <div class="source-item">
                <input type="text" value="${source}" placeholder="Nom de la source">
                <button type="button" class="btn-remove"><i class="fas fa-times"></i></button>
            </div>
        `).join('') || `
            <div class="source-item">
                <input type="text" placeholder="Nom de la source">
                <button type="button" class="btn-remove"><i class="fas fa-times"></i></button>
            </div>
        `;

        // Mettre à jour l'aperçu
        updatePreview();
        
        // Faire défiler jusqu'au formulaire
        document.querySelector('.admin-section').scrollIntoView({ behavior: 'smooth' });
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content ${type}">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Fonction pour calculer le temps de lecture
function calculateReadTime(content) {
    const wordsPerMinute = 200; // Vitesse moyenne de lecture
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
}

// Fonction pour formater la date
function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Ajouter la fonction de changement de page
function changePage(page) {
    localStorage.setItem('currentPage', page);
    loadPublishedArticles();
}

// Fonction pour générer une clé sécurisée
function generateSecureKey() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Fonction pour générer un lien unique et sécurisé
function generateUniqueLink() {
    const timestamp = Date.now();
    const secureKey = generateSecureKey();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24); // Expire dans 24h

    // Sauvegarder les informations de sécurité
    const demoAccess = {
        key: secureKey,
        timestamp: timestamp,
        expiration: expirationDate.getTime(),
        articles: JSON.parse(localStorage.getItem('articles') || '[]')
    };

    // Stocker les informations d'accès
    const demoAccesses = JSON.parse(localStorage.getItem('demoAccesses') || '[]');
    demoAccesses.push(demoAccess);
    localStorage.setItem('demoAccesses', JSON.stringify(demoAccesses));

    // Utiliser le domaine actuel ou HTTPS par défaut
    const baseUrl = window.location.protocol === 'file:' ? 
        'https://votre-nom-utilisateur.github.io/votre-repo' : // À remplacer avec votre URL GitHub Pages
        window.location.origin;
    
    return `${baseUrl}/index.html?demo=${timestamp}&key=${secureKey}`;
}

// Fonction pour afficher le modal avec le lien
function showDemoLink() {
    const demoLink = generateUniqueLink();
    
    // Créer le modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'demo-modal';
    modal.innerHTML = `
        <h3><i class="fas fa-share-alt"></i> Lien de démonstration sécurisé</h3>
        <p>Partagez ce lien sécurisé avec votre client pour qu'il puisse tester le site :</p>
        <div class="demo-link-container">
            <code class="demo-link">${demoLink}</code>
        </div>
        <div class="demo-info">
            <p><i class="fas fa-shield-alt"></i> <strong>Sécurité :</strong></p>
            <ul>
                <li>Lien unique et sécurisé</li>
                <li>Expire dans 24 heures</li>
                <li>Version figée des articles actuels</li>
            </ul>
        </div>
        <div class="demo-modal-actions">
            <button class="copy-button" onclick="copyDemoLink('${demoLink}')">
                <i class="fas fa-copy"></i> Copier le lien
            </button>
            <button class="btn btn-secondary" onclick="closeModal(this)">
                <i class="fas fa-times"></i> Fermer
            </button>
        </div>
    `;
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // Fermer le modal en cliquant sur l'overlay
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal(modalOverlay);
        }
    });
}

// Fonction pour copier le lien
function copyDemoLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Lien copié dans le presse-papiers !');
    }).catch(() => {
        showNotification('Erreur lors de la copie du lien', 'error');
    });
}

// Fonction pour fermer le modal
function closeModal(element) {
    const modal = element.closest('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Fonction pour nettoyer les liens expirés
function cleanExpiredDemoLinks() {
    const now = Date.now();
    const demoAccesses = JSON.parse(localStorage.getItem('demoAccesses') || '[]');
    const validAccesses = demoAccesses.filter(access => access.expiration > now);
    localStorage.setItem('demoAccesses', JSON.stringify(validAccesses));
} 