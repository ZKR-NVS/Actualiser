document.addEventListener('DOMContentLoaded', () => {
    // Charger le thème immédiatement au démarrage
    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        const savedColors = JSON.parse(localStorage.getItem('customColors'));
        
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (savedColors) {
            document.documentElement.style.setProperty('--primary-color', savedColors.primary);
            document.documentElement.style.setProperty('--secondary-color', savedColors.secondary);
            document.documentElement.style.setProperty('--gradient', `linear-gradient(135deg, ${savedColors.primary}, ${savedColors.secondary})`);
        }
    }

    // Appliquer le thème immédiatement
    loadSavedTheme();

    // Gestion de l'état d'authentification
    function handleAuthStateChanged(user) {
        const authButtons = document.querySelector('.auth-buttons');
        const profileMenu = document.querySelector('.profile-menu');
        const profileLink = document.querySelector('.profile-link');
        const profileName = document.querySelector('.profile-name');
        const profilePic = document.querySelector('.profile-pic');
        const authModal = document.querySelector('.auth-modal');
        const adminBtn = document.getElementById('adminBtn');

        if (user) {
            // L'utilisateur est connecté
            if (authButtons) authButtons.style.display = 'none';
            if (profileMenu) {
                profileMenu.style.display = 'block';
                // Afficher les initiales
                const initials = (user.displayName || 'Mon Profil')
                    .split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                // Vérifier si nous sommes sur la page d'accueil
                const isHomePage = window.location.pathname === '/' || 
                                 window.location.pathname === '/index.html' ||
                                 window.location.pathname.endsWith('/index.html');

                if (profilePic) {
                    // Récupérer les couleurs personnalisées ou du thème
                    const savedColors = JSON.parse(localStorage.getItem('customColors'));
                    const savedTheme = localStorage.getItem('selectedTheme');
                    let bgColor;

                    if (savedColors) {
                        bgColor = savedColors.primary;
                    } else if (savedTheme) {
                        const root = document.documentElement;
                        const computedStyle = getComputedStyle(root);
                        bgColor = computedStyle.getPropertyValue('--primary-color').trim();
                    } else {
                        bgColor = '#4CAF50'; // Couleur par défaut
                    }

                    profilePic.textContent = initials;
                    profilePic.style.backgroundColor = bgColor;
                    profilePic.style.color = '#fff';
                    profilePic.style.display = 'flex';
                    profilePic.style.alignItems = 'center';
                    profilePic.style.justifyContent = 'center';
                    profilePic.style.transition = 'all 0.3s ease';
                }

                if (profileName) {
                    if (isHomePage) {
                        // Sur la page d'accueil, afficher seulement les deux premières lettres
                        const displayName = user.displayName || 'Mon Profil';
                        const initials = displayName
                            .split(' ')
                            .map(word => word[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);
                        profileName.textContent = initials;
                        profileName.style.display = 'block';
                    } else {
                        // Sur les autres pages, masquer le nom
                        profileName.style.display = 'none';
                    }
                }
            }
            if (authModal) authModal.classList.remove('active');

            // Stocker les informations de l'utilisateur
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userProfile', JSON.stringify({
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                uid: user.uid
            }));

            // Vérifier si l'utilisateur est admin et charger sa couleur personnalisée
            firebase.firestore().collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        if (doc.data().isAdmin && adminBtn) {
                            adminBtn.style.display = 'block';
                        }
                        // Mettre à jour la couleur de l'avatar si elle existe
                        if (doc.data().backgroundColor && profilePic) {
                            profilePic.style.backgroundColor = doc.data().backgroundColor;
                        }
                    }
                });

            // Mettre à jour le bouton de connexion
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-user"></i> Mon Profil';
                loginBtn.href = 'profile.html';
            }
        } else {
            // L'utilisateur n'est pas connecté
            if (authButtons) authButtons.style.display = 'flex';
            if (profileMenu) profileMenu.style.display = 'none';
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userProfile');

            // Cacher le bouton d'administration
            if (adminBtn) adminBtn.style.display = 'none';
            // Réinitialiser le bouton de connexion
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-user"></i> Connexion';
                loginBtn.href = '#';
            }
        }
    }

    // Initialiser Firebase Auth et écouter les changements d'état
    firebase.auth().onAuthStateChanged(handleAuthStateChanged);

    // Vérifier les éléments avant d'ajouter les écouteurs
    const loginBtn = document.querySelector('.login-btn');
    const authModal = document.querySelector('.auth-modal');
    const googleSignin = document.querySelector('.google-signin');
    const facebookSignin = document.querySelector('.facebook-signin');
    const profileMenu = document.querySelector('.profile-menu');
    const profileLink = document.querySelector('.profile-link');
    const adminBtn = document.getElementById('adminBtn');

    // Gestion du clic sur le bouton de connexion
    if (loginBtn && authModal) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Vérifier si l'utilisateur est déjà connecté
            const user = firebase.auth().currentUser;
            if (user) {
                // Si connecté, rediriger vers la page de profil
                window.location.href = 'profile.html';
            } else {
                // Si non connecté, afficher le modal de connexion
                authModal.classList.add('active');
            }
        });
    }

    // Gestion du clic sur le menu de profil
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Empêcher la propagation de l'événement
            // Vérifier si l'utilisateur est connecté
            const user = firebase.auth().currentUser;
            if (user) {
                // Si connecté, rediriger vers la page de profil
                window.location.href = 'profile.html';
            }
        });
    }

    // Gestion des connexions Google et Facebook
    if (googleSignin) {
        googleSignin.addEventListener('click', function(e) {
            e.preventDefault();
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    console.log('Google signin success', result.user);
                    window.location.href = 'profile.html';
                })
                .catch((error) => {
                    console.error('Google signin error:', error);
                });
        });
    }

    if (facebookSignin) {
        facebookSignin.addEventListener('click', function(e) {
            e.preventDefault();
            const provider = new firebase.auth.FacebookAuthProvider();
            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    console.log('Facebook signin success', result.user);
                    window.location.href = 'profile.html';
                })
                .catch((error) => {
                    console.error('Facebook signin error:', error);
                });
        });
    }

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

    // Gestion de la grille des actualités
    const articlesGrid = document.querySelector('.articles-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (articlesGrid && filterButtons) {
        // Filtrage des articles
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                
                // Mise à jour des boutons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filtrage des articles
                const articles = articlesGrid.querySelectorAll('.article-card');
                articles.forEach(article => {
                    if (filter === 'all' || article.dataset.category === filter) {
                        article.style.display = 'block';
                    } else {
                        article.style.display = 'none';
                    }
                });
            });
        });
    }

    // Animation du header lors du scroll
    const header = document.querySelector('.main-header');
    let lastScroll = 0;

    if (header) {
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
    }

    // Animation des compteurs
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = entry.target.querySelectorAll('.stat-number');
                    counters.forEach(counter => {
                        const target = parseInt(counter.dataset.target);
                        const duration = 2000;
                        const step = target / (duration / 16);
                        let current = 0;

                        const timer = setInterval(() => {
                            current += step;
                            if (current >= target) {
                                counter.textContent = target;
                                clearInterval(timer);
                            } else {
                                counter.textContent = Math.floor(current);
                            }
                        }, 16);
                    });
                    observer.unobserve(entry.target);
                }
            });
        });

        observer.observe(statsGrid);
    }

    // Smooth scroll pour le bouton "Découvrir"
    const heroScroll = document.querySelector('.hero-scroll');
    const introSection = document.querySelector('.intro-section');
    
    if (heroScroll && introSection) {
        heroScroll.addEventListener('click', () => {
            introSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Gestion du menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Fermer le menu mobile en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && navLinks.classList.contains('active') && 
                !navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // Fonction pour générer un lien sécurisé
    function generateSecureLink() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        return `${window.location.origin}/share/${timestamp}-${randomString}`;
    }

    const COMMENTS_LIMIT = 2; // Limite initiale de commentaires à afficher

    async function loadFactCheckArticles() {
        const CACHE_KEY = 'articles_cache';
        const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

        try {
            // Vérifier le cache dans sessionStorage
            const cachedData = sessionStorage.getItem(CACHE_KEY);
            if (cachedData) {
                const { timestamp, articles } = JSON.parse(cachedData);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return articles;
                }
            }

            // Si pas de cache ou cache expiré, charger les articles par défaut
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

            // Mettre en cache les articles dans sessionStorage
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                articles: defaultArticles
            }));

            return defaultArticles;
        } catch (error) {
            console.warn('Storage access denied:', error);
            // Retourner les articles par défaut sans mise en cache
            return [
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
        }
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
        const grid = document.querySelector('.news-grid');
        
        if (!grid) {
            console.log('La grille des actualités n\'existe pas dans le DOM');
            return;
        }
        
        // Vider la grille avant d'ajouter les nouveaux articles
        grid.innerHTML = '';
        
        displayArticles(articles);
    });

    // Smooth scroll pour les liens d'ancrage
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            // Ne rien faire si le href est juste "#"
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // News slider functionality
    const newsSlider = document.querySelector('.news-slider');
    if (newsSlider) {
        const prevBtn = newsSlider.querySelector('.prev-news');
        const nextBtn = newsSlider.querySelector('.next-news');
        const newsGrid = newsSlider.querySelector('.news-grid');
        const newsCards = newsGrid.querySelectorAll('.news-card');
        
        let currentIndex = 0;
        const cardsPerView = window.innerWidth > 992 ? 3 : window.innerWidth > 768 ? 2 : 1;
        
        const updateSlider = () => {
            const offset = -currentIndex * (100 / cardsPerView);
            newsGrid.style.transform = `translateX(${offset}%)`;
        };
        
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateSlider();
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (currentIndex < newsCards.length - cardsPerView) {
                    currentIndex++;
                    updateSlider();
                }
            });
        }
    }

    // Add active class to current section in navigation
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 60) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').slice(1) === current) {
                item.classList.add('active');
            }
        });
    });

    // Gestion du chargement des articles
    const loadMoreBtn = document.querySelector('.load-more');
    let isSecondRowVisible = false;

    // Clone de la première ligne d'articles
    const firstRowArticles = Array.from(articlesGrid.children).slice(0, 3);
    const secondRowArticles = firstRowArticles.map(article => {
        const clone = article.cloneNode(true);
        clone.style.display = 'none'; // Cache initialement les articles clonés
        return clone;
    });

    // Ajoute les articles clonés à la grille
    secondRowArticles.forEach(article => {
        articlesGrid.appendChild(article);
    });

    // Gestion du clic sur le bouton "Charger plus"
    loadMoreBtn.addEventListener('click', function() {
        const spinner = this.querySelector('i');
        
        // Active l'animation du spinner
        spinner.classList.add('fa-spin');
        
        // Simule un chargement
        setTimeout(() => {
            if (!isSecondRowVisible) {
                // Affiche la deuxième ligne d'articles
                secondRowArticles.forEach(article => {
                    article.style.display = 'block';
                    article.style.opacity = '0';
                    setTimeout(() => {
                        article.style.transition = 'opacity 0.5s ease';
                        article.style.opacity = '1';
                    }, 50);
                });
                isSecondRowVisible = true;
                
                // Cache le bouton après l'affichage
                loadMoreBtn.style.display = 'none';
            }
            
            // Désactive l'animation du spinner
            spinner.classList.remove('fa-spin');
        }, 800); // Délai de simulation du chargement
    });

    // Animation des étapes de la méthodologie
    const steps = document.querySelectorAll('.step');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const stepObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Désactiver l'observation une fois l'animation déclenchée
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    steps.forEach((step, index) => {
        // Ajouter un délai croissant pour chaque étape
        step.style.transitionDelay = `${index * 150}ms`;
        stepObserver.observe(step);
    });

    // Gestion du hover/touch sur mobile pour les étapes
    if ('ontouchstart' in window) {
        steps.forEach(step => {
            step.addEventListener('touchstart', () => {
                step.classList.add('touch-active');
            }, { passive: true });

            step.addEventListener('touchend', () => {
                step.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    // Animation des compteurs
    function animateCounter(element) {
        const target = parseInt(element.dataset.target);
        const duration = 1000; // Réduit à 1 seconde
        const frameDuration = 1000 / 60;
        const totalFrames = duration / frameDuration;
        const increment = target / totalFrames;
        let currentNumber = 0;

        function updateCounter() {
            currentNumber += increment;
            if (currentNumber >= target) {
                element.textContent = target.toLocaleString();
            } else {
                element.textContent = Math.floor(currentNumber).toLocaleString();
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // Observer pour les compteurs
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = entry.target.querySelectorAll('.stat-number');
                    counters.forEach(counter => {
                        if (!counter.classList.contains('animated')) {
                            counter.classList.add('animated');
                            animateCounter(counter);
                        }
                    });
                    observer.unobserve(entry.target); // Arrête d'observer une fois animé
                }
            });
        }, {
            threshold: 0.1, // Déclenche dès que 10% de la section est visible
            rootMargin: '50px' // Déclenche l'animation 50px avant que la section soit visible
        });

        observer.observe(statsSection);
    }

    // Initialiser les valeurs des compteurs
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        if (!stat.classList.contains('animated')) {
            stat.textContent = '0';
        }
    });

    // Éléments DOM
    const themeBtn = document.getElementById('themeBtn');
    const themePanel = document.getElementById('themePanel');
    const themeInfoModal = document.getElementById('themeInfoModal');
    const primaryColorPicker = document.getElementById('primaryColor');
    const secondaryColorPicker = document.getElementById('secondaryColor');
    const themeOptions = document.querySelectorAll('.theme-option');
    const applyThemeBtn = document.querySelector('.apply-theme-btn');

    // Définir les couleurs par défaut
    const defaultTheme = {
        primary: '#2c3e50',
        secondary: '#3498db'
    };

    // Fonction pour appliquer un thème
    function applyTheme(theme) {
        // Réinitialiser les attributs de thème personnalisé
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('customColors');

        // Appliquer le nouveau thème
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('selectedTheme', theme);

        // Mettre à jour les color pickers avec les couleurs du thème
        const computedStyle = getComputedStyle(document.documentElement);
        const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
        const secondaryColor = computedStyle.getPropertyValue('--secondary-color').trim();
        
        if (primaryColorPicker && secondaryColorPicker) {
            primaryColorPicker.value = primaryColor;
            secondaryColorPicker.value = secondaryColor;
        }

        // Mettre à jour l'interface
        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === theme) {
                option.classList.add('active');
            }
        });

        // Mettre à jour les avatars avec la nouvelle couleur primaire
        updateAvatarsColor(primaryColor);
    }

    // Fonction pour appliquer des couleurs personnalisées
    function applyCustomColors(primary, secondary) {
        // Réinitialiser le thème prédéfini
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('selectedTheme');

        // Appliquer les nouvelles couleurs
        document.documentElement.style.setProperty('--primary-color', primary);
        document.documentElement.style.setProperty('--secondary-color', secondary);
        document.documentElement.style.setProperty('--gradient', `linear-gradient(135deg, ${primary}, ${secondary})`);

        // Sauvegarder les couleurs personnalisées
        localStorage.setItem('customColors', JSON.stringify({
            primary: primary,
            secondary: secondary
        }));

        // Désélectionner tous les thèmes prédéfinis
        themeOptions.forEach(option => option.classList.remove('active'));

        // Mettre à jour les avatars avec la nouvelle couleur primaire
        updateAvatarsColor(primary);
    }

    // Fonction pour mettre à jour la couleur des avatars
    function updateAvatarsColor(color) {
        const user = firebase.auth().currentUser;
        if (user) {
            const avatars = document.querySelectorAll('.profile-avatar, .profile-pic');
            avatars.forEach(avatar => {
                avatar.style.backgroundColor = color;
                avatar.style.transition = 'all 0.3s ease';
            });

            // Mettre à jour la couleur dans Firestore
            firebase.firestore().collection('users').doc(user.uid).update({
                backgroundColor: color
            }).catch(error => console.error('Erreur lors de la mise à jour de la couleur:', error));
        }
    }

    // Gestion du bouton de thème
    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Vérifier si l'utilisateur est connecté
            const user = firebase.auth().currentUser;
            if (user) {
                // Utilisateur connecté : ouvrir le panneau de thème
                themePanel.classList.add('active');
            } else {
                // Utilisateur non connecté : afficher la popup d'information
                themeInfoModal.classList.add('active');
            }
        });
    }

    // Gestion de la popup d'information sur le thème
    if (themeInfoModal) {
        const closeThemeInfo = themeInfoModal.querySelector('.close-theme-info');
        const loginRedirect = themeInfoModal.querySelector('.login-redirect');
        const closeBtn = themeInfoModal.querySelector('.close-btn');

        // Fermer la popup avec le bouton "Plus tard"
        if (closeThemeInfo) {
            closeThemeInfo.addEventListener('click', () => {
                themeInfoModal.classList.remove('active');
            });
        }

        // Fermer la popup avec le bouton X
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                themeInfoModal.classList.remove('active');
            });
        }

        // Rediriger vers la connexion
        if (loginRedirect) {
            loginRedirect.addEventListener('click', () => {
                themeInfoModal.classList.remove('active');
                document.getElementById('authModal').classList.add('active');
            });
        }

        // Fermer la popup en cliquant en dehors
        themeInfoModal.addEventListener('click', (e) => {
            if (e.target === themeInfoModal) {
                themeInfoModal.classList.remove('active');
            }
        });
    }

    // Gestion du panneau de thème
    if (themePanel) {
        const closeThemeBtn = themePanel.querySelector('.close-theme-btn');
        if (closeThemeBtn) {
            closeThemeBtn.addEventListener('click', () => {
                themePanel.classList.remove('active');
            });
        }

        // Fermer le panneau en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (themePanel.classList.contains('active') && !themePanel.contains(e.target) && !themeBtn.contains(e.target)) {
                themePanel.classList.remove('active');
            }
        });

        // Gestion tactile pour mobile
        let touchStartX = 0;
        let touchEndX = 0;

        themePanel.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        themePanel.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX - touchStartX > 50) { // Glissement vers la droite
                themePanel.classList.remove('active');
            }
        }, { passive: true });
    }

    // Appliquer les thèmes prédéfinis
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.dataset.theme;
            applyTheme(theme);
        });
    });

    // Appliquer les couleurs personnalisées
    if (applyThemeBtn && primaryColorPicker && secondaryColorPicker) {
        applyThemeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            applyCustomColors(primaryColorPicker.value, secondaryColorPicker.value);
        });
    }

    // Charger le thème sauvegardé au chargement de la page
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Ne rien faire avec le thème ici, car il est déjà chargé au démarrage
            // Activer simplement l'interface de personnalisation si nécessaire
            const themeBtn = document.getElementById('themeBtn');
            if (themeBtn) {
                themeBtn.style.display = 'block';
            }
        } else {
            // Désactiver l'interface de personnalisation
            const themeBtn = document.getElementById('themeBtn');
            if (themeBtn) {
                themeBtn.style.display = 'none';
            }
        }
    });

    // Ajouter l'événement de clic sur le bouton d'administration
    if (adminBtn) {
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'admin.html';
        });
    }
});

// Fonction pour charger la version de démo
function loadDemoVersion(timestamp, key) {
    const urlParams = new URLSearchParams(window.location.search);
    const rotatingKey = urlParams.get('rotate');
    const isAdmin = urlParams.get('admin') === 'true';
    const demoAccesses = JSON.parse(localStorage.getItem('demoAccesses') || '[]');

    console.log('Debug - Paramètres reçus:', { timestamp, key, rotatingKey, isAdmin });
    console.log('Debug - Accès stockés:', demoAccesses);

    // Trouver l'accès correspondant
    const demoAccess = demoAccesses.find(access => {
        console.log('Debug - Comparaison:', {
            timestampMatch: access.timestamp.toString() === timestamp,
            keyMatch: access.key === key,
            rotatingKeyMatch: access.rotatingKey === rotatingKey,
            notExpired: access.expiration > Date.now(),
            isAdmin: access.isAdmin
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

        // Si c'est un accès admin et que nous sommes sur la page d'administration
        if (isAdmin && window.location.pathname.includes('admin.html')) {
            // Ajouter la bannière de démo pour l'admin
            addDemoBanner(hoursRemaining, minutesRemaining, true);
            return demoAccess.articles;
        }
        
        // Si c'est un accès admin mais que nous sommes sur la page principale
        if (isAdmin && !window.location.pathname.includes('admin.html')) {
            // Rediriger vers la page d'administration
            window.location.href = `admin.html?demo=${timestamp}&key=${key}&rotate=${rotatingKey}&admin=true`;
            return;
        }

        // Pour les accès non-admin, afficher la bannière normale
        addDemoBanner(hoursRemaining, minutesRemaining);
        
        // Charger les articles de la démo
        const grid = document.querySelector('.news-grid');
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

// Fonction pour vérifier si l'utilisateur est administrateur
function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

// Fonction pour générer un nombre aléatoire entre min et max
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fonction pour afficher les articles
function displayArticles(articles) {
    const ARTICLES_PER_PAGE = 6;
    const grid = document.querySelector('.news-grid');
    grid.innerHTML = '';

    // Ajouter la pagination
    let currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
    const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
    
    // Calculer les articles à afficher pour la page courante
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    const articlesToShow = articles.slice(startIndex, endIndex);

    let currentIndex = 0;
    while (currentIndex < articlesToShow.length) {
        // Créer une nouvelle rangée
        const row = document.createElement('div');
        row.className = 'news-row';

        // Décider aléatoirement du nombre de colonnes pour cette rangée
        const remainingArticles = articlesToShow.length - currentIndex;
        const maxColumns = Math.min(3, remainingArticles);
        const columnsInRow = getRandomInt(1, maxColumns);

        // Ajouter la classe appropriée pour le nombre de colonnes
        row.classList.add(
            columnsInRow === 1 ? 'one-column' :
            columnsInRow === 2 ? 'two-columns' : 'three-columns'
        );

        // Ajouter les articles à la rangée
        for (let i = 0; i < columnsInRow; i++) {
            const article = articlesToShow[currentIndex + i];
            const articleElement = document.createElement('article');
            articleElement.classList.add('news-card');
            if (isAdmin()) {
                articleElement.classList.add('admin-mode');
            }

            articleElement.innerHTML = `
                <div class="article-header">
                    <div class="status ${article.status.toLowerCase()}">${article.status}</div>
                    <div class="article-meta">
                        <span class="author"><i class="fas fa-user"></i> ${article.author}</span>
                        <span class="read-time"><i class="fas fa-clock"></i> ${article.readTime || '5 min'}</span>
                        <time><i class="fas fa-calendar"></i> ${new Date(article.date).toLocaleDateString()}</time>
                    </div>
                </div>
                <h3>${article.title}</h3>
                <p class="article-description">${article.description}</p>
                <div class="article-content">
                    ${article.fullContent || ''}
                </div>
                ${article.sources ? `
                    <div class="article-sources">
                        <h4><i class="fas fa-link"></i> Sources vérifiées</h4>
                        <ul>
                            ${article.sources.map(source => `<li>${source}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            `;

            if (isAdmin()) {
                articleElement.addEventListener('click', () => editArticle(article));
            }

            row.appendChild(articleElement);
        }

        grid.appendChild(row);
        currentIndex += columnsInRow;
    }

    // Ajouter la navigation de pagination
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    
    // Bouton précédent
    if (currentPage > 1) {
        const prevButton = document.createElement('a');
        prevButton.href = `?page=${currentPage - 1}`;
        prevButton.className = 'pagination-btn';
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> Précédent';
        paginationContainer.appendChild(prevButton);
    }

    // Pages numérotées
    for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = `?page=${i}`;
        pageLink.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageLink.textContent = i;
        paginationContainer.appendChild(pageLink);
    }

    // Bouton suivant
    if (currentPage < totalPages) {
        const nextButton = document.createElement('a');
        nextButton.href = `?page=${currentPage + 1}`;
        nextButton.className = 'pagination-btn';
        nextButton.innerHTML = 'Suivant <i class="fas fa-chevron-right"></i>';
        paginationContainer.appendChild(nextButton);
    }

    grid.parentNode.insertBefore(paginationContainer, grid.nextSibling);

    // Ajouter le bouton d'ajout d'article si admin
    if (isAdmin()) {
        const addButton = document.createElement('div');
        addButton.className = 'add-article-button visible';
        addButton.innerHTML = `
            <i class="fas fa-plus-circle"></i>
            <span>Ajouter un article</span>
        `;
        addButton.addEventListener('click', showAddArticleForm);
        grid.appendChild(addButton);
    }
}

// Fonction pour créer un élément article
function createArticleElement(article) {
    const articleElement = document.createElement('div');
    articleElement.className = 'news-card';
    if (isAdmin()) {
        articleElement.classList.add('admin-mode');
    }

    // Utiliser une image d'avatar locale par défaut
    const defaultAvatar = 'assets/images/default-avatar.svg';
    const authorAvatar = article.authorAvatar || defaultAvatar;

    articleElement.innerHTML = `
        <div class="article-header">
            <h3>${article.title}</h3>
            <span class="status ${article.status.toLowerCase()}">${article.status}</span>
        </div>
        <div class="article-meta">
            <span class="author">
                <img src="${authorAvatar}" 
                     alt="Avatar de ${article.author}"
                     class="author-avatar"
                     onerror="this.src='${defaultAvatar}'">
                <span>${article.author}</span>
            </span>
            <span><i class="far fa-calendar"></i> ${new Date(article.date).toLocaleDateString()}</span>
        </div>
        <div class="article-description">
            <p>${article.description}</p>
        </div>
    `;

    if (isAdmin()) {
        articleElement.addEventListener('click', () => editArticle(article));
    }

    return articleElement;
}

// Fonction pour afficher le formulaire d'ajout d'article
function showAddArticleForm() {
    const modal = document.createElement('div');
    modal.className = 'article-modal';
    modal.innerHTML = `
        <div class="article-form">
            <h3>Ajouter un article</h3>
            <form id="addArticleForm">
                <input type="text" name="title" placeholder="Titre de l'article" required>
                <textarea name="description" placeholder="Description" required></textarea>
                <select name="status" required>
                    <option value="VRAI">Vrai</option>
                    <option value="FAUX">Faux</option>
                    <option value="PARTIEL">Partiellement vrai</option>
                </select>
                <div class="form-buttons">
                    <button type="submit" class="btn btn-primary">Ajouter</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.article-modal').remove()">Annuler</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('addArticleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newArticle = {
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
            date: new Date().toISOString(),
            author: 'Admin'
        };

        // Ajouter l'article à la liste et rafraîchir l'affichage
        articles.unshift(newArticle);
        displayArticles(articles);
        modal.remove();
    });
}

// Fonction pour éditer un article
function editArticle(article) {
    const modal = document.createElement('div');
    modal.className = 'article-modal';
    modal.innerHTML = `
        <div class="article-form">
            <h3>Modifier l'article</h3>
            <form id="editArticleForm">
                <input type="text" name="title" value="${article.title}" required>
                <textarea name="description" required>${article.description}</textarea>
                <select name="status" required>
                    <option value="VRAI" ${article.status === 'VRAI' ? 'selected' : ''}>Vrai</option>
                    <option value="FAUX" ${article.status === 'FAUX' ? 'selected' : ''}>Faux</option>
                    <option value="PARTIEL" ${article.status === 'PARTIEL' ? 'selected' : ''}>Partiellement vrai</option>
                </select>
                <div class="form-buttons">
                    <button type="submit" class="btn btn-primary">Enregistrer</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.article-modal').remove()">Annuler</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('editArticleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Mettre à jour l'article
        article.title = formData.get('title');
        article.description = formData.get('description');
        article.status = formData.get('status');

        // Rafraîchir l'affichage
        displayArticles(articles);
        modal.remove();
    });
}

// Fonction pour ajouter la bannière de démo
function addDemoBanner(hours, minutes, isAdmin = false) {
    // Supprimer l'ancienne bannière si elle existe
    const existingBanner = document.querySelector('.demo-banner');
    if (existingBanner) {
        existingBanner.remove();
    }

    const banner = document.createElement('div');
    banner.className = 'demo-banner';
    banner.innerHTML = `
        <div class="demo-banner-content">
            <i class="fas fa-${isAdmin ? 'user-shield' : 'eye'}"></i>
            <span>Version de démonstration${isAdmin ? ' - Mode Administration' : ''}</span>
            <small>Cette version est en lecture seule et expire dans ${hours}h ${minutes}min</small>
            ${isAdmin ? '<small>Les modifications effectuées ne seront pas sauvegardées</small>' : ''}
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
}