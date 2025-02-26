document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si c'est un accès via un lien de démo
    const urlParams = new URLSearchParams(window.location.search);
    const demoTimestamp = urlParams.get('demo');
    const demoKey = urlParams.get('key');

    if (demoTimestamp && demoKey) {
        // Charger la version de démo
        loadDemoVersion(demoTimestamp, demoKey);
    } else {
        // Charger la version normale
        loadFactCheckArticles();
    }

    // Animation du header lors du scroll
    const header = document.querySelector('.main-header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }

        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });

    // Fonction pour générer un lien sécurisé
    function generateSecureLink() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        return `${window.location.origin}/share/${timestamp}-${randomString}`;
    }

    const COMMENTS_LIMIT = 2; // Limite initiale de commentaires à afficher

    async function loadFactCheckArticles() {
        // Charger les articles depuis le localStorage
        const articles = JSON.parse(localStorage.getItem('articles') || '[]');
        
        // Si aucun article n'existe, utiliser les articles par défaut
        if (articles.length === 0) {
            const defaultArticles = [
                {
                    id: 1,
                    title: "Vérification : Les affirmations sur le changement climatique",
                    description: "Analyse détaillée des dernières déclarations sur le réchauffement climatique et leurs impacts sur l'environnement.",
                    fullContent: `
                        <p>Après une analyse approfondie des données scientifiques récentes et la consultation d'experts en climatologie, nous pouvons confirmer que les changements observés sont bien réels.</p>
                        <h4>Points clés vérifiés :</h4>
                        <ul>
                            <li>Augmentation des températures moyennes</li>
                            <li>Fonte des glaciers</li>
                            <li>Élévation du niveau des mers</li>
                        </ul>
                        <p>Sources : GIEC, NASA, Météo France</p>
                    `,
                    date: "2024-02-26",
                    author: "Dr. Martin Laurent",
                    readTime: "5 min",
                    status: "VRAI",
                    sources: ["GIEC", "NASA", "Météo France"],
                    comments: [
                        { author: "Marie", date: "2024-02-26", content: "Excellent article, très bien documenté !" },
                        { author: "Pierre", date: "2024-02-26", content: "Merci pour ces précisions." }
                    ]
                },
                {
                    id: 2,
                    title: "Fact-check : Les rumeurs sur la santé publique",
                    description: "Analyse rigoureuse des dernières affirmations circulant sur les réseaux sociaux concernant la santé publique.",
                    fullContent: `
                        <p>Notre équipe a examiné en détail les récentes affirmations virales concernant la santé publique. Voici nos conclusions basées sur les données médicales actuelles.</p>
                        <h4>Éléments analysés :</h4>
                        <ul>
                            <li>Origine des informations</li>
                            <li>Validation par des experts médicaux</li>
                            <li>Comparaison avec les études scientifiques</li>
                        </ul>
                        <p>Sources : OMS, Institut Pasteur, Haute Autorité de Santé</p>
                    `,
                    date: "2024-02-25",
                    author: "Dr. Sophie Dubois",
                    readTime: "4 min",
                    status: "FAUX",
                    sources: ["OMS", "Institut Pasteur", "HAS"],
                    comments: [
                        { author: "Sophie", date: "2024-02-25", content: "Ces informations m'ont beaucoup aidé à comprendre la situation." }
                    ]
                }
            ];
            localStorage.setItem('articles', JSON.stringify(defaultArticles));
            return defaultArticles;
        }

        return articles;
    }

    function handleCommentSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const articleId = form.dataset.articleId;
        const textarea = form.querySelector('textarea');
        const comment = textarea.value.trim();

        if (comment) {
            const commentsContainer = form.previousElementSibling.previousElementSibling;
            const newComment = document.createElement('div');
            newComment.classList.add('comment');
            newComment.innerHTML = `
                <div class="comment-header">
                    <span class="author"><i class="fas fa-user-circle"></i> Vous</span>
                    <time><i class="fas fa-clock"></i> ${new Date().toLocaleDateString()}</time>
                </div>
                <p>${comment}</p>
            `;
            
            // Ajouter le nouveau commentaire au début
            if (commentsContainer.firstChild) {
                commentsContainer.insertBefore(newComment, commentsContainer.firstChild);
            } else {
                commentsContainer.appendChild(newComment);
            }
            
            textarea.value = '';

            // Mettre à jour le compteur de caractères
            const charCount = form.querySelector('.char-count');
            charCount.textContent = '250 caractères restants';

            // Mettre à jour le compteur de commentaires
            const countElement = form.parentElement.querySelector('h4');
            const currentCount = parseInt(countElement.textContent.match(/\d+/)[0]);
            countElement.textContent = `Commentaires (${currentCount + 1})`;
        }
    }

    // Gérer le formulaire de newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            alert(`Merci de votre inscription ! Un email de confirmation a été envoyé à ${email}`);
            newsletterForm.reset();
        });
    }

    // Charger les articles au chargement de la page
    loadFactCheckArticles().then(articles => {
        const grid = document.querySelector('.fact-check-grid');
        
        articles.forEach(article => {
            const articleElement = document.createElement('article');
            articleElement.classList.add('fact-check-card');
            
            const visibleComments = article.comments.slice(0, COMMENTS_LIMIT);
            const hasMoreComments = article.comments.length > COMMENTS_LIMIT;
            
            articleElement.innerHTML = `
                <div class="article-header">
                    <div class="status ${article.status.toLowerCase()}">${article.status}</div>
                    <div class="article-meta">
                        <span class="author"><i class="fas fa-user"></i> ${article.author}</span>
                        <span class="read-time"><i class="fas fa-clock"></i> ${article.readTime}</span>
                        <time><i class="fas fa-calendar"></i> ${article.date}</time>
                    </div>
                </div>
                <h3>${article.title}</h3>
                <p class="article-description">${article.description}</p>
                <div class="article-content">
                    ${article.fullContent}
                </div>
                <div class="article-sources">
                    <h4><i class="fas fa-link"></i> Sources vérifiées</h4>
                    <ul>
                        ${article.sources.map(source => `<li>${source}</li>`).join('')}
                    </ul>
                </div>
                <div class="comments-section">
                    <h4><i class="fas fa-comments"></i> Commentaires (${article.comments.length})</h4>
                    <div class="comments-container">
                        ${visibleComments.map(comment => `
                            <div class="comment">
                                <div class="comment-header">
                                    <span class="author"><i class="fas fa-user-circle"></i> ${comment.author}</span>
                                    <time><i class="fas fa-clock"></i> ${comment.date}</time>
                                </div>
                                <p>${comment.content}</p>
                            </div>
                        `).join('')}
                    </div>
                    ${hasMoreComments ? `
                        <div class="comments-toggle">
                            <button class="btn btn-text" data-action="show-more">
                                <i class="fas fa-chevron-down"></i> Voir ${article.comments.length - COMMENTS_LIMIT} commentaires de plus
                            </button>
                        </div>
                    ` : ''}
                    <form class="comment-form" data-article-id="${article.id}">
                        <textarea placeholder="Partagez votre avis..." required maxlength="250"></textarea>
                        <div class="form-footer">
                            <span class="char-count">250 caractères restants</span>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> Commenter
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            grid.appendChild(articleElement);

            // Gérer le bouton "Voir plus"
            if (hasMoreComments) {
                const toggleButton = articleElement.querySelector('.comments-toggle button');
                const commentsContainer = articleElement.querySelector('.comments-container');
                
                toggleButton.addEventListener('click', () => {
                    const isShowingMore = toggleButton.dataset.action === 'show-less';
                    const commentsToShow = isShowingMore ? 
                        article.comments.slice(0, COMMENTS_LIMIT) : 
                        article.comments;

                    commentsContainer.innerHTML = commentsToShow.map(comment => `
                        <div class="comment">
                            <div class="comment-header">
                                <span class="author"><i class="fas fa-user-circle"></i> ${comment.author}</span>
                                <time><i class="fas fa-clock"></i> ${comment.date}</time>
                            </div>
                            <p>${comment.content}</p>
                        </div>
                    `).join('');

                    toggleButton.textContent = isShowingMore ? 
                        `<i class="fas fa-chevron-up"></i> Voir moins` : 
                        `<i class="fas fa-chevron-down"></i> Voir ${article.comments.length - COMMENTS_LIMIT} commentaires de plus`;
                    toggleButton.dataset.action = isShowingMore ? 'show-less' : 'show-more';
                });
            }

            // Gérer le compteur de caractères
            const textarea = articleElement.querySelector('textarea');
            const charCount = articleElement.querySelector('.char-count');
            
            textarea.addEventListener('input', () => {
                const remaining = 250 - textarea.value.length;
                charCount.textContent = `${remaining} caractères restants`;
            });

            // Ajouter l'écouteur d'événements pour le formulaire de commentaire
            const form = articleElement.querySelector('.comment-form');
            form.addEventListener('submit', handleCommentSubmit);
        });
    });

    // Smooth scroll pour les liens d'ancrage
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Fonction pour charger la version de démo
function loadDemoVersion(timestamp, key) {
    const urlParams = new URLSearchParams(window.location.search);
    const rotatingKey = urlParams.get('rotate');
    const demoAccesses = JSON.parse(localStorage.getItem('demoAccesses') || '[]');
    const currentDailySalt = Math.floor(Date.now() / (24 * 60 * 60 * 1000));

    console.log('Debug - Paramètres reçus:', { timestamp, key, rotatingKey });
    console.log('Debug - Accès stockés:', demoAccesses);

    // Trouver l'accès correspondant
    const demoAccess = demoAccesses.find(access => {
        console.log('Debug - Comparaison:', {
            timestampMatch: access.timestamp.toString() === timestamp,
            keyMatch: access.key === key,
            rotatingKeyMatch: access.rotatingKey === rotatingKey,
            notExpired: access.expiration > Date.now()
        });
        
        return access.timestamp.toString() === timestamp && 
               access.key === key &&
               access.rotatingKey === rotatingKey &&
               access.expiration > Date.now();
    });

    if (demoAccess) {
        // Calculer le temps restant
        const timeRemaining = demoAccess.expiration - Date.now();
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

        console.log('Debug - Temps restant:', { hoursRemaining, minutesRemaining });

        // Ajouter la bannière avec le temps restant exact
        addDemoBanner(hoursRemaining, minutesRemaining);
        
        // Charger les articles de la démo
        const grid = document.querySelector('.fact-check-grid');
        if (grid) {
            displayArticles(demoAccess.articles);
        }
        return demoAccess.articles;
    } else {
        console.log('Debug - Accès non trouvé ou expiré');
        showDemoExpiredMessage();
        return [];
    }
}

// Fonction pour afficher les articles
function displayArticles(articles) {
    const grid = document.querySelector('.fact-check-grid');
    if (!grid) return;

    grid.innerHTML = ''; // Nettoyer la grille existante
    
    articles.forEach(article => {
        const articleElement = document.createElement('article');
        articleElement.classList.add('fact-check-card');
        
        const visibleComments = article.comments.slice(0, COMMENTS_LIMIT);
        const hasMoreComments = article.comments.length > COMMENTS_LIMIT;
        
        articleElement.innerHTML = `
            <div class="article-header">
                <div class="status ${article.status.toLowerCase()}">${article.status}</div>
                <div class="article-meta">
                    <span class="author"><i class="fas fa-user"></i> ${article.author}</span>
                    <span class="read-time"><i class="fas fa-clock"></i> ${article.readTime}</span>
                    <time><i class="fas fa-calendar"></i> ${article.date}</time>
                </div>
            </div>
            <h3>${article.title}</h3>
            <p class="article-description">${article.description}</p>
            <div class="article-content">
                ${article.fullContent}
            </div>
            <div class="article-sources">
                <h4><i class="fas fa-link"></i> Sources vérifiées</h4>
                <ul>
                    ${article.sources.map(source => `<li>${source}</li>`).join('')}
                </ul>
            </div>
        `;
        
        grid.appendChild(articleElement);
    });
}

// Fonction pour ajouter la bannière de démo
function addDemoBanner(hours, minutes) {
    // Supprimer l'ancienne bannière si elle existe
    const existingBanner = document.querySelector('.demo-banner');
    if (existingBanner) {
        existingBanner.remove();
    }

    const banner = document.createElement('div');
    banner.className = 'demo-banner';
    banner.innerHTML = `
        <div class="demo-banner-content">
            <i class="fas fa-eye"></i>
            <span>Version de démonstration</span>
            <small>Cette version est en lecture seule et expire dans ${hours}h ${minutes}min</small>
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    document.body.classList.add('has-demo-banner');
}

// Fonction pour afficher le message d'expiration
function showDemoExpiredMessage() {
    const main = document.querySelector('main');
    if (main) {
        main.innerHTML = `
            <div class="demo-expired">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Lien de démonstration expiré ou invalide</h2>
                <p>Ce lien de démonstration n'est plus valide. Veuillez demander un nouveau lien à l'administrateur.</p>
                <a href="index.html" class="btn btn-primary">
                    <i class="fas fa-home"></i> Retour à l'accueil
                </a>
            </div>
        `;
    }
} 