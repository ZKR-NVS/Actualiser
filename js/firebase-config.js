// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCHm16ASNwwAh0GmqbqRnd2hfeGWx3CbrM",
    authDomain: "actualfr-58906.firebaseapp.com",
    projectId: "actualfr-58906",
    storageBucket: "actualfr-58906.firebasestorage.app",
    messagingSenderId: "769786541629",
    appId: "1:769786541629:web:7c6f3dfd8e7195683b9c54",
    measurementId: "G-PL5K4LEFGB"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Initialize Auth with persistence
    const auth = firebase.auth();
    auth.useDeviceLanguage(); // Utiliser la langue du navigateur
    
    // Configurer la persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch((error) => {
            console.error("Erreur de configuration de la persistence:", error);
        });

    // Rendre les variables disponibles globalement
    window.auth = auth;

    // Initialiser Firestore uniquement si nécessaire
    let firestoreDb = null;
    window.getFirestore = function() {
        if (!firestoreDb) {
            firestoreDb = firebase.firestore();
        }
        return firestoreDb;
    }
} else {
    console.error('Firebase n\'est pas chargé. Vérifiez que les scripts Firebase sont bien inclus.');
} 