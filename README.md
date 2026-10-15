# Agharina — Client Frontend

Application web client d'**Agharina**, plateforme immobilière mauritanienne (location, achat et vente de biens). Interface publique permettant aux visiteurs de consulter les biens et aux clients inscrits de gérer leurs réservations et leur programme de fidélité.

🔗 Démo : [agharina-frontend-client.vercel.app](https://agharina-frontend-client.vercel.app/)

## Fonctionnalités

- **Catalogue de biens** — liste et fiche détaillée de chaque bien (`/biens`), avec biens récents mis en avant sur l'accueil.
- **Offres** — parcours de sélection d'offres (`OffresPage`, `OffersStepper`).
- **Compte client** — profil, points de fidélité, réservations en cours (avec alerte de fin de location proche), échange de cadeaux, programme de parrainage/invitation.
- **Authentification** — inscription et connexion (`RegisterPage`, `LoginPage`).
- **Cartographie** — localisation des biens via Leaflet/OpenStreetMap.
- **Multilingue** — internationalisation via i18next / react-i18next.
- **Pages institutionnelles** — à propos, contact.

## Stack technique

- [React 19](https://react.dev/) + [React Router 7](https://reactrouter.com/)
- [Vite 5](https://vitejs.dev/)
- [i18next](https://www.i18next.com/) / react-i18next
- [Leaflet](https://leafletjs.com/) / react-leaflet
- [lucide-react](https://lucide.dev/) (icônes)

## Démarrer le projet

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production
npm run preview  # prévisualiser le build
```

## Configuration

L'URL de l'API backend se configure via la variable d'environnement `VITE_API_URL` (par défaut `http://127.0.0.1:8000/api` en développement).

```bash
# .env
VITE_API_URL=https://votre-api.example.com/api
```

## Structure

```
src/
  api/        # client HTTP et hooks de données (useResource, usePaginatedResource)
  components/ # BienCard, OffersStepper, etc.
  context/    # AuthContext
  pages/      # HomePage, BiensListPage, BienDetailPage, OffresPage,
              # AccountPage, LoginPage, RegisterPage, InvitePage,
              # AboutPage, ContactPage
```
