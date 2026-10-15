import { OverlayView } from "@react-google-maps/api";

function metersPerPixel(lat, zoom) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

/** Affichage en lecture seule d'un plan (image) positionne/pivote sur la carte. */
export default function GoogleMapGroundOverlay({ image, centerLat, centerLng, largeurM, hauteurM, rotationDeg, zoom }) {
  const mpp = metersPerPixel(centerLat, zoom);
  const pxWidth = Math.max(10, largeurM / mpp);
  const pxHeight = Math.max(10, hauteurM / mpp);

  return (
    <OverlayView position={{ lat: centerLat, lng: centerLng }} mapPaneName={OverlayView.MAP_PANE}>
      <div
        style={{
          position: "absolute",
          transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
          width: pxWidth,
          height: pxHeight,
          pointerEvents: "none",
        }}
      >
        <img src={image} alt="" style={{ width: "100%", height: "100%", opacity: 0.85 }} />
      </div>
    </OverlayView>
  );
}
