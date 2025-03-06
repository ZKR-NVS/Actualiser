// Import Firestore methods
import { doc, getDoc, collection, getDocs, query, where, orderBy, updateDoc, deleteDoc, writeBatch, addDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

// Appliquer le thème sauvegardé au chargement
const savedTheme = localStorage.getItem('selectedTheme');
const savedColors = JSON.parse(localStorage.getItem('customColors'));

if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
} else if (savedColors) {
    document.documentElement.style.setProperty('--primary-color', savedColors.primary);
    document.documentElement.style.setProperty('--secondary-color', savedColors.secondary);
    document.documentElement.style.setProperty('--gradient', `linear-gradient(135deg, ${savedColors.primary}, ${savedColors.secondary})`);
}

// Constantes pour les limites des articles
const ARTICLE_LIMITS = {
    TITLE_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 200,
    CONTENT_MAX_LENGTH: 5000,
    MIN_CONTENT_LENGTH: 100,
    MAX_SOURCES: 5,
    IMAGE_MAX_SIZE: 5 * 1024 * 1024 // 5MB
};

// Fonction pour mettre à jour les avatars
function updateAvatars(displayName, backgroundColor) {
    const initials = (displayName || 'Mon Profil')
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const avatars = document.querySelectorAll('.profile-pic');
    avatars.forEach(avatar => {
        avatar.textContent = initials;
        avatar.style.backgroundColor = backgroundColor;
        avatar.style.color = '#fff';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.transition = 'all 0.3s ease';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const articleForm = document.getElementById('articleForm');
    const previewButton = document.getElementById('previewButton');
    const articlePreview = document.getElementById('articlePreview');
    const addSourceButton = document.getElementById('addSource');
    const sourcesList = document.getElementById('sourcesList');
    const publishedArticles = document.getElementById('publishedArticles');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const themeBtn = document.getElementById('themeBtn');
    const themePanel = document.getElementById('themePanel');
    const themeOptions = document.querySelectorAll('.theme-option');
    const primaryColorPicker = document.getElementById('primaryColor');
    const secondaryColorPicker = document.getElementById('secondaryColor');
    const applyThemeBtn = document.querySelector('.apply-theme-btn');
    const articleImage = document.getElementById('articleImage');
    const previewImg = document.getElementById('previewImg');
    console.log('Menu mobile:', { mobileMenuBtn, navLinks }); // Debug log

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
    articleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
        // Récupérer les sources
            const sources = Array.from(document.querySelectorAll('#sourcesList input'))
                .map(input => input.value.trim())
                .filter(Boolean);
        
        // Créer l'article
        const article = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            fullContent: document.getElementById('content').value,
            author: document.getElementById('author').value,
            status: document.getElementById('status').value,
                sources: sources
        };

        // Sauvegarder l'article
            await saveArticle(article);
        
        // Réinitialiser le formulaire
        articleForm.reset();
        sourcesList.innerHTML = `
            <div class="source-item">
                <input type="text" placeholder="Nom de la source">
                <button type="button" class="btn-remove"><i class="fas fa-times"></i></button>
            </div>
        `;
        
            // Cacher l'aperçu
            if (articlePreview) {
                articlePreview.style.display = 'none';
            }
            
            // Réinitialiser l'image
            const previewImg = document.getElementById('previewImg');
            if (previewImg) {
                previewImg.src = 'assets/default-image.svg';
            }
        
        // Afficher une confirmation
            showNotification('Article publié avec succès !', 'success');
            
            // Mettre à jour la liste des articles
            await loadPublishedArticles();
            
        } catch (error) {
            console.error('Erreur lors de la publication:', error);
            showNotification(error.message, 'error');
        }
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

    // Vérifier si l'utilisateur est admin
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;
    
    auth.onAuthStateChanged(user => {
        if (user) {
            // Vérifier si l'utilisateur est admin
            const docRef = doc(db, 'users', user.uid);
            getDoc(docRef)
                .then(docSnap => {
                    if (docSnap.exists() && docSnap.data().isAdmin) {
                        // Mettre à jour le profil avatar avec les initiales
                        const profilePic = document.querySelector('.profile-pic');
                        if (profilePic) {
                            profilePic.style.cursor = 'pointer';
                            profilePic.addEventListener('click', () => {
                                window.location.href = 'profile.html';
                            });
                            
                            const initials = (user.displayName || 'Mon Profil')
                                .split(' ')
                                .map(word => word[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2);

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

                            // Appliquer les styles
                            profilePic.textContent = initials;
                            profilePic.style.backgroundColor = bgColor;
                            profilePic.style.color = '#fff';
                            profilePic.style.display = 'flex';
                            profilePic.style.alignItems = 'center';
                            profilePic.style.justifyContent = 'center';
                            profilePic.style.transition = 'all 0.3s ease';

                            // Vérifier si l'utilisateur a une couleur personnalisée dans Firestore
                            if (docSnap.data().backgroundColor) {
                                profilePic.style.backgroundColor = docSnap.data().backgroundColor;
                            }
                        }
                        loadUsers();
                        setupUserSearch();
                    } else {
                        window.location.href = 'index.html';
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la vérification des droits:', error);
                    window.location.href = 'index.html';
                });
        } else {
            window.location.href = 'index.html';
        }
    });

    // Gestion du menu mobile
    if (mobileMenuBtn && navLinks) {
        // S'assurer que le menu est fermé au chargement
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('active');
        
        console.log('Initialisation des événements du menu mobile'); // Debug log
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêcher la propagation du clic
            console.log('Clic sur le bouton menu mobile'); // Debug log
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Fermer le menu en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && 
                !navLinks.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                console.log('Fermeture du menu mobile (clic en dehors)'); // Debug log
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });

        // Gestion tactile pour mobile
        let touchStartX = 0;
        let touchEndX = 0;

        navLinks.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            console.log('Début du toucher:', touchStartX); // Debug log
        }, { passive: true });

        navLinks.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            console.log('Fin du toucher:', touchEndX); // Debug log
            if (touchEndX - touchStartX > 50) { // Glissement vers la droite
                console.log('Fermeture du menu mobile (glissement)'); // Debug log
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            }
        }, { passive: true });
    }

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
        updateAvatars(window.firebaseAuth.currentUser?.displayName, primaryColor);
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
        updateAvatars(window.firebaseAuth.currentUser?.displayName, primary);
    }

    // Gestion du bouton de thème
    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Vérifier si l'utilisateur est connecté
            const user = window.firebaseAuth.currentUser;
            if (user) {
                // Utilisateur connecté : ouvrir le panneau de thème
                themePanel.classList.add('active');
            } else {
                // Utilisateur non connecté : afficher la popup d'information
                const themeInfoModal = document.getElementById('themeInfoModal');
                themeInfoModal.classList.add('active');
            }
        });
    }

    // Gestion de la popup d'information sur le thème
    const themeInfoModal = document.getElementById('themeInfoModal');
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
                window.location.href = 'index.html';
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

    // Événements de pagination
    document.getElementById('firstPage').addEventListener('click', () => goToPage(1));
    document.getElementById('prevPage').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('nextPage').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('lastPage').addEventListener('click', () => goToPage(totalPages));

    // Événement pour le changement du nombre d'éléments par page
    document.getElementById('usersPerPage').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        displayUsers();
    });

    // Événements de filtrage
    document.getElementById('userSearch').addEventListener('input', () => {
        currentPage = 1;
        displayUsers();
    });

    document.getElementById('userFilter').addEventListener('change', () => {
        currentPage = 1;
        displayUsers();
    });

    // Gestion des statistiques
    async function updateStats() {
        const usersCount = await getUsersCount();
        const articlesCount = await getArticlesCount();
        const commentsCount = await getCommentsCount();
        const reportsCount = await getReportsCount();

        animateStatNumber('.stat-number.users', usersCount);
        animateStatNumber('.stat-number.articles', articlesCount);
        animateStatNumber('.stat-number.comments', commentsCount);
        animateStatNumber('.stat-number.reports', reportsCount);
    }

    function animateStatNumber(selector, targetValue) {
        const element = document.querySelector(selector);
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const duration = 1500; // 1.5 secondes
        const startTime = performance.now();

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Fonction d'easing pour une animation plus naturelle
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = targetValue;
            }
        }

        requestAnimationFrame(updateNumber);
    }

    // Gestion de la suppression massive
    const deleteAllBtn = document.getElementById('deleteAllUsers');
    const deleteModal = document.getElementById('deleteAllUsersModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteAll');
    const cancelDeleteBtn = document.getElementById('cancelDeleteAll');
    const securityInput = document.getElementById('securityCheck');

    const SECURITY_TEXT = "SUPPRIMER TOUS LES UTILISATEURS";

    deleteAllBtn.addEventListener('click', () => {
        deleteModal.classList.add('active');
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.remove('active');
        securityInput.value = '';
        confirmDeleteBtn.disabled = true;
    });

    securityInput.addEventListener('input', (e) => {
        confirmDeleteBtn.disabled = e.target.value !== SECURITY_TEXT;
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        try {
            const userRef = collection(db, 'users');
            const usersSnapshot = await getDocs(userRef);
            
            // Supprimer tous les utilisateurs
            const batch = writeBatch(db);
            usersSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            // Mettre à jour les statistiques
            await updateStats();
            
            // Fermer la modal et réinitialiser
            deleteModal.classList.remove('active');
            securityInput.value = '';
            confirmDeleteBtn.disabled = true;
            
            // Afficher un message de succès
            showNotification('Tous les utilisateurs ont été supprimés avec succès', 'success');
            
        } catch (error) {
            console.error('Erreur lors de la suppression des utilisateurs:', error);
            showNotification('Erreur lors de la suppression des utilisateurs', 'error');
        }
    });

    // Initialisation
    document.addEventListener('DOMContentLoaded', async () => {
        await loadUsers();
        await updateStats();
    });

    // Gestion des actions rapides
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const action = card.querySelector('span').textContent.toLowerCase();
            
            switch(action) {
                case 'nouvel article':
                    // Faire défiler jusqu'à la section nouvel article
                    const articleForm = document.getElementById('articleForm');
                    if (articleForm) {
                        articleForm.scrollIntoView({ behavior: 'smooth' });
                        document.getElementById('title').focus();
                    }
                    break;
                    
                case 'ajouter un utilisateur':
                    // Ouvrir le modal d'ajout d'utilisateur
                    showAddUserModal();
                    break;
                    
                case 'paramètres':
                    // Ouvrir le panneau des paramètres
                    const themePanel = document.getElementById('themePanel');
                    if (themePanel) {
                        themePanel.classList.add('active');
                    }
                    break;
                    
                case 'statistiques':
                    // Faire défiler jusqu'aux statistiques
                    const statsSection = document.querySelector('.admin-stats');
                    if (statsSection) {
                        statsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    break;
            }
        });
    });

    // Fonction pour afficher le modal d'ajout d'utilisateur
    function showAddUserModal() {
        const modal = document.createElement('div');
        modal.className = 'user-modal active';
        modal.innerHTML = `
            <div class="user-modal-content">
                <button class="user-modal-close">&times;</button>
                <h3>Ajouter un utilisateur</h3>
                <form class="user-form">
                    <div class="form-group">
                        <label>Nom</label>
                        <input type="text" name="displayName" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="tel" name="phoneNumber">
                    </div>
                    <div class="form-group">
                        <label>Bio</label>
                        <textarea name="bio"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Statut</label>
                        <select name="isActive">
                            <option value="true" selected>Actif</option>
                            <option value="false">Inactif</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-add">Annuler</button>
                        <button type="submit" class="btn btn-primary">Ajouter</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Gérer la fermeture du modal
        const closeModal = () => {
            modal.remove();
        };

        modal.querySelector('.user-modal-close').addEventListener('click', closeModal);
        modal.querySelector('.cancel-add').addEventListener('click', closeModal);

        // Gérer la soumission du formulaire
        modal.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newUser = {
                displayName: formData.get('displayName'),
                email: formData.get('email'),
                phoneNumber: formData.get('phoneNumber'),
                bio: formData.get('bio'),
                isActive: formData.get('isActive') === 'true',
                createdAt: new Date().toISOString()
            };

            try {
                // Ajouter le nouvel utilisateur à Firestore
                const userRef = collection(db, 'users');
                await addDoc(userRef, newUser);
                
                // Fermer le modal et recharger la liste
                closeModal();
                await loadUsers();
                await updateStats();
                
                showNotification('Utilisateur ajouté avec succès', 'success');
            } catch (error) {
                console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
                showNotification('Erreur lors de l\'ajout de l\'utilisateur', 'error');
            }
        });
    }

    const profilePic = document.querySelector('.profile-pic');
    if (profilePic) {
        profilePic.style.cursor = 'pointer';
        profilePic.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    // Gestion de la prévisualisation de l'image
    if (articleImage) {
        articleImage.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }
});

// Fonctions utilitaires
function updatePreview() {
    const preview = document.getElementById('articlePreview');
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const content = document.getElementById('content').value;
    const author = document.getElementById('author').value || 'Anonyme';
    const status = document.getElementById('status').value;
    const sources = Array.from(document.querySelectorAll('#sourcesList input'))
        .map(input => input.value.trim())
        .filter(Boolean);
    const imageInput = document.getElementById('articleImage');
    
    // Gestion sécurisée de l'image
    let imagePreview = 'assets/default-image.svg';
    if (imageInput.files && imageInput.files[0]) {
        try {
            imagePreview = URL.createObjectURL(imageInput.files[0]);
        } catch (error) {
            console.warn('Erreur de prévisualisation:', error);
        }
    }

    const readTime = calculateReadTime(content);
    const formattedDate = formatDate(new Date());

    // Mise à jour de l'aperçu avec la nouvelle structure de carte
    preview.innerHTML = `
        <div class="article-card">
            <div class="article-media">
                <img src="${imagePreview}" 
                     alt="${title || 'Article'}" 
                     onerror="this.src='assets/default-image.svg'">
                <span class="article-status ${status.toLowerCase()}">
                    <i class="fas ${getStatusIcon(status)}"></i> ${status}
                </span>
            </div>
            <div class="article-content">
            <div class="article-meta">
                <time><i class="fas fa-calendar"></i> ${formattedDate}</time>
                    <span class="article-category">Actualités</span>
            </div>
                <h3 class="article-title">${title || 'Titre de l\'article'}</h3>
                <p class="article-excerpt">${description || 'Description de l\'article'}</p>
                <div class="article-footer">
                    <div class="article-author">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=random" 
                             alt="${author}"
                             onerror="this.src='assets/default-avatar.svg'">
                        <span>Par ${author}</span>
        </div>
                    <div class="article-info">
                        <span><i class="fas fa-clock"></i> ${readTime} min</span>
                        <span><i class="fas fa-link"></i> ${sources.length} sources</span>
        </div>
            </div>
            </div>
        </div>
    `;

    // Mise à jour des compteurs de caractères
    updateCharacterCount(document.getElementById('title'), title.length, ARTICLE_LIMITS.TITLE_MAX_LENGTH);
    updateCharacterCount(document.getElementById('description'), description.length, ARTICLE_LIMITS.DESCRIPTION_MAX_LENGTH);
    updateCharacterCount(document.getElementById('content'), content.length, ARTICLE_LIMITS.CONTENT_MAX_LENGTH, ARTICLE_LIMITS.MIN_CONTENT_LENGTH);

    // Mise à jour du compteur de sources
    const sourcesContainer = document.getElementById('sourcesList').parentNode;
    const sourcesCountDiv = document.createElement('div');
    sourcesCountDiv.className = `sources-count ${sources.length > ARTICLE_LIMITS.MAX_SOURCES ? 'invalid' : 'valid'}`;
    sourcesCountDiv.textContent = `${sources.length}/${ARTICLE_LIMITS.MAX_SOURCES} sources`;
    
    // Supprimer l'ancien compteur de sources s'il existe
    const oldSourcesCount = sourcesContainer.querySelector('.sources-count');
    if (oldSourcesCount) {
        oldSourcesCount.remove();
    }
    sourcesContainer.appendChild(sourcesCountDiv);
}

// Fonction pour valider le contenu de l'article
function validateArticle(article) {
    const errors = [];

    if (!article.title || article.title.length > ARTICLE_LIMITS.TITLE_MAX_LENGTH) {
        errors.push(`Le titre doit contenir entre 1 et ${ARTICLE_LIMITS.TITLE_MAX_LENGTH} caractères`);
    }

    if (!article.description || article.description.length > ARTICLE_LIMITS.DESCRIPTION_MAX_LENGTH) {
        errors.push(`La description doit contenir entre 1 et ${ARTICLE_LIMITS.DESCRIPTION_MAX_LENGTH} caractères`);
    }

    const contentLength = article.fullContent.trim().length;
    if (contentLength < ARTICLE_LIMITS.MIN_CONTENT_LENGTH) {
        const remaining = ARTICLE_LIMITS.MIN_CONTENT_LENGTH - contentLength;
        errors.push(`Le contenu est trop court. Il manque ${remaining} caractère${remaining > 1 ? 's' : ''} pour atteindre le minimum requis de ${ARTICLE_LIMITS.MIN_CONTENT_LENGTH} caractères.`);
    }

    if (contentLength > ARTICLE_LIMITS.CONTENT_MAX_LENGTH) {
        const excess = contentLength - ARTICLE_LIMITS.CONTENT_MAX_LENGTH;
        errors.push(`Le contenu est trop long. Veuillez supprimer ${excess} caractère${excess > 1 ? 's' : ''} pour respecter la limite de ${ARTICLE_LIMITS.CONTENT_MAX_LENGTH} caractères.`);
    }

    if (article.sources.length > ARTICLE_LIMITS.MAX_SOURCES) {
        errors.push(`Le nombre maximum de sources est de ${ARTICLE_LIMITS.MAX_SOURCES}`);
    }

    return errors;
}

// Mise à jour de la fonction saveArticle
async function saveArticle(article) {
    try {
        const db = window.firebaseDb;
        const storage = window.firebaseStorage;
        if (!db || !storage) {
            throw new Error('La connexion à Firebase n\'est pas initialisée');
        }

        // Valider l'article
        const validationErrors = validateArticle(article);
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('\n'));
        }

        let imageUrl = 'assets/default-image.svg';
        
        // Validation et upload de l'image
        const imageInput = document.getElementById('articleImage');
        const imageFile = imageInput.files[0];
        
        if (imageFile) {
            if (imageFile.size > ARTICLE_LIMITS.IMAGE_MAX_SIZE) {
                throw new Error(`L'image ne doit pas dépasser ${ARTICLE_LIMITS.IMAGE_MAX_SIZE / 1024 / 1024}MB`);
            }

            try {
                // Créer un nom de fichier sécurisé
                const timestamp = Date.now();
                const safeFileName = encodeURIComponent(imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_'));
                const storageRef = ref(storage, `articles/images/${timestamp}_${safeFileName}`);

                // Configuration de l'upload
                const metadata = {
                    contentType: imageFile.type,
                    customMetadata: {
                        uploadedFrom: window.location.origin,
                        originalName: imageFile.name
                    }
                };

                // Upload avec retry
                let uploadError = null;
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        const snapshot = await uploadBytes(storageRef, imageFile, metadata);
                        const downloadUrl = await getDownloadURL(snapshot.ref);
                        
                        // Vérifier si l'URL est accessible
                        const response = await fetch(downloadUrl, { 
                            method: 'HEAD',
                            mode: 'cors'
                        });
                        
                        if (response.ok) {
                            imageUrl = downloadUrl;
                            showNotification('Image uploadée avec succès', 'success');
                            break;
                        }
                    } catch (error) {
                        console.warn(`Tentative ${attempt + 1}/3 échouée:`, error);
                        uploadError = error;
                        if (attempt < 2) {
                            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                        }
                    }
                }

                if (imageUrl === 'assets/default-image.svg' && uploadError) {
                    console.error('Erreur finale lors de l\'upload:', uploadError);
                    showNotification('Impossible d\'uploader l\'image. L\'article sera publié avec l\'image par défaut.', 'warning');
                }
            } catch (error) {
                console.error('Erreur lors de la préparation de l\'upload:', error);
                showNotification('Erreur de configuration. L\'article sera publié avec l\'image par défaut.', 'warning');
            }
        }

        // Préparer l'article pour Firebase
        const articleData = {
            title: article.title.trim(),
            description: article.description.trim(),
            fullContent: article.fullContent.trim(),
            author: article.author.trim() || 'Anonyme',
            imageUrl: imageUrl,
            status: article.status,
            sources: article.sources.filter(source => source.trim()),
            readTime: calculateReadTime(article.fullContent) + ' min',
            category: 'Actualités',
            authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(article.author || 'Anonyme')}&background=random`,
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Ajouter l'article à Firebase
        const articlesRef = collection(db, 'articles');
        const docRef = await addDoc(articlesRef, articleData);
        
        // Réinitialiser le formulaire et l'aperçu
        document.getElementById('articleForm').reset();
        document.getElementById('articleImage').value = '';
        document.getElementById('previewImg').src = 'assets/default-image.svg';
        if (document.getElementById('articlePreview')) {
            document.getElementById('articlePreview').style.display = 'none';
        }
        
        await updateStats();
        showNotification('Article publié avec succès !', 'success');
        await loadPublishedArticles();
        
        return docRef.id;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'article:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

async function loadPublishedArticles() {
    try {
        const db = window.firebaseDb;
        const articlesRef = collection(db, 'articles');
        const articlesSnapshot = await getDocs(articlesRef);
        
        const articles = [];
        articlesSnapshot.forEach(doc => {
            articles.push({ id: doc.id, ...doc.data() });
        });

        const publishedArticles = document.getElementById('publishedArticles');
        const articlesPerPage = 10;
        let currentPage = parseInt(localStorage.getItem('currentPage') || '1');
        const totalPages = Math.ceil(articles.length / articlesPerPage);

    // Calculer les articles à afficher
    const start = (currentPage - 1) * articlesPerPage;
    const end = start + articlesPerPage;
    const displayedArticles = articles.slice(start, end);

    publishedArticles.innerHTML = articles.length ? `
            <div class="articles-grid">
            ${displayedArticles.map(article => `
                    <article class="article-card" data-category="${article.status.toLowerCase()}">
                        <div class="article-media">
                            <img src="${article.imageUrl || 'assets/default-image.svg'}" alt="${article.title}" loading="lazy">
                            <span class="article-status ${article.status.toLowerCase()}">
                                <i class="fas ${getStatusIcon(article.status)}"></i>
                            </span>
                        </div>
                        
                        <div class="article-content">
                            <div class="article-meta">
                                <time datetime="${article.date}">${formatDate(article.date)}</time>
                                <span class="article-category">${article.category}</span>
                            </div>
                            
                            <h3 class="article-title">
                                <a href="#" class="edit-article" data-id="${article.id}">${article.title}</a>
                            </h3>
                            
                            <p class="article-excerpt">
                                ${article.description}
                            </p>
                            
                            <div class="article-footer">
                                <div class="article-author">
                                    <img src="${article.authorAvatar}" alt="${article.author}">
                                    <span>Par ${article.author}</span>
                    </div>
                    <div class="article-actions">
                                    <button class="btn btn-secondary edit-btn" data-id="${article.id}">
                                        <i class="fas fa-edit"></i>
                        </button>
                                    <button class="btn btn-danger delete-btn" data-id="${article.id}">
                                        <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                        </div>
                    </article>
            `).join('')}
        </div>
        ${totalPages > 1 ? `
                <div class="articles-pagination">
                <button class="btn btn-secondary" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i> Précédent
                </button>
                <span>Page ${currentPage} sur ${totalPages}</span>
                <button class="btn btn-secondary" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
                    Suivant <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        ` : ''}
        ` : '<p class="no-articles">Aucun article publié</p>';

        // Ajouter les écouteurs d'événements pour les boutons d'action
        const editButtons = document.querySelectorAll('.edit-btn, .edit-article');
        const deleteButtons = document.querySelectorAll('.delete-btn');

        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const articleId = button.dataset.id;
                editArticle(articleId);
            });
        });

        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const articleId = button.dataset.id;
                deleteArticle(articleId);
            });
        });

    } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
        showNotification('Erreur lors du chargement des articles', 'error');
    }
}

function getStatusIcon(status) {
    switch(status.toLowerCase()) {
        case 'vrai':
            return 'fa-check';
        case 'faux':
            return 'fa-times';
        case 'partiel':
            return 'fa-exclamation';
        default:
            return 'fa-question';
    }
}

async function deleteArticle(articleId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
        try {
            const db = window.firebaseDb;
            const articleRef = doc(db, 'articles', articleId);
            await deleteDoc(articleRef);
            
            await loadPublishedArticles();
            await updateStats();
            
            showNotification('Article supprimé avec succès !', 'success');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            showNotification('Erreur lors de la suppression de l\'article', 'error');
        }
    }
}

async function editArticle(articleId) {
    try {
        const db = window.firebaseDb;
        const articleRef = doc(db, 'articles', articleId);
        const articleSnap = await getDoc(articleRef);
        
        if (articleSnap.exists()) {
            const article = articleSnap.data();
            
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
            document.querySelector('#nouvel-article').scrollIntoView({ behavior: 'smooth' });
            
            // Stocker l'ID de l'article en cours d'édition
            articleForm.dataset.editId = articleId;
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'article:', error);
        showNotification('Erreur lors du chargement de l\'article', 'error');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
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

// Configuration de la pagination
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let allUsers = [];

// Fonction pour charger les utilisateurs avec pagination
async function loadUsers() {
    try {
        const db = window.firebaseDb;
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        
        // Réinitialiser le tableau des utilisateurs
        allUsers = [];
        
        // Charger les utilisateurs existants
        usersSnapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });

        // Ajouter des utilisateurs d'exemple SEULEMENT si aucun utilisateur n'existe
        if (allUsers.length === 0) {
            const exampleUsers = [
                {
                    displayName: "John Doe",
                    email: "john@example.com",
                    phoneNumber: "0123456789",
                    isActive: true,
                    createdAt: new Date().toISOString()
                },
                {
                    displayName: "Jane Smith",
                    email: "jane@example.com",
                    phoneNumber: "0987654321",
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ];

            const batch = writeBatch(db);
            for (const user of exampleUsers) {
                const newUserRef = doc(collection(db, 'users'));
                batch.set(newUserRef, user);
            }
            await batch.commit();

            // Recharger les utilisateurs après l'ajout des exemples
            const updatedSnapshot = await getDocs(usersCollection);
            allUsers = [];
            updatedSnapshot.forEach(doc => {
                allUsers.push({ id: doc.id, ...doc.data() });
            });
        }

        // Mettre à jour les statistiques avec le nombre correct d'utilisateurs
        const totalUsers = allUsers.length;
        if (document.getElementById('totalUsers')) {
            document.getElementById('totalUsers').textContent = totalUsers;
        }
        
        // Mettre à jour la pagination
        totalPages = Math.ceil(allUsers.length / itemsPerPage);
        
        // Afficher les utilisateurs
        displayUsers();
        
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        showNotification('Erreur lors du chargement des utilisateurs', 'error');
    }
}

// Fonction pour afficher les utilisateurs de la page courante
function displayUsers() {
        const usersList = document.getElementById('usersList');
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const filterValue = document.getElementById('userFilter').value;

    // Filtrer les utilisateurs
    let filteredUsers = allUsers;
    
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(userData => {
            return (userData.displayName || '').toLowerCase().includes(searchTerm) || 
                   (userData.email || '').toLowerCase().includes(searchTerm);
        });
    }

    if (filterValue !== 'all') {
        filteredUsers = filteredUsers.filter(userData => {
            return filterValue === 'active' ? userData.isActive !== false : userData.isActive === false;
        });
    }

    // Calculer les indices de début et de fin pour la page courante
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
    const usersToDisplay = filteredUsers.slice(startIndex, endIndex);

    // Mettre à jour les informations de pagination
    document.getElementById('startIndex').textContent = filteredUsers.length ? startIndex + 1 : 0;
    document.getElementById('endIndex').textContent = endIndex;
    document.getElementById('totalItems').textContent = filteredUsers.length;

    // Mettre à jour le nombre total de pages
    totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    updatePaginationControls();

    // Afficher les utilisateurs
    usersList.innerHTML = usersToDisplay.map(userData => `
        <tr>
                <td>${userData.displayName || 'Non défini'}</td>
                <td>${userData.email || 'Non défini'}</td>
                <td>${userData.phoneNumber || 'Non défini'}</td>
            <td>${formatDate(userData.createdAt)}</td>
            <td>
                <span class="user-status ${userData.isActive !== false ? 'active' : 'inactive'}">
                    ${userData.isActive !== false ? 'Actif' : 'Inactif'}
                </span>
            </td>
                <td class="user-actions">
                <button class="edit-user" data-userid="${userData.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                <button class="delete-user" data-userid="${userData.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
        </tr>
    `).join('');

    // Ajouter les écouteurs d'événements pour les boutons d'action
    const editButtons = usersList.querySelectorAll('.edit-user');
    const deleteButtons = usersList.querySelectorAll('.delete-user');

    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-userid');
            editUser(userId);
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-userid');
            deleteUser(userId);
        });
    });
}

// Fonction pour mettre à jour les contrôles de pagination
function updatePaginationControls() {
    const firstPageBtn = document.getElementById('firstPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const lastPageBtn = document.getElementById('lastPage');
    const pageNumbers = document.getElementById('pageNumbers');

    // Mettre à jour l'état des boutons
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;

    // Générer les numéros de page
    let pagesHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        pagesHtml += '<span class="page-ellipsis">...</span>';
    }

    for (let i = startPage; i <= endPage; i++) {
        pagesHtml += `
            <div class="page-number ${i === currentPage ? 'active' : ''}" 
                 onclick="goToPage(${i})">${i}</div>
        `;
    }

    if (endPage < totalPages) {
        pagesHtml += '<span class="page-ellipsis">...</span>';
    }

    pageNumbers.innerHTML = pagesHtml;
}

// Fonction pour aller à une page spécifique
function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayUsers();
    }
}

// Rendre les fonctions accessibles globalement
window.editUser = async function(userId) {
    const userData = allUsers.find(u => u.id === userId);
    
    if (userData) {
    // Créer et afficher le modal d'édition
    const modal = document.createElement('div');
    modal.className = 'user-modal active';
    modal.innerHTML = `
        <div class="user-modal-content">
            <button class="user-modal-close">&times;</button>
            <h3>Modifier l'utilisateur</h3>
            <form class="user-form">
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" name="displayName" value="${userData.displayName || ''}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value="${userData.email || ''}" required>
                </div>
                <div class="form-group">
                    <label>Téléphone</label>
                    <input type="tel" name="phoneNumber" value="${userData.phoneNumber || ''}">
                </div>
                <div class="form-group">
                    <label>Bio</label>
                    <textarea name="bio">${userData.bio || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Statut</label>
                    <select name="isActive">
                        <option value="true" ${userData.isActive !== false ? 'selected' : ''}>Actif</option>
                        <option value="false" ${userData.isActive === false ? 'selected' : ''}>Inactif</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary cancel-edit">Annuler</button>
                    <button type="submit" class="btn btn-primary">Sauvegarder</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Gérer la fermeture du modal
    const closeModal = () => {
        modal.remove();
    };

    modal.querySelector('.user-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.cancel-edit').addEventListener('click', closeModal);

    // Gérer la soumission du formulaire
    modal.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = {
            displayName: formData.get('displayName'),
            email: formData.get('email'),
            phoneNumber: formData.get('phoneNumber'),
            bio: formData.get('bio'),
            isActive: formData.get('isActive') === 'true',
            updatedAt: new Date().toISOString()
        };

        try {
                const db = window.firebaseDb;
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, updates);
            closeModal();
                await loadUsers(); // Recharger la liste des utilisateurs
                await updateStats(); // Mettre à jour les statistiques
                showNotification('Utilisateur modifié avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
                showNotification('Erreur lors de la mise à jour de l\'utilisateur', 'error');
        }
    });
}
};

window.deleteUser = async function(userId) {
    // Créer et afficher le modal de confirmation
    const modal = document.createElement('div');
    modal.className = 'user-modal active';
    modal.innerHTML = `
        <div class="user-modal-content delete-confirmation">
            <div class="modal-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
            <p class="warning-text">Cette action est irréversible.</p>
            <div class="form-actions">
                <button class="btn btn-secondary cancel-delete">Annuler</button>
                <button class="btn btn-danger confirm-delete">Supprimer</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Gérer la fermeture du modal
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    // Gérer les actions
    modal.querySelector('.cancel-delete').addEventListener('click', closeModal);

    modal.querySelector('.confirm-delete').addEventListener('click', async () => {
        try {
            const db = window.firebaseDb;
            if (!db) {
                throw new Error('La connexion à Firebase n\'est pas initialisée');
            }

            const userRef = doc(db, 'users', userId);
            if (!userRef) {
                throw new Error('Référence utilisateur invalide');
            }

            // Vérifier si l'utilisateur existe avant de le supprimer
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                throw new Error('L\'utilisateur n\'existe pas');
            }

            // Supprimer l'utilisateur de Firestore
            await deleteDoc(userRef);
            
            // Fermer le modal avec animation
            closeModal();
            
            // Recharger la liste et les statistiques
            await loadUsers();
            await updateStats();
            
            showNotification('Utilisateur supprimé avec succès', 'success');
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
            showNotification(`Erreur lors de la suppression: ${error.message}`, 'error');
            closeModal();
        }
    });

    // Fermer le modal en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
};

// Fonction de recherche d'utilisateurs
function setupUserSearch() {
    const searchInput = document.getElementById('userSearch');
    const filterSelect = document.getElementById('userFilter');

    const filterUsers = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        const rows = document.querySelectorAll('#usersList tr');

        rows.forEach(row => {
            const name = row.cells[0].textContent.toLowerCase();
            const email = row.cells[1].textContent.toLowerCase();
            const status = row.querySelector('.user-status').textContent.toLowerCase();
            
            const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);
            const matchesFilter = filterValue === 'all' || 
                                (filterValue === 'active' && status === 'actif') ||
                                (filterValue === 'inactive' && status === 'inactif');

            row.style.display = matchesSearch && matchesFilter ? '' : 'none';
        });
    };

    searchInput.addEventListener('input', filterUsers);
    filterSelect.addEventListener('change', filterUsers);
} 

// Fonctions pour récupérer les statistiques
async function getUsersCount() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.size;
}

async function getArticlesCount() {
    const articlesRef = collection(db, 'articles');
    const snapshot = await getDocs(articlesRef);
    return snapshot.size;
}

async function getCommentsCount() {
    const commentsRef = collection(db, 'comments');
    const snapshot = await getDocs(commentsRef);
    return snapshot.size;
}

async function getReportsCount() {
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);
    return snapshot.size;
}

// Fonction pour mettre à jour les compteurs de caractères
function updateCharacterCount(element, current, max, min = 0) {
    const container = element.parentNode;
    const countDiv = document.createElement('div');
    countDiv.className = `char-count ${current < min ? 'invalid' : current > max ? 'invalid' : 'valid'}`;
    
    let message = `${current}/${max} caractères`;
    if (min > 0) {
        const remaining = min - current;
        if (remaining > 0) {
            message += ` (encore ${remaining} caractère${remaining > 1 ? 's' : ''} minimum)`;
        }
    }
    
    countDiv.innerHTML = message;
    
    // Supprimer l'ancien compteur s'il existe
    const oldCount = container.querySelector('.char-count');
    if (oldCount) {
        oldCount.remove();
    }
    
    container.appendChild(countDiv);
}

// Ajouter des écouteurs d'événements pour la validation en temps réel
document.getElementById('content').addEventListener('input', function() {
    const content = this.value.trim();
    const length = content.length;
    updateCharacterCount(this, length, ARTICLE_LIMITS.CONTENT_MAX_LENGTH, ARTICLE_LIMITS.MIN_CONTENT_LENGTH);
});

document.getElementById('title').addEventListener('input', function() {
    const length = this.value.length;
    updateCharacterCount(this, length, ARTICLE_LIMITS.TITLE_MAX_LENGTH);
});

document.getElementById('description').addEventListener('input', function() {
    const length = this.value.length;
    updateCharacterCount(this, length, ARTICLE_LIMITS.DESCRIPTION_MAX_LENGTH);
}); 