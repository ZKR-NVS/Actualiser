# Mode Maintenance - Instructions Simples

## 🔴 Pour ACTIVER le mode maintenance

1. Dans `vercel.json`, copiez exactement ce code :
```json
{
    "version": 2,
    "builds": [
        {
            "src": "**/*",
            "use": "@vercel/static"
        }
    ],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {
                    "key": "Cache-Control",
                    "value": "no-store, no-cache, must-revalidate"
                }
            ]
        },
        {
            "source": "/(styles|js|assets)/(.*)",
            "headers": [
                {
                    "key": "Cache-Control",
                    "value": "public, max-age=31536000, immutable"
                }
            ]
        }
    ],
    "redirects": [
        {
            "source": "/((?!maintenance.html).*)",
            "destination": "/maintenance.html",
            "permanent": false
        }
    ]
}
```

2. Dans `robots.txt`, RETIREZ les # devant ces lignes :
```txt
User-agent: *
Disallow: /
Allow: /maintenance.html
```

3. Tapez cette commande :
```bash
vercel --prod -f
```

## 🟢 Pour DÉSACTIVER le mode maintenance

1. Dans `vercel.json`, copiez exactement ce code :
```json
{
    "version": 2,
    "builds": [
        {
            "src": "**/*",
            "use": "@vercel/static"
        }
    ],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {
                    "key": "Cache-Control",
                    "value": "public, max-age=0, must-revalidate"
                },
                {
                    "key": "Pragma",
                    "value": "no-cache"
                },
                {
                    "key": "Expires",
                    "value": "0"
                },
                {
                    "key": "Access-Control-Allow-Origin",
                    "value": "*"
                },
                {
                    "key": "Access-Control-Allow-Methods",
                    "value": "GET, POST, PUT, DELETE, OPTIONS"
                },
                {
                    "key": "Access-Control-Allow-Headers",
                    "value": "X-Requested-With, Content-Type, Authorization"
                }
            ]
        },
        {
            "source": "/static/(.*)",
            "headers": [
                {
                    "key": "Cache-Control",
                    "value": "public, max-age=31536000, immutable"
                }
            ]
        }
    ],
    "redirects": [
        {
            "source": "/maintenance.html",
            "destination": "/",
            "permanent": false
        }
    ]
}
```

2. Dans `robots.txt`, AJOUTEZ les # devant ces lignes :
```txt
# User-agent: *
# Disallow: /
# Allow: /maintenance.html
```

3. Tapez cette commande :
```bash
vercel --prod -f
```

## ⚠️ IMPORTANT
- Attendez 2-3 minutes après chaque commande
- Testez TOUJOURS dans une fenêtre de navigation privée
- Si ça ne marche pas tout de suite, attendez quelques minutes et réessayez

## 🔜 Prochaine étape
Un toggle switch sera ajouté dans le panneau d'administration pour activer/désactiver le mode maintenance plus facilement.

## ℹ️ Notes importantes

### Temps de propagation
- Attendre 1-2 minutes après le déploiement
- Vérifier que la redirection fonctionne correctement
- Tester dans une navigation privée

### Cache et performance
- Mode normal : Cache optimisé pour la performance
- Mode maintenance : Cache désactivé pour forcer la redirection
- Les assets statiques restent toujours en cache

### SEO et robots
- Mode normal : Indexation complète autorisée
- Mode maintenance : Indexation bloquée sauf page maintenance
- L'indexation reprend automatiquement après désactivation

### Bonnes pratiques
- Planifier la maintenance en période creuse
- Informer les utilisateurs à l'avance si possible
- Garder une copie de sauvegarde des fichiers de configuration
- Tester le mode maintenance sur un preview deployment avant de l'activer en production

## 🔍 Vérification après changements

### Après activation
1. Vérifier que toutes les URLs redirigent vers maintenance.html
2. Confirmer que les assets (CSS/JS) sont toujours accessibles
3. Tester dans différents navigateurs

### Après désactivation
1. Vérifier que le site principal est accessible
2. Confirmer que maintenance.html redirige vers l'accueil
3. Vérifier que robots.txt est correctement configuré 