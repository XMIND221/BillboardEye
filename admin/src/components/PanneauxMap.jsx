import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [14.7167, -17.4677];

export default function PanneauxMap({ panneaux }) {
  const points = panneaux
    .map((panneau) => ({
      id: panneau.id,
      entreprise: panneau.entreprise,
      adresse: panneau.localisation?.adresse || "Adresse non renseignee",
      latitude: Number(panneau.localisation?.latitude),
      longitude: Number(panneau.localisation?.longitude),
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
          <Marker key={point.id} position={[point.latitude, point.longitude]}>
            <Popup>
              <strong>{point.entreprise}</strong>
              <br />
              {point.adresse}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
