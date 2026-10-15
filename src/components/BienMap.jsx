import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { DEFAULT_BIEN_IMAGE, formatPrix, localizedField } from "../constants";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER = { lat: 18.0858, lng: -15.9785 }; // Nouakchott

function hasCoords(bien) {
  return bien.latitude != null && bien.longitude != null && bien.latitude !== "" && bien.longitude !== "";
}

export default function BienMap({ biens = [], height = 620, defaultZoom = 12, center }) {
  const { t, i18n } = useTranslation();
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [selected, setSelected] = useState(null);

  const located = biens.filter(hasCoords);
  const mapCenter =
    center ||
    (located.length
      ? { lat: Number(located[0].latitude), lng: Number(located[0].longitude) }
      : DEFAULT_CENTER);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="map-view" style={{ height }}>
        <p className="muted">{t("bienMap.missingApiKey")}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-view" style={{ height }}>
        <p className="muted">{t("bienMap.loadError")}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-view" style={{ height }}>
        <div className="page-loading">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="map-view" style={{ height }}>
      <GoogleMap
        center={mapCenter}
        zoom={defaultZoom}
        mapTypeId="satellite"
        mapContainerStyle={{ height: "100%", width: "100%" }}
        options={{ streetViewControl: false, fullscreenControl: false }}
      >
        {located.map((bien) => (
          <Marker
            key={bien.reference}
            position={{ lat: Number(bien.latitude), lng: Number(bien.longitude) }}
            onClick={() => setSelected(bien)}
          />
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: Number(selected.latitude), lng: Number(selected.longitude) }}
            onCloseClick={() => setSelected(null)}
          >
            <Link to={`/biens/${selected.reference}`} className="map-pin-card">
              <img src={selected.photo_principale || DEFAULT_BIEN_IMAGE} alt={localizedField(selected, "titre", i18n)} />
              <div className="map-pin-card-body">
                <div className="map-pin-card-title">{localizedField(selected, "titre", i18n)}</div>
                {Number(selected.prix) > 0 && (
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    {formatPrix(t, selected.prix, selected.unite_prix)}
                  </div>
                )}
              </div>
            </Link>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
