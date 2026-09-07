import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ImageOff } from "lucide-react";
import { formatPrix, localizedField } from "../constants";

const DEFAULT_CENTER = { lat: 18.0858, lng: -15.9785 }; // Nouakchott

const pinIcon = L.divIcon({
  className: "map-marker-wrap",
  html: '<div class="map-marker"></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
});

function hasCoords(bien) {
  return bien.latitude != null && bien.longitude != null && bien.latitude !== "" && bien.longitude !== "";
}

export default function BienMap({ biens = [], height = 620, defaultZoom = 12, center }) {
  const { t, i18n } = useTranslation();

  const located = biens.filter(hasCoords);
  const mapCenter =
    center ||
    (located.length
      ? { lat: Number(located[0].latitude), lng: Number(located[0].longitude) }
      : DEFAULT_CENTER);

  return (
    <div className="map-view" style={{ height }}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={defaultZoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {located.map((bien) => {
          const titre = localizedField(bien, "titre", i18n);
          return (
            <Marker
              key={bien.reference}
              position={[Number(bien.latitude), Number(bien.longitude)]}
              icon={pinIcon}
            >
              <Popup minWidth={220}>
                <Link to={`/biens/${bien.reference}`} className="map-pin-card">
                  {bien.photo_principale ? (
                    <img src={bien.photo_principale} alt={titre} />
                  ) : (
                    <div className="bien-card-media-placeholder" style={{ height: 100 }}>
                      <ImageOff className="icon-sm" />
                    </div>
                  )}
                  <div className="map-pin-card-body">
                    <div className="map-pin-card-title">{titre}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {formatPrix(t, bien.prix, bien.unite_prix)}
                    </div>
                  </div>
                </Link>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
