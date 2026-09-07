# Agharina Client Frontend

Site public (React, Vite, JavaScript) pour rechercher, consulter et reserver
des biens immobiliers Agharina. Projet independant du backend Django et de
l'admin : son propre `package.json`, son propre serveur de dev.

## Demarrage

```bash
npm install
npm run dev
```

Par defaut sur `http://localhost:5173`, appelle l'API sur
`http://127.0.0.1:8000/api` (voir `.env`). La navigation/recherche est
publique ; la reservation, le profil et les points de fidelite necessitent
un compte (inscription/connexion géré par ce frontend, token stocke
localement).

### Carte Google Maps

La cle est configuree dans `.env` (`VITE_GOOGLE_MAPS_API_KEY`). Si elle
venait a manquer ou etre invalide, la carte affiche un message "Carte
indisponible" au lieu de planter (aucun crash cote app). Aucune config
supplementaire (Map ID personnalise) n'est necessaire : les marqueurs
utilisent l'API classique (`Marker`/`InfoWindow`).

### Traduction FR / AR

Selecteur de langue dans l'en-tete (bouton "FR"/"AR"). L'arabe bascule tout
le site en RTL (`dir="rtl"` sur `<html>`) : mise en page miroir, icones
directionnelles adaptees, police "Noto Sans Arabic". Textes geres via
`i18next` (`src/i18n/locales/fr.json` et `ar.json`) ; la langue choisie est
memorisee en `localStorage`.

## Pages

- **Accueil** : bandeau d'offres qui defile automatiquement (stepper, une
  offre a la fois, 10s chacune, image + texte en overlay ou degrade si pas
  d'image), recherche rapide (transaction/type/ville/mots-cles), biens
  recents.
- **/biens** : liste filtrable (type, transaction, ville/quartier, budget,
  chambres, disponibilite, texte libre) avec bascule **Liste / Carte**.
  Les filtres pilotent directement les query params de l'API DRF
  (`type_bien`, `ville`, `prix_min`, `disponible_du`, ...).
- **/biens/:reference** : galerie photos/videos (lightbox), caracteristiques,
  equipements, calendrier de disponibilite, carte de localisation, contact
  du gestionnaire, bouton **Reserver / Faire une demande d'achat** (redirige
  vers la connexion si necessaire, puis ouvre un formulaire de reservation
  qui cree une transaction `en_attente` cote API).
- **/connexion**, **/inscription** : authentification. L'inscription accepte
  un code de parrainage (pre-rempli si on arrive via `/invite/:code`).
- **/mon-compte** (protegee) : profil (modifiable), points de fidelite +
  historique, lien et code d'invitation a partager.
- **/offres** : offres et promotions actives.

## Structure

```
src/
  api/client.js           fetch wrapper (auth token, pagination DRF)
  api/useResource.js       hooks de chargement (liste complete / page unique)
  context/AuthContext.jsx  connexion / inscription / deconnexion
  i18n/                    config i18next + locales/fr.json, ar.json
  components/              Header, Footer, BienCard, FilterPanel, BienMap,
                            MediaGallery, AvailabilityCalendar, Pagination,
                            OffersStepper, ReservationModal, Modal,
                            LanguageSwitcher, ProtectedRoute
  pages/                   HomePage, BiensListPage, BienDetailPage,
                            OffresPage, LoginPage, RegisterPage, InvitePage,
                            AccountPage
  constants.js             libelles traduits (types de bien, transaction, prix)
```
