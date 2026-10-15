import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Crosshair,
  ImageOff,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Waypoints,
} from "lucide-react";
import { GoogleMap, InfoWindow, Marker, Polygon, useLoadScript } from "@react-google-maps/api";
import { useResource } from "../api/useResource";
import { localizedField, formatPrix } from "../constants";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER = { lat: 18.0858, lng: -15.9785 };
const CONTACT_PHONE = "20203000"; // meme numero que ContactPage/Footer

// Couleurs reprises des tokens du site (--success/--danger/--primary) pour
// rester coherent visuellement avec le reste du frontend, plus un amber
// ad hoc pour "attribue" (pas de token --warning de base defini).
const STATUT_COULEURS = {
  disponible: { fill: "#10b981", stroke: "#047857", labelKey: "legendAvailable" },
  attribue: { fill: "#f59e0b", stroke: "#92400e", labelKey: "legendAssigned" },
  vendu: { fill: "#ef4444", stroke: "#b91c1c", labelKey: "legendSold" },
};
const COULEUR_RECHERCHE = { fill: "#4f46e5", stroke: "#4338ca" };

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
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / n;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / n;
  return { lat, lng };
}

export default function PlanTerrainPage() {
  const { t, i18n } = useTranslation();
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [numeroLot, setNumeroLot] = useState("");
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [mapTypeId, setMapTypeId] = useState("satellite");
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
  const { items: plans } = useResource("/plans-quartier/", { actif: "true" });
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
          photo_principale: b.photo_principale,
          vendu: b.vendu,
          statut_disponibilite: b.statut_disponibilite,
          numero_lot: b.detail_terrain.numero_lot,
          superficie_m2: b.detail_terrain.superficie_m2,
          moughataa: b.detail_terrain.moughataa,
          polygone: b.detail_terrain.polygone,
        })),
    [terrains, quartier]
  );

  const plansAffiches = useMemo(
    () => plans.filter((p) => p.actif && (!quartier || String(p.quartier) === String(quartier))),
    [plans, quartier]
  );

  const planById = useMemo(() => {
    const map = new Map();
    plansAffiches.forEach((p) => map.set(p.id, p));
    return map;
  }, [plansAffiches]);

  const zones = useMemo(
    () => zonesData.filter((z) => planById.has(z.plan)),
    [zonesData, planById]
  );

  const matchedLot = useMemo(() => {
    const search = numeroLot.trim().toLowerCase();
    if (!search) return null;
    return lots.find((lot) => (lot.numero_lot || "").toLowerCase() === search) || null;
  }, [lots, numeroLot]);

  // Zoome/recadre sur un numero de lot trouve ; sinon, sur l'ensemble des
  // lots actuellement affiches (filtres ville/quartier appliques, ou tout
  // si aucun filtre) des que la carte et les donnees sont pretes.
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    if (numeroLot.trim()) {
      setNotFound(!matchedLot);
      if (matchedLot) {
        mapRef.current.fitBounds(polygonBounds(matchedLot.polygone));
        setSelectedLot(matchedLot);
      }
      return;
    }

    setNotFound(false);
    if (lots.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      lots.forEach((lot) => lot.polygone.forEach((p) => bounds.extend(p)));
      mapRef.current.fitBounds(bounds);
    }
  }, [matchedLot, numeroLot, isLoaded, lots]);

  function handleVilleChange(value) {
    setVille(value);
    setQuartier("");
    setNumeroLot("");
  }

  function handleMapLoad(map) {
    mapRef.current = map;
  }

  function handleRecenter() {
    if (!mapRef.current || !window.google || lots.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    lots.forEach((lot) => lot.polygone.forEach((p) => bounds.extend(p)));
    mapRef.current.fitBounds(bounds);
  }

  const center = plansAffiches[0]
    ? { lat: Number(plansAffiches[0].centre_latitude), lng: Number(plansAffiches[0].centre_longitude) }
    : DEFAULT_CENTER;

  return (
    <div className="container section">
      <div className="page-header" style={{ marginBottom: "1rem" }}>
        <h1>{t("planTerrain.title")}</h1>
      </div>

      <div className="filter-panel" style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <div className="filter-group">
          <span>{t("filters.city")}</span>
          <div className="field-select-wrap field-icon-wrap">
            <MapPin className="icon-sm" />
            <select value={ville} onChange={(e) => handleVilleChange(e.target.value)}>
              <option value="">{t("filters.allCities")}</option>
              {villes.map((v) => (
                <option key={v.id} value={v.id}>
                  {localizedField(v, "nom", i18n)}
                </option>
              ))}
            </select>
            <ChevronDown className="icon-sm chevron" />
          </div>
        </div>

        {ville && (
          <div className="filter-group">
            <span>{t("filters.district")}</span>
            <div className="field-select-wrap field-icon-wrap">
              <Waypoints className="icon-sm" />
              <select
                value={quartier}
                onChange={(e) => {
                  setQuartier(e.target.value);
                  setNumeroLot("");
                }}
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
          </div>
        )}

        {quartier && (
          <div className="filter-group">
            <span>{t("planTerrain.fieldNumero")}</span>
            <div className="field-icon-wrap">
              <Search className="icon-sm" />
              <input
                value={numeroLot}
                onChange={(e) => setNumeroLot(e.target.value)}
                placeholder={t("planTerrain.fieldNumeroPlaceholder")}
              />
            </div>
          </div>
        )}
      </div>

      {!GOOGLE_MAPS_API_KEY && <p className="muted">{t("planTerrain.missingApiKey")}</p>}

      {loadError && <p className="muted">{t("planTerrain.loadError")}</p>}

      {notFound && <p className="muted">{t("planTerrain.notFound", { numero: numeroLot })}</p>}

      {plansAffiches.length === 0 && <p className="muted">{t("planTerrain.noPlan")}</p>}

      {!isLoaded && <div className="page-loading">{t("common.loading")}</div>}

      {isLoaded && (
        <div className="plan-terrain-map-wrap">
          <GoogleMap
            onLoad={handleMapLoad}
            onZoomChanged={() => mapRef.current && setZoom(mapRef.current.getZoom())}
            center={center}
            zoom={zoom}
            mapTypeId={mapTypeId}
            mapContainerStyle={{ width: "100%", height: 620, borderRadius: 12 }}
            options={{ streetViewControl: false, fullscreenControl: true, zoomControl: true, tilt: 45, heading: 0 }}
          >
            {zones.map((zone) => {
              const plan = planById.get(zone.plan);
              if (!plan) return null;
              const couleur = COULEURS_ZONES[zone.type_zone] || COULEURS_ZONES.autre;
              const estPubliee = Boolean(zone.bien && espaceById.has(zone.bien));
              return (
                <Polygon
                  key={`zone-${zone.id}`}
                  paths={zone.polygone_local.map((p) => localPointToLatLng(p.x, p.y, plan))}
                  onClick={estPubliee ? () => setSelectedZone(zone) : undefined}
                  options={{
                    fillColor: couleur.fill,
                    fillOpacity: 0.45,
                    strokeColor: couleur.stroke,
                    strokeWeight: 1.5,
                    clickable: estPubliee,
                    zIndex: 1,
                  }}
                />
              );
            })}
            {zones.map((zone) => {
              const plan = planById.get(zone.plan);
              if (!plan) return null;
              const estPubliee = Boolean(zone.bien && espaceById.has(zone.bien));
              return (
                <Marker
                  key={`zone-label-${zone.id}`}
                  position={polygonCentroid(zone.polygone_local.map((p) => localPointToLatLng(p.x, p.y, plan)))}
                  label={{ text: zone.nom, fontSize: "10px", fontWeight: "600", color: "#1f2937" }}
                  icon={{
                    url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E",
                  }}
                  onClick={estPubliee ? () => setSelectedZone(zone) : undefined}
                  clickable={estPubliee}
                />
              );
            })}

            {selectedZone && espaceById.get(selectedZone.bien) && (
              <InfoWindow
                position={polygonCentroid(
                  selectedZone.polygone_local.map((p) => localPointToLatLng(p.x, p.y, planById.get(selectedZone.plan)))
                )}
                onCloseClick={() => setSelectedZone(null)}
              >
                <div style={{ minWidth: 200, maxWidth: 240 }}>
                  <strong>{selectedZone.nom}</strong>
                  {selectedZone.moughataa && (
                    <div className="muted" style={{ fontSize: "0.78rem", marginTop: "0.2rem" }}>
                      {t("planTerrain.lotMoughataa", { moughataa: selectedZone.moughataa })}
                    </div>
                  )}
                  {selectedZone.superficie_m2 && (
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {t("planTerrain.lotSuperficie", { superficie: selectedZone.superficie_m2 })}
                    </div>
                  )}
                  <div style={{ marginTop: "0.5rem" }}>
                    <Link
                      to={`/biens/${espaceById.get(selectedZone.bien).reference}`}
                      className="btn btn-primary btn-small"
                    >
                      {t("planTerrain.viewBien")}
                    </Link>
                  </div>
                </div>
              </InfoWindow>
            )}

            {lots.map((lot) => {
              const estMatch = matchedLot?.reference === lot.reference;
              const couleur = estMatch ? COULEUR_RECHERCHE : STATUT_COULEURS[statutLot(lot)];
              return (
                <Polygon
                  key={lot.reference}
                  paths={lot.polygone}
                  onClick={() => setSelectedLot(lot)}
                  options={{
                    fillColor: couleur.fill,
                    fillOpacity: matchedLot && !estMatch ? 0.15 : 0.4,
                    strokeColor: couleur.stroke,
                    strokeWeight: estMatch ? 3 : 2,
                    clickable: true,
                    zIndex: 2,
                  }}
                />
              );
            })}

            {selectedLot && (
              <InfoWindow position={selectedLot.polygone[0]} onCloseClick={() => setSelectedLot(null)}>
                <div style={{ minWidth: 220, maxWidth: 240 }}>
                  {selectedLot.photo_principale ? (
                    <img
                      src={selectedLot.photo_principale}
                      alt=""
                      style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, marginBottom: "0.4rem" }}
                    />
                  ) : (
                    <div className="bien-card-media-placeholder" style={{ height: 90, marginBottom: "0.4rem" }}>
                      <ImageOff className="icon-sm" />
                    </div>
                  )}
                  <strong>{localizedField(selectedLot, "titre", i18n)}</strong>
                  <div className="muted" style={{ fontSize: "0.8rem", margin: "0.2rem 0" }}>
                    {t("planTerrain.lotNumero", { numero: selectedLot.numero_lot })}
                  </div>
                  {selectedLot.moughataa && (
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {t("planTerrain.lotMoughataa", { moughataa: selectedLot.moughataa })}
                    </div>
                  )}
                  {selectedLot.superficie_m2 && (
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {t("planTerrain.lotSuperficie", { superficie: selectedLot.superficie_m2 })}
                    </div>
                  )}
                  <div style={{ margin: "0.4rem 0", fontWeight: 600 }}>
                    {formatPrix(t, selectedLot.prix, selectedLot.unite_prix)}
                  </div>
                  <span
                    className="plan-terrain-statut-badge"
                    style={{
                      background: STATUT_COULEURS[statutLot(selectedLot)].fill,
                    }}
                  >
                    {t(`planTerrain.${STATUT_COULEURS[statutLot(selectedLot)].labelKey}`)}
                  </span>
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                    <Link to={`/biens/${selectedLot.reference}`} className="btn btn-primary btn-small">
                      {t("planTerrain.viewBien")}
                    </Link>
                    <a href={`tel:${CONTACT_PHONE}`} className="btn btn-ghost btn-small" title={t("planTerrain.call")}>
                      <Phone className="icon-sm" />
                    </a>
                    <a
                      href={`https://wa.me/222${CONTACT_PHONE}?text=${encodeURIComponent(
                        t("planTerrain.whatsappMessage", { numero: selectedLot.numero_lot })
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-small"
                      title={t("planTerrain.whatsapp")}
                    >
                      <MessageCircle className="icon-sm" />
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          <div className="plan-terrain-controls">
            <button
              type="button"
              className="plan-terrain-control-btn"
              onClick={() => setMapTypeId((m) => (m === "satellite" ? "roadmap" : "satellite"))}
              title={t("planTerrain.toggleMapType")}
              aria-label={t("planTerrain.toggleMapType")}
            >
              <Layers className="icon-sm" />
            </button>
            <button
              type="button"
              className="plan-terrain-control-btn"
              onClick={handleRecenter}
              title={t("planTerrain.recenter")}
              aria-label={t("planTerrain.recenter")}
            >
              <Crosshair className="icon-sm" />
            </button>
          </div>

          <div className="plan-terrain-legend">
            {Object.entries(STATUT_COULEURS).map(([key, c]) => (
              <div key={key} className="plan-terrain-legend-item">
                <span className="plan-terrain-legend-swatch" style={{ background: c.fill }} />
                {t(`planTerrain.${c.labelKey}`)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
