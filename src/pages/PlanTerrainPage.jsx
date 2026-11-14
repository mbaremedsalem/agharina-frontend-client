import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, Crosshair, Eye, EyeOff, MapPin, Navigation, Search, Share2, Waypoints, X } from "lucide-react";
import { FLOAT_PANE, GoogleMap, Marker, OverlayViewF, Polygon, useLoadScript } from "@react-google-maps/api";
import { useResource } from "../api/useResource";
import { localizedField, formatPrix } from "../constants";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER = { lat: 18.0858, lng: -15.9785 };

// Couleurs reprises des tokens du site (--success/--danger/--primary) pour
// rester coherent visuellement avec le reste du frontend, plus un amber
// ad hoc pour "attribue" (pas de token --warning de base defini).
const STATUT_COULEURS = {
  disponible: { fill: "#10b981", stroke: "#047857", labelKey: "legendAvailable" },
  attribue: { fill: "#f59e0b", stroke: "#92400e", labelKey: "legendAssigned" },
  vendu: { fill: "#ef4444", stroke: "#b91c1c", labelKey: "legendSold" },
};

// Style "cadastre" sur satellite : contour noir fin, remplissage tres
// leger (juste de quoi deviner le statut) ; le lot selectionne ressort en
// contour blanc epais.
const LOT_STROKE = "#0b0b0f";
const LOT_SELECTED_STROKE = "#ffffff";

// Zones non-vendables du plan (espace vert, equipement public, mosquee...) :
// meme palette que l'editeur admin, pour que le client voie exactement le
// meme plan que celui uploade cote admin - pas seulement les terrains.
const COULEURS_ZONES = {
  espace_vert: { fill: "#86efac", stroke: "#15803d" },
  espace_public: { fill: "#fde68a", stroke: "#b45309" },
  equipement_public: { fill: "#93c5fd", stroke: "#1d4ed8" },
  mosquee: { fill: "#c4b5fd", stroke: "#6d28d9" },
  autre: { fill: "#d1d5db", stroke: "#4b5563" },
};

// Icone prefixee au nom de la zone (meme convention que l'editeur admin).
const ICONES_ZONES = {
  espace_vert: "🌳",
  espace_public: "🏞️",
  equipement_public: "🏛️",
  mosquee: "🕌",
  autre: "📍",
};

// Types de fond de carte proposes au client (hybride par defaut).
const TYPES_CARTE = [
  { id: "satellite", labelKey: "mapSatellite" },
  { id: "hybrid", labelKey: "mapHybrid" },
  { id: "roadmap", labelKey: "mapPlan" },
];

const TRANSPARENT_ICON = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

function statutLot(lot) {
  if (lot.vendu) return "vendu";
  if (lot.statut_disponibilite === "attribue") return "attribue";
  return "disponible";
}

function polygonBounds(points) {
  const bounds = new window.google.maps.LatLngBounds();
  points.forEach((p) => bounds.extend(p));
  return bounds;
}

function metersToLatOffset(m) {
  return m / 111320;
}

function metersToLngOffset(m, atLat) {
  return m / (111320 * Math.cos((atLat * Math.PI) / 180));
}

/**
 * Convertit un point local fractionnaire (polygone_local d'une ZonePlan,
 * 0..1 / coin haut-gauche) en lat/lng absolue, compte tenu de la position
 * du PlanQuartier auquel il appartient. Memes conventions de signe que
 * GoogleMapPlanEditor.jsx (admin) - meme transform, cote lecture seule.
 */
function localPointToLatLng(fx, fy, plan) {
  const centerLat = Number(plan.centre_latitude);
  const centerLng = Number(plan.centre_longitude);
  const largeurM = Number(plan.largeur_m);
  const hauteurM = Number(plan.hauteur_m);
  const rotationDeg = Number(plan.rotation_deg);
  const dxLocal = (fx - 0.5) * largeurM;
  const dyLocal = (fy - 0.5) * hauteurM;
  const rad = (rotationDeg * Math.PI) / 180;
  const dxScreen = dxLocal * Math.cos(rad) - dyLocal * Math.sin(rad);
  const dyScreen = dxLocal * Math.sin(rad) + dyLocal * Math.cos(rad);
  return {
    lat: centerLat - metersToLatOffset(dyScreen),
    lng: centerLng + metersToLngOffset(dxScreen, centerLat),
  };
}

function polygonCentroid(points) {
  const n = points.length;
  const lat = points.reduce((sum, p) => sum + Number(p.lat), 0) / n;
  const lng = points.reduce((sum, p) => sum + Number(p.lng), 0) / n;
  return { lat, lng };
}

const fmtM = (v) => `${Number(v)}m`;

/**
 * Cotes du lot facon cadastre : les 4 cotes d'un rectangle ("35m 20m 35m
 * 20m"), ou base/hauteur/hypotenuse d'un lot triangulaire.
 */
function cotesTexte(o) {
  if (o.longueur_m && o.largeur_m) {
    return [o.longueur_m, o.largeur_m, o.longueur_m, o.largeur_m].map(fmtM).join("  ");
  }
  const tri = [o.base_m, o.hauteur_m, o.hypotenuse_m].filter(Boolean);
  if (tri.length) return tri.map(fmtM).join("  ");
  return null;
}

function itineraireUrl({ lat, lng }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// Le popup flotte au-dessus du centre du lot, pointe vers lui.
const popupOffset = (w, h) => ({ x: -w / 2, y: -h - 12 });

/**
 * Fiche popup "tableau" ancree sur la carte : en-tete (titre + statut),
 * lignes libelle/valeur, puis barre d'actions Itinéraire / fiche / Partager.
 * Les clics ne traversent pas jusqu'a la carte (sinon le clic carte
 * fermerait aussitot le popup).
 */
function PlanInfoCard({ titre, statut, rows, position, lien, shareText, onClose, t }) {
  return (
    <OverlayViewF position={position} mapPaneName={FLOAT_PANE} getPixelPositionOffset={popupOffset}>
      <div
        className="plan-card"
        ref={(el) => el && window.google?.maps?.OverlayView?.preventMapHitsAndGesturesFrom?.(el)}
      >
        <div className="plan-card-head">
          <div className="plan-card-title">{titre}</div>
          {statut && (
            <span className="plan-card-statut" style={{ background: STATUT_COULEURS[statut].fill }}>
              {t(`planTerrain.${STATUT_COULEURS[statut].labelKey}`)}
            </span>
          )}
          <button type="button" className="plan-card-close" onClick={onClose} aria-label={t("planTerrain.close")}>
            <X size={15} />
          </button>
        </div>

        <table className="plan-card-table">
          <tbody>
            {rows
              .filter((r) => r.value)
              .map((r) => (
                <tr key={r.label}>
                  <th>{r.label}</th>
                  <td>{r.value}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="plan-card-actions">
          <a href={itineraireUrl(position)} target="_blank" rel="noreferrer" className="plan-card-btn plan-card-btn-dir">
            <Navigation size={15} />
            {t("planTerrain.directions")}
          </a>
          {lien && (
            <Link to={lien} className="plan-card-btn plan-card-btn-main">
              {t("planTerrain.viewBien")}
            </Link>
          )}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="plan-card-btn plan-card-btn-share"
          >
            <Share2 size={15} />
            {t("planTerrain.share")}
          </a>
        </div>
      </div>
    </OverlayViewF>
  );
}

export default function PlanTerrainPage() {
  const { t, i18n } = useTranslation();
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  // numeroSaisi = champ en cours de frappe ; numeroLot = numero
  // effectivement recherche (applique au clic sur "Rechercher").
  const [numeroSaisi, setNumeroSaisi] = useState("");
  const [numeroLot, setNumeroLot] = useState("");
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [afficherLots, setAfficherLots] = useState(true);
  const [mapTypeId, setMapTypeId] = useState("hybrid");
  const [hoveredLot, setHoveredLot] = useState(null);
  const mapRef = useRef(null);
  const [zoom, setZoom] = useState(16);

  const { items: villes } = useResource("/villes/");
  const { items: quartiers } = useResource("/quartiers/", ville ? { ville } : undefined);
  const quartierOptions = useMemo(
    () => quartiers.filter((q) => String(q.ville) === String(ville)),
    [quartiers, ville]
  );

  // Tous les plans/terrains actifs sont charges d'emblee (pas d'attente
  // d'un choix de quartier) : la recherche ville/quartier/numero ne fait
  // que filtrer/zoomer sur ce qui est deja affiche - c'est exactement le
  // meme plan que celui uploade cote admin (meme PlanQuartier/polygones).
  // Tous les plans (actifs ou non) : les zones (mosquees, parcs...) sont
  // stockees en coordonnees relatives a l'image de leur plan, il faut donc
  // la position du plan pour les placer - meme s'il est desactive, comme
  // les terrains du meme plan qui, eux, restent affiches.
  const { items: plans } = useResource("/plans-quartier/");
  const { items: terrains } = useResource("/biens/", { type_bien: "terrain", actif: "true" });
  const { items: espaces } = useResource("/biens/", { type_bien: "espace", actif: "true" });
  const { items: zonesData } = useResource("/zones-plan/");

  // ZonePlan.bien n'est qu'un id (pas la reference) : necessaire pour
  // construire le lien vers la fiche publique de l'espace une fois publie.
  const espaceById = useMemo(() => {
    const map = new Map();
    espaces.forEach((e) => map.set(e.id, e));
    return map;
  }, [espaces]);

  const lots = useMemo(
    () =>
      terrains
        .filter((b) => Array.isArray(b.detail_terrain?.polygone) && b.detail_terrain.polygone.length >= 3)
        .filter((b) => !quartier || String(b.quartier?.id ?? b.quartier) === String(quartier))
        .map((b) => ({
          reference: b.reference,
          titre: b.titre,
          titre_ar: b.titre_ar,
          prix: b.prix,
          unite_prix: b.unite_prix,
          vendu: b.vendu,
          statut_disponibilite: b.statut_disponibilite,
          quartier: b.quartier,
          numero_lot: b.detail_terrain.numero_lot,
          superficie_m2: b.detail_terrain.superficie_m2,
          longueur_m: b.detail_terrain.longueur_m,
          largeur_m: b.detail_terrain.largeur_m,
          base_m: b.detail_terrain.base_m,
          hauteur_m: b.detail_terrain.hauteur_m,
          hypotenuse_m: b.detail_terrain.hypotenuse_m,
          moughataa: b.detail_terrain.moughataa,
          adresse: b.adresse_complete,
          polygone: b.detail_terrain.polygone,
          centre: polygonCentroid(b.detail_terrain.polygone),
        })),
    [terrains, quartier]
  );

  const plansAffiches = useMemo(
    () =>
      plans.filter(
        (p) =>
          p.centre_latitude != null &&
          p.centre_longitude != null &&
          p.largeur_m != null &&
          p.hauteur_m != null &&
          (!quartier || String(p.quartier) === String(quartier))
      ),
    [plans, quartier]
  );

  const planById = useMemo(() => {
    const map = new Map();
    plansAffiches.forEach((p) => map.set(p.id, p));
    return map;
  }, [plansAffiches]);

  const zones = useMemo(
    () =>
      zonesData
        .filter((z) => planById.has(z.plan) && Array.isArray(z.polygone_local) && z.polygone_local.length >= 3)
        .map((z) => {
          const plan = planById.get(z.plan);
          const paths = z.polygone_local.map((p) => localPointToLatLng(p.x, p.y, plan));
          return { ...z, paths, centre: polygonCentroid(paths), estPubliee: Boolean(z.bien && espaceById.has(z.bien)) };
        }),
    [zonesData, planById, espaceById]
  );

  const matchedLot = useMemo(() => {
    const search = numeroLot.trim().toLowerCase();
    if (!search) return null;
    return lots.find((lot) => (lot.numero_lot || "").toLowerCase() === search) || null;
  }, [lots, numeroLot]);

  function fitAll() {
    if (!mapRef.current || !window.google || lots.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    lots.forEach((lot) => lot.polygone.forEach((p) => bounds.extend(p)));
    mapRef.current.fitBounds(bounds);
  }

  // Centre la carte sur le lot choisi en laissant de la place au-dessus
  // pour le popup.
  function focusLot(lot) {
    setSelectedZone(null);
    setSelectedLot(lot);
    if (!mapRef.current) return;
    mapRef.current.panTo(lot.centre);
    mapRef.current.panBy(0, -140);
  }

  // Zoome sur le numero recherche ; sinon, cadre l'ensemble des lots
  // affiches (filtres ville/quartier appliques) des que tout est pret.
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    if (numeroLot.trim()) {
      setNotFound(!matchedLot);
      if (matchedLot) {
        mapRef.current.fitBounds(polygonBounds(matchedLot.polygone));
        // fitBounds sur un seul lot zoome trop : on plafonne a 19.
        window.google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
          if (mapRef.current.getZoom() > 19) mapRef.current.setZoom(19);
          focusLot(matchedLot);
        });
      }
      return;
    }

    setNotFound(false);
    fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedLot, numeroLot, isLoaded, lots]);

  function handleVilleChange(value) {
    setVille(value);
    setQuartier("");
    setNumeroSaisi("");
    setNumeroLot("");
  }

  function handleSearch(e) {
    e.preventDefault();
    setNumeroLot(numeroSaisi);
  }

  function nomQuartier(lot) {
    const q = lot.quartier;
    if (q && typeof q === "object") return localizedField(q, "nom", i18n);
    const found = quartiers.find((x) => String(x.id) === String(q));
    return found ? localizedField(found, "nom", i18n) : null;
  }

  const plansActifs = plansAffiches.filter((p) => p.actif);
  const centrePlan = plansActifs[0] || plansAffiches[0];
  const center = centrePlan
    ? { lat: Number(centrePlan.centre_latitude), lng: Number(centrePlan.centre_longitude) }
    : DEFAULT_CENTER;

  const selectedEspace = selectedZone && espaceById.get(selectedZone.bien);

  return (
    <div className="container section plan-page">
      <form className="plan-search" onSubmit={handleSearch}>
        <div className="plan-search-field">
          <MapPin className="icon-sm" />
          <select value={ville} onChange={(e) => handleVilleChange(e.target.value)} aria-label={t("filters.city")}>
            <option value="">{t("filters.allCities")}</option>
            {villes.map((v) => (
              <option key={v.id} value={v.id}>
                {localizedField(v, "nom", i18n)}
              </option>
            ))}
          </select>
          <ChevronDown className="icon-sm chevron" />
        </div>

        <div className="plan-search-field">
          <Waypoints className="icon-sm" />
          <select
            value={quartier}
            disabled={!ville}
            onChange={(e) => {
              setQuartier(e.target.value);
              setNumeroSaisi("");
              setNumeroLot("");
            }}
            aria-label={t("filters.district")}
          >
            <option value="">{t("filters.allDistricts")}</option>
            {quartierOptions.map((q) => (
              <option key={q.id} value={q.id}>
                {localizedField(q, "nom", i18n)}
              </option>
            ))}
          </select>
          <ChevronDown className="icon-sm chevron" />
        </div>

        <div className="plan-search-field">
          <Search className="icon-sm" />
          <input
            value={numeroSaisi}
            onChange={(e) => setNumeroSaisi(e.target.value)}
            placeholder={t("planTerrain.fieldNumeroPlaceholder")}
            aria-label={t("planTerrain.fieldNumero")}
            inputMode="numeric"
          />
        </div>

        <button type="submit" className="plan-search-btn">
          {t("planTerrain.search")}
        </button>
      </form>

      {!GOOGLE_MAPS_API_KEY && <p className="muted">{t("planTerrain.missingApiKey")}</p>}
      {loadError && <p className="muted">{t("planTerrain.loadError")}</p>}
      {notFound && <p className="plan-notfound">{t("planTerrain.notFound", { numero: numeroLot })}</p>}
      {lots.length === 0 && zones.length === 0 && <p className="muted">{t("planTerrain.noPlan")}</p>}
      {!isLoaded && <div className="page-loading">{t("common.loading")}</div>}

      {isLoaded && (
        <div className="plan-map">
          <GoogleMap
            onLoad={(map) => (mapRef.current = map)}
            onZoomChanged={() => mapRef.current && setZoom(mapRef.current.getZoom())}
            onClick={() => {
              setSelectedLot(null);
              setSelectedZone(null);
            }}
            center={center}
            zoom={zoom}
            mapTypeId={mapTypeId}
            mapContainerStyle={{ width: "100%", height: "100%" }}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              rotateControl: false,
              zoomControl: true,
              clickableIcons: false,
              tilt: 0,
              gestureHandling: "greedy",
            }}
          >
            {afficherLots &&
              zones.map((zone) => {
                const couleur = COULEURS_ZONES[zone.type_zone] || COULEURS_ZONES.autre;
                return (
                  <Polygon
                    key={`zone-${zone.id}`}
                    paths={zone.paths}
                    onClick={
                      zone.estPubliee
                        ? () => {
                            setSelectedLot(null);
                            setSelectedZone(zone);
                          }
                        : undefined
                    }
                    options={{
                      fillColor: couleur.fill,
                      fillOpacity: 0.45,
                      strokeColor: LOT_STROKE,
                      strokeWeight: 1.6,
                      clickable: zone.estPubliee,
                      zIndex: 1,
                    }}
                  />
                );
              })}
            {afficherLots &&
              zoom >= 15 &&
              zones.map((zone) => (
                <Marker
                  key={`zone-label-${zone.id}`}
                  position={zone.centre}
                  label={{
                    text: `${ICONES_ZONES[zone.type_zone] || ICONES_ZONES.autre} ${zone.nom}`,
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#ffffff",
                    className: "plan-zone-marker-label",
                  }}
                  icon={{ url: TRANSPARENT_ICON }}
                  clickable={false}
                />
              ))}

            {afficherLots &&
              lots.map((lot) => {
                const estSelection = selectedLot?.reference === lot.reference;
                const estSurvole = hoveredLot === lot.reference;
                const couleur = STATUT_COULEURS[statutLot(lot)];
                return (
                  <Polygon
                    key={lot.reference}
                    paths={lot.polygone}
                    onClick={() => focusLot(lot)}
                    onMouseOver={() => setHoveredLot(lot.reference)}
                    onMouseOut={() => setHoveredLot((h) => (h === lot.reference ? null : h))}
                    options={{
                      fillColor: estSelection ? LOT_SELECTED_STROKE : couleur.fill,
                      fillOpacity: estSelection ? 0.3 : estSurvole ? 0.35 : 0.12,
                      strokeColor: estSelection ? LOT_SELECTED_STROKE : LOT_STROKE,
                      strokeOpacity: 1,
                      strokeWeight: estSelection ? 3.5 : 1.6,
                      clickable: true,
                      zIndex: estSelection ? 3 : 2,
                    }}
                  />
                );
              })}

            {selectedLot && (
              <PlanInfoCard
                t={t}
                position={selectedLot.centre}
                titre={localizedField(selectedLot, "titre", i18n) || t("planTerrain.lotNumero", { numero: selectedLot.numero_lot })}
                statut={statutLot(selectedLot)}
                lien={`/biens/${selectedLot.reference}`}
                onClose={() => setSelectedLot(null)}
                shareText={t("planTerrain.shareMessage", {
                  numero: selectedLot.numero_lot,
                  url: `${window.location.origin}/biens/${selectedLot.reference}`,
                })}
                rows={[
                  { label: t("planTerrain.rowMoughataa"), value: selectedLot.moughataa },
                  { label: t("planTerrain.rowZone"), value: nomQuartier(selectedLot) || selectedLot.adresse },
                  { label: t("planTerrain.rowLot"), value: selectedLot.numero_lot },
                  {
                    label: t("planTerrain.rowSuperficie"),
                    value: selectedLot.superficie_m2 && t("planTerrain.lotSuperficie", { superficie: selectedLot.superficie_m2 }),
                  },
                  { label: t("planTerrain.rowCotes"), value: cotesTexte(selectedLot) },
                  {
                    label: t("planTerrain.rowPrix"),
                    value: Number(selectedLot.prix) > 0 && formatPrix(t, selectedLot.prix, selectedLot.unite_prix),
                  },
                ]}
              />
            )}

            {selectedZone && selectedEspace && (
              <PlanInfoCard
                t={t}
                position={selectedZone.centre}
                titre={`${ICONES_ZONES[selectedZone.type_zone] || ICONES_ZONES.autre} ${selectedZone.nom}`}
                lien={`/biens/${selectedEspace.reference}`}
                onClose={() => setSelectedZone(null)}
                shareText={`${selectedZone.nom} - ${window.location.origin}/biens/${selectedEspace.reference}`}
                rows={[
                  { label: t("planTerrain.rowMoughataa"), value: selectedZone.moughataa },
                  { label: t("planTerrain.rowZone"), value: selectedZone.adresse },
                  {
                    label: t("planTerrain.rowSuperficie"),
                    value: selectedZone.superficie_m2 && t("planTerrain.lotSuperficie", { superficie: selectedZone.superficie_m2 }),
                  },
                  { label: t("planTerrain.rowCotes"), value: cotesTexte(selectedZone) },
                ]}
              />
            )}
          </GoogleMap>

          <div className="plan-map-types" role="radiogroup" aria-label={t("planTerrain.mapType")}>
            {TYPES_CARTE.map((type) => (
              <button
                key={type.id}
                type="button"
                role="radio"
                aria-checked={mapTypeId === type.id}
                className={`plan-map-type${mapTypeId === type.id ? " is-active" : ""}`}
                onClick={() => setMapTypeId(type.id)}
              >
                {t(`planTerrain.${type.labelKey}`)}
              </button>
            ))}
          </div>

          <div className="plan-map-controls">
            <button
              type="button"
              className={`plan-map-btn${afficherLots ? " is-on" : ""}`}
              onClick={() => setAfficherLots((v) => !v)}
              title={t("planTerrain.toggleLots")}
              aria-label={t("planTerrain.toggleLots")}
              aria-pressed={afficherLots}
            >
              {afficherLots ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button
              type="button"
              className="plan-map-btn"
              onClick={fitAll}
              title={t("planTerrain.recenter")}
              aria-label={t("planTerrain.recenter")}
            >
              <Crosshair size={18} />
            </button>
          </div>

          <div className="plan-map-legend">
            {Object.entries(STATUT_COULEURS).map(([key, c]) => (
              <span key={key} className="plan-map-legend-item">
                <span className="plan-map-legend-swatch" style={{ background: c.fill }} />
                {t(`planTerrain.${c.labelKey}`)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
