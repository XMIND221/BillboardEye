import { Link } from "react-router-dom";

const mapStatus = (statut) => {
  if (statut === "completed") {
    return "COMPLET";
  }
  if (statut === "pending") {
    return "EN COURS";
  }
  return "INCOMPLET";
};

export default function PanneauCard({ panneau, projetNom = "Sans projet" }) {
  const statusLabel = mapStatus(panneau.statut);

  return (
    <div className="card">
      <div>
        <h3>{panneau.entreprise}</h3>
        <p>Projet: {projetNom}</p>
        {panneau.nomZone ? <p className="panneau-zone-gestion">Zone : {panneau.nomZone}</p> : null}
        <p>{panneau.localisation?.adresse || panneau.nomZone || "Adresse non renseignée"}</p>
        <span className={`status status-${statusLabel.toLowerCase().replace(" ", "-")}`}>{statusLabel}</span>
      </div>
      <Link to={`/panneaux/${panneau.id}`} className="btn">
        Voir détail
      </Link>
    </div>
  );
}
