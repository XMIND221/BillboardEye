import { Link } from "react-router-dom";

const mapStatus = (statut) => {
  return statut === "completed" ? "COMPLET" : "INCOMPLET";
};

export default function PanneauCard({ panneau }) {
  const statusLabel = mapStatus(panneau.statut);

  return (
    <div className="card">
      <div>
        <h3>{panneau.entreprise}</h3>
        <p>{panneau.localisation?.adresse || "Adresse non renseignee"}</p>
        <span className={`status status-${statusLabel.toLowerCase()}`}>{statusLabel}</span>
      </div>
      <Link to={`/panneaux/${panneau.id}`} className="btn">
        Voir detail
      </Link>
    </div>
  );
}
