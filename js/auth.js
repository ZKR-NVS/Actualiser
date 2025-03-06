document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM
    const loginBtn = document.getElementById('loginBtn');
    const authModal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (!loginBtn || !authModal) {
        console.error('Éléments nécessaires non trouvés');
        return;
    }

    // Vérifier si on doit ouvrir la modal (redirection depuis profile.html)
    if (sessionStorage.getItem('openAuthModal') === 'true') {
        authModal.classList.add('active');
        sessionStorage.removeItem('openAuthModal');
    }

    // Gestionnaire de clic pour ouvrir la modal
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const user = firebase.auth().currentUser;
        if (!user) {
            authModal.classList.add('active');
        } else {
            window.location.href = 'profile.html';
        }
    });

    const closeBtn = authModal.querySelector('.close-btn');
    const tabBtns = authModal.querySelectorAll('.tab-btn');
    const authForms = authModal.querySelectorAll('.auth-form');
    const togglePasswordBtns = authModal.querySelectorAll('.toggle-password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Fonction pour afficher une erreur
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error';
        errorDiv.textContent = message;
        
        const authModal = document.getElementById('authModal');
        if (authModal) {
            const container = authModal.querySelector('.auth-container');
            if (container) {
        // Supprimer l'erreur précédente si elle existe
                const existingError = container.querySelector('.auth-error');
        if (existingError) {
            existingError.remove();
        }
        
                container.appendChild(errorDiv);
        
        // Supprimer l'erreur après 5 secondes
        setTimeout(() => errorDiv.remove(), 5000);
            }
        }
    }

    // Fonction pour afficher une notification
    function showNotification(message) {
        const notifDiv = document.createElement('div');
        notifDiv.className = 'auth-notification';
        notifDiv.textContent = message;
        
        // Supprimer la notification précédente si elle existe
        const existingNotif = document.querySelector('.auth-notification');
        if (existingNotif) {
            existingNotif.remove();
        }
        
        // Ajouter la nouvelle notification
            authModal.querySelector('.auth-container').appendChild(notifDiv);
        
        // Supprimer la notification après 3 secondes
        setTimeout(() => notifDiv.remove(), 3000);
    }

    // Gestionnaires d'événements pour les onglets
    if (tabBtns && tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                tabBtns.forEach(b => b.classList.remove('active'));
                authForms.forEach(form => form.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(tab + 'Form').classList.add('active');
            });
        });
    }

    // Gestionnaire pour fermer la modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            authModal.classList.remove('active');
        });
    }

    // Gestionnaire pour les boutons de visibilité du mot de passe
    if (togglePasswordBtns && togglePasswordBtns.length > 0) {
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    }

    // Gestionnaire pour la connexion
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('#loginEmail').value;
            const password = loginForm.querySelector('#loginPassword').value;
            const submitBtn = loginForm.querySelector('.submit-btn');
            
            if (!email || !password) {
                showError('Veuillez remplir tous les champs');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Connexion...';
                
                await firebase.auth().signInWithEmailAndPassword(email, password);
                showNotification('Connexion réussie !');
                
                // Stocker les informations si "Se souvenir de moi" est coché
                if (rememberMeCheckbox && rememberMeCheckbox.checked) {
                    localStorage.setItem('userEmail', email);
                }

                // Rediriger vers la page de profil
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1000);
            } catch (error) {
                console.error('Erreur de connexion:', error);
                let errorMessage = 'Une erreur est survenue lors de la connexion';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Aucun compte ne correspond à cet email';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Mot de passe incorrect';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email invalide';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
                        break;
                }
                
                showError(errorMessage);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Se connecter';
            }
        });
    }

    // Gestionnaire pour l'inscription
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = registerForm.querySelector('#registerName').value;
            const email = registerForm.querySelector('#registerEmail').value;
            const password = registerForm.querySelector('#registerPassword').value;
            const confirmPassword = registerForm.querySelector('#confirmPassword').value;
            const submitBtn = registerForm.querySelector('.submit-btn');
            
            if (!name || !email || !password || !confirmPassword) {
                showError('Veuillez remplir tous les champs');
                return;
            }

            if (password !== confirmPassword) {
                showError('Les mots de passe ne correspondent pas');
                return;
            }

            if (password.length < 6) {
                showError('Le mot de passe doit contenir au moins 6 caractères');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Inscription...';
                
                // Créer le compte
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                
                // Mettre à jour le profil avec le nom
                await userCredential.user.updateProfile({
                    displayName: name
                });

                // Créer le document utilisateur dans Firestore
                await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
                    displayName: name,
                    email: email,
                    createdAt: new Date().toISOString(),
                    backgroundColor: '#2196F3' // Couleur par défaut
                });

                showNotification('Inscription réussie !');
                
                // Rediriger vers la page de profil
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1000);
            } catch (error) {
                console.error('Erreur d\'inscription:', error);
                let errorMessage = 'Une erreur est survenue lors de l\'inscription';
                
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'Cet email est déjà utilisé';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email invalide';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = 'L\'inscription par email/mot de passe n\'est pas activée';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Le mot de passe est trop faible';
                        break;
                }
                
                showError(errorMessage);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'S\'inscrire';
            }
        });
    }

    // Mot de passe oublié
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        
        if (!email) {
                showError('Veuillez entrer votre email pour réinitialiser votre mot de passe');
            return;
        }

        try {
            await firebase.auth().sendPasswordResetEmail(email);
                showNotification('Un email de réinitialisation a été envoyé');
        } catch (error) {
            console.error('Erreur de réinitialisation:', error);
                showError('Erreur lors de l\'envoi de l\'email de réinitialisation');
            }
        });
    }

    // Fonction pour obtenir les initiales
    function getInitials(name) {
        if (!name) return '';
        return name.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    // Mettre à jour l'interface utilisateur après la connexion
    function updateUIAfterLogin(user) {
        const loginBtn = document.querySelector('#loginBtn');
        const userProfile = document.querySelector('.user-profile');
        const avatarCircle = document.querySelector('.avatar-circle');
        const userInitials = document.querySelector('.user-initials');

        if (user) {
            // Cacher le bouton de connexion et afficher le profil
            loginBtn.style.display = 'none';
            userProfile.style.display = 'flex';

            // Obtenir et afficher les initiales
            const initials = getInitials(user.displayName || 'Utilisateur');
            avatarCircle.textContent = initials;
            userInitials.textContent = initials;

            // Ajouter le gestionnaire d'événements pour la redirection vers le profil
            userProfile.onclick = (e) => {
                e.preventDefault();
                window.location.href = 'profile.html';
            };
        } else {
            // Afficher le bouton de connexion et cacher le profil
            loginBtn.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    }

    // Gestionnaire d'état de l'authentification
    firebase.auth().onAuthStateChanged((user) => {
        updateUIAfterLogin(user);
    });

    // Configuration du provider Google avec personnalisation
    const googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    googleProvider.setCustomParameters({
        prompt: 'select_account'
    });
    
    // Gestion de la connexion Google
    const googleBtn = document.querySelector('.social-btn.google');
    if (googleBtn) {
        googleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Tentative de connexion Google...');
            
            try {
                // Tentative de connexion avec popup
                console.log('Ouverture de la popup Google...');
                const result = await firebase.auth().signInWithPopup(googleProvider);
                console.log('Résultat de la connexion:', result);
                const user = result.user;
                
                // Vérifier si l'utilisateur existe déjà dans Firestore
                console.log('Vérification de l\'utilisateur dans Firestore...');
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                
                if (!userDoc.exists) {
                    console.log('Création d\'un nouveau profil utilisateur...');
                    // Créer un nouveau document utilisateur si c'est la première connexion
                    await firebase.firestore().collection('users').doc(user.uid).set({
                        displayName: user.displayName,
                        email: user.email,
                        photoURL: user.photoURL,
                        createdAt: new Date().toISOString(),
                        backgroundColor: '#2196F3' // Couleur par défaut
                    });
                    console.log('Profil utilisateur créé avec succès');
                }

                showNotification('Connexion réussie !');
                console.log('Connexion réussie, redirection...');
                
                // Rediriger vers la page de profil
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1000);
            } catch (error) {
                console.error('Erreur détaillée de connexion Google:', {
                    code: error.code,
                    message: error.message,
                    email: error.email,
                    credential: error.credential
                });
                
                let errorMessage = 'Une erreur est survenue lors de la connexion avec Google';
                
                switch (error.code) {
                    case 'auth/popup-blocked':
                        errorMessage = 'La fenêtre pop-up a été bloquée. Veuillez autoriser les pop-ups pour ce site.';
                        break;
                    case 'auth/popup-closed-by-user':
                        errorMessage = 'La fenêtre de connexion a été fermée. Veuillez réessayer.';
                        break;
                    case 'auth/cancelled-popup-request':
                        errorMessage = 'Une seule fenêtre de connexion est autorisée à la fois.';
                        break;
                    case 'auth/account-exists-with-different-credential':
                        errorMessage = 'Un compte existe déjà avec cette adresse email mais avec une méthode de connexion différente.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Erreur de connexion réseau. Veuillez vérifier votre connexion internet.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = 'La connexion avec Google n\'est pas activée. Veuillez contacter l\'administrateur.';
                        break;
                    default:
                        errorMessage = `Erreur de connexion: ${error.message}`;
                }
                
                showError(errorMessage);
            }
        });
    }

    // Ajouter le style des notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 1100;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            border-left: 4px solid #4CAF50;
        }
        
        .notification.success i {
            color: #4CAF50;
        }
        
        .notification.error {
            border-left: 4px solid #f44336;
        }
        
        .notification.error i {
            color: #f44336;
        }
    `;
    document.head.appendChild(style);
}); 