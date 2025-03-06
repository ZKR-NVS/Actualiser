// Appliquer le thème sauvegardé (lecture seule)
const savedTheme = localStorage.getItem('selectedTheme');
const savedColors = JSON.parse(localStorage.getItem('customColors'));

if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
} else if (savedColors) {
    document.documentElement.style.setProperty('--primary-color', savedColors.primary);
    document.documentElement.style.setProperty('--secondary-color', savedColors.secondary);
    document.documentElement.style.setProperty('--gradient', `linear-gradient(135deg, ${savedColors.primary}, ${savedColors.secondary})`);
}

document.addEventListener('DOMContentLoaded', () => {
    // Fonction pour obtenir les initiales d'un nom
    function getInitials(name) {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    // Fonction pour mettre à jour les avatars
    function updateAvatars(displayName, backgroundColor) {
        const initials = getInitials(displayName);
        const avatars = document.querySelectorAll('.profile-avatar, .profile-pic');
        
        // Récupérer les couleurs personnalisées du localStorage
        const savedColors = JSON.parse(localStorage.getItem('customColors'));
        const savedTheme = localStorage.getItem('selectedTheme');
        
        // Déterminer la couleur de fond à utiliser
        let bgColor = backgroundColor;
        if (!bgColor) {
            if (savedColors) {
                bgColor = savedColors.primary;
            } else if (savedTheme) {
                const root = document.documentElement;
                const computedStyle = getComputedStyle(root);
                bgColor = computedStyle.getPropertyValue('--primary-color').trim();
            } else {
                bgColor = '#4CAF50'; // Couleur par défaut
            }
        }

        avatars.forEach(avatar => {
            avatar.textContent = initials;
            avatar.style.backgroundColor = bgColor;
            avatar.style.color = '#fff';
            avatar.style.display = 'flex';
            avatar.style.alignItems = 'center';
            avatar.style.justifyContent = 'center';
            avatar.style.fontWeight = '500';
            avatar.style.transition = 'all 0.3s ease';
            avatar.removeAttribute('src'); // Supprimer l'attribut src s'il existe
        });

        // Sauvegarder la couleur dans Firestore si l'utilisateur est connecté
        const user = firebase.auth().currentUser;
        if (user) {
            firebase.firestore().collection('users').doc(user.uid).update({
                backgroundColor: bgColor
            }).catch(error => console.error('Erreur lors de la mise à jour de la couleur:', error));
        }
    }

    // Fonction pour mettre à jour l'interface utilisateur
    function updateUI(user, backgroundColor) {
        // Mettre à jour les informations du profil
        const profileName = document.querySelector('h1.profile-name');
        const profileNameSpan = document.querySelector('span.profile-name');
        const profileEmail = document.querySelector('.profile-email');
        const nameInput = document.querySelector('input[type="text"]');
        const emailInput = document.querySelector('input[type="email"]');
        const profileJoined = document.querySelector('.profile-joined');

        // Mettre à jour le nom et l'email partout où ils apparaissent
        const displayName = user.displayName || 'Mon Profil';
        const email = user.email || '';

        if (profileName) profileName.textContent = displayName;
        if (profileNameSpan) profileNameSpan.textContent = displayName;
        if (profileEmail) profileEmail.textContent = email;
        if (nameInput) nameInput.value = displayName;
        if (emailInput) emailInput.value = email;

        // Mettre à jour les avatars avec les initiales
        updateAvatars(displayName, backgroundColor);

        // Mettre à jour la date d'inscription
        if (profileJoined && user.metadata) {
            const creationDate = new Date(user.metadata.creationTime);
            const options = { year: 'numeric', month: 'long' };
            profileJoined.textContent = `Membre depuis ${creationDate.toLocaleDateString('fr-FR', options)}`;
        }

        // Marquer la couleur active dans le sélecteur
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.color === backgroundColor) {
                option.classList.add('active');
            }
        });
    }

    // Fonction pour charger les données utilisateur
    async function loadUserData(user) {
        try {
            const doc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                
                // Mettre à jour l'interface utilisateur avec les données
                updateUI(user, data.backgroundColor);
                
                // Mettre à jour le gradient de la bannière
                if (data.bannerGradient) {
                    const { startColor, endColor } = data.bannerGradient;
                    updateBannerGradient(startColor, endColor);
                    const gradientOption = document.querySelector(`.banner-color-picker .color-option[data-gradient="${startColor},${endColor}"]`);
                    if (gradientOption) {
                        document.querySelectorAll('.banner-color-picker .color-option').forEach(opt => opt.classList.remove('active'));
                        gradientOption.classList.add('active');
                    }
                }

                // Mettre à jour les champs additionnels du formulaire
                const phoneInput = document.querySelector('input[type="tel"]');
                const bioTextarea = document.querySelector('textarea');

                if (phoneInput) phoneInput.value = data.phoneNumber || '';
                if (bioTextarea) bioTextarea.value = data.bio || '';
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }

    // Vérification de la connexion et chargement des données utilisateur
    function loadUserProfile() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            // Mettre à jour directement le nom
            const profileName = document.querySelector('h1.profile-name');
            const profileNameSpan = document.querySelector('span.profile-name');
            if (profileName) profileName.textContent = user.displayName || 'Mon Profil';
            if (profileNameSpan) profileNameSpan.textContent = user.displayName || 'Mon Profil';

            // Vérifier si l'utilisateur est admin
            const adminBtn = document.getElementById('adminBtn');
            if (adminBtn) {
                const doc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (doc.exists && doc.data().isAdmin) {
                    adminBtn.style.display = 'block';
                    adminBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.location.href = 'admin.html';
                    });
                }
            }

            // Charger les données utilisateur
            await loadUserData(user);
        });
    }

    // Gestion des onglets
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Gestion du menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêcher la propagation du clic
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Fermer le menu en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && 
                !navLinks.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // Gestion des couleurs de profil
    const colorOptions = document.querySelectorAll('.color-picker:not(.banner-color-picker) .color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', async () => {
            const color = option.getAttribute('data-color');
            const user = firebase.auth().currentUser;

            if (user && color) {
                try {
                    // Mettre à jour la couleur dans Firestore
                    await firebase.firestore().collection('users').doc(user.uid).update({
                        backgroundColor: color
                    });

                    // Mettre à jour l'interface
                    updateUI(user, color);
                } catch (error) {
                    console.error('Erreur lors de la mise à jour de la couleur:', error);
                }
            }
        });
    });

    // Gestion des couleurs de la bannière
    const bannerColorOptions = document.querySelectorAll('.banner-color-picker .color-option');
    const profileCover = document.querySelector('.profile-cover');

    // Gestion du thème
    const themeBtn = document.getElementById('themeBtn');
    const themePanel = document.getElementById('themePanel');
    const themeOptions = document.querySelectorAll('.theme-option');
    const primaryColorPicker = document.getElementById('primaryColor');
    const secondaryColorPicker = document.getElementById('secondaryColor');
    const applyThemeBtn = document.querySelector('.apply-theme-btn');

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
        const user = firebase.auth().currentUser;
        if (user) {
            updateAvatars(user.displayName, primaryColor);
        }
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
        const user = firebase.auth().currentUser;
        if (user) {
            updateAvatars(user.displayName, primary);
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

    // Fonction pour mettre à jour le gradient de la bannière
    function updateBannerGradient(startColor, endColor) {
        if (profileCover) {
            profileCover.style.background = `linear-gradient(135deg, #${startColor} 0%, #${endColor} 100%)`;
        }
    }

    // Gestionnaire pour les options de couleur de la bannière
    bannerColorOptions.forEach(option => {
        option.addEventListener('click', async () => {
            const gradient = option.dataset.gradient;
            const [startColor, endColor] = gradient.split(',');
            const user = firebase.auth().currentUser;

            if (user) {
                try {
                    // Mettre à jour dans Firestore
                    await firebase.firestore().collection('users').doc(user.uid).update({
                        bannerGradient: {
                            startColor: startColor,
                            endColor: endColor
                        }
                    });

                    // Mettre à jour l'interface
                    bannerColorOptions.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    updateBannerGradient(startColor, endColor);
                    } catch (error) {
                    console.error('Erreur lors de la mise à jour de la couleur de la bannière:', error);
                }
            }
        });
    });

    // Gestion des formulaires
    const forms = document.querySelectorAll('.profile-form');
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sauvegarde en cours...';
            
            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    throw new Error('Utilisateur non connecté');
                }

                // Si c'est le formulaire de changement de mot de passe
                if (form.querySelector('input[type="password"]')) {
                    const passwordInputs = form.querySelectorAll('input[type="password"]');
                    const currentPassword = passwordInputs[0].value;
                    const newPassword = passwordInputs[1].value;
                    const confirmPassword = passwordInputs[2].value;

                    if (!currentPassword || !newPassword || !confirmPassword) {
                        throw new Error('Veuillez remplir tous les champs de mot de passe');
                    }

                    if (newPassword !== confirmPassword) {
                        throw new Error('Les nouveaux mots de passe ne correspondent pas');
                    }

                    if (newPassword.length < 6) {
                        throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
                    }

                    // Créer les credentials avec l'email actuel et le mot de passe actuel
                    const credential = firebase.auth.EmailAuthProvider.credential(
                        user.email,
                        currentPassword
                    );

                    // Réauthentifier l'utilisateur
                    await user.reauthenticateWithCredential(credential);

                    // Changer le mot de passe
                    await user.updatePassword(newPassword);

                    // Vider les champs
                    passwordInputs.forEach(input => input.value = '');

                    submitBtn.textContent = 'Mot de passe changé !';
                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                    }, 2000);

                    // Déconnecter l'utilisateur et rediriger vers la page de connexion
                    await firebase.auth().signOut();
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('userProfile');
                    window.location.href = 'index.html';
                    return;
                }

                // Pour les autres formulaires (nom, etc.)
                const nameInput = form.querySelector('input[type="text"]');
                const phoneInput = form.querySelector('input[type="tel"]');
                const bioTextarea = form.querySelector('textarea');
                const userRef = firebase.firestore().collection('users').doc(user.uid);

                // Préparer les données à mettre à jour
                const updates = {};

                if (nameInput && nameInput.value !== user.displayName) {
                    const newName = nameInput.value.trim();
                    updates.displayName = newName;
                    await user.updateProfile({ displayName: newName });
                    updateAvatars(newName);
                    document.querySelector('.profile-name').textContent = newName;
                }

                if (phoneInput) {
                    updates.phoneNumber = phoneInput.value.trim();
                }

                if (bioTextarea) {
                    updates.bio = bioTextarea.value.trim();
                }

                // Mettre à jour l'email si changé
                const emailInput = form.querySelector('input[type="email"]');
                if (emailInput && emailInput.value !== user.email) {
                    updates.email = emailInput.value.trim();
                    await user.updateEmail(emailInput.value.trim());
                    document.querySelector('.profile-email').textContent = emailInput.value.trim();
                }

                // Sauvegarder toutes les mises à jour dans Firestore
                if (Object.keys(updates).length > 0) {
                    await userRef.update(updates);
                }
                
                submitBtn.textContent = 'Sauvegardé !';
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                }, 2000);
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                let errorMessage = 'Une erreur est survenue';
                
                if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Mot de passe actuel incorrect';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Le nouveau mot de passe est trop faible';
                } else if (error.message) {
                    errorMessage = error.message;
                }

                // Afficher l'erreur
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.color = 'red';
                errorDiv.style.marginTop = '10px';
                errorDiv.textContent = errorMessage;
                
                // Supprimer l'ancien message d'erreur s'il existe
                const oldError = form.querySelector('.error-message');
                if (oldError) oldError.remove();
                
                form.appendChild(errorDiv);
                
                submitBtn.textContent = 'Erreur !';
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    errorDiv.remove();
                }, 3000);
            }
        });
    });

    // Déconnexion
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-primary';
    logoutBtn.textContent = 'Déconnexion';
    logoutBtn.style.marginTop = '2rem';
    
    const lastSection = document.querySelector('.profile-section:last-child');
    if (lastSection) {
        lastSection.appendChild(logoutBtn);
    }

    logoutBtn.addEventListener('click', async () => {
        try {
            await firebase.auth().signOut();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userProfile');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            alert('Une erreur est survenue lors de la déconnexion.');
        }
    });

    // Appeler loadUserProfile immédiatement
    loadUserProfile();
}); 