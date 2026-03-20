import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [14.7167, -17.4677];

const getMapStatus = (statut) => {
  if (statut === "completed") {
    return "COMPLET";
  }
  if (statut === "pending") {
    return "EN_COURS";
  }
  return "INCOMPLET";
};

const markerIcon = (status) => {
  const color = status === "COMPLET" ? "#16a34a" : status === "EN_COURS" ? "#f59e0b" : "#dc2626";

  return L.divIcon({
    className: "custom-marker",
    html: `<span style="background:${color};"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

export default function PanneauxMap({ panneaux }) {
  const points = panneaux
    .map((panneau) => ({
      id: panneau.id,
      entreprise: panneau.entreprise,
      adresse: panneau.localisation?.adresse || "Adresse non renseignee",
      latitude: Number(panneau.localisation?.latitude),
      longitude: Number(panneau.localisation?.longitude),
      status: getMapStatus(panneau.statut),
    }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

  const center = points.length ? [points[0].latitude, points[0].longitude] : DEFAULT_CENTER;

  return (
    <div className="map-wrapper">
      <MapContainer center={center} zoom={10} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <Marker key={point.id} position={[point.latitude, point.longitude]} icon={markerIcon(point.status)}>
            <Popup>
              <strong>{point.entreprise}</strong>
              <br />
              {point.adresse}
              <br />
              Statut: {point.status === "EN_COURS" ? "EN COURS" : point.status}
              <br />
              <a href={`/panneaux/${point.id}`} className="popup-link">
                Voir detail
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
