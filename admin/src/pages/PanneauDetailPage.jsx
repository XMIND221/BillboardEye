import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import { getPanneauById, getPDF, getProjetById, getRapport } from "../services/api";

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString("fr-FR");
};

export default function PanneauDetailPage() {
  const { id } = useParams();
  const [panneau, setPanneau] = useState(null);
  const [projet, setProjet] = useState(null);
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const [panneauData, rapportData] = await Promise.all([getPanneauById(id), getRapport(id)]);
        const projetData = panneauData?.projetId ? await getProjetById(panneauData.projetId) : null;
        setPanneau(panneauData);
        setProjet(projetData);
        setRapport(rapportData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  const pdfUrl = useMemo(() => getPDF(id), [id]);

  if (loading) {
    return (
      <main className="container">
        <Loader />
      </main>
    );
  }

  if (error || !panneau || !rapport) {
    return (
      <main className="container">
        <ErrorState message={error || "Panneau introuvable."} />
        <Link to="/" className="btn btn-inline">
          Retour dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="detail-header">
        <h1>{panneau.entreprise}</h1>
        <div className="actions">
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn">
            Télécharger PDF
          </a>
          <Link to="/" className="btn btn-secondary">
            Retour
          </Link>
        </div>
      </header>

      <section className="detail-grid">
        <article className="detail-card">
          <h2>Informations panneau</h2>
          <p>
            <strong>Adresse:</strong> {panneau.localisation?.adresse || "Adresse non renseignée"}
          </p>
          <p>
            <strong>Latitude / Longitude:</strong> {panneau.localisation?.latitude} /{" "}
            {panneau.localisation?.longitude}
          </p>
          <p>
            <strong>Date:</strong> {formatDate(panneau.createdAt)}
          </p>
          <p>
            <strong>Projet:</strong> {projet?.nom || "Sans projet"}
          </p>
          <p>
            <strong>Statut rapport:</strong> {rapport.isComplete ? "COMPLET" : "INCOMPLET"}
          </p>
        </article>

        <article className="detail-card">
          <h2>Photos</h2>
          <div className="photo-block">
            <h3>Face A</h3>
            {rapport.photos?.faceA?.url ? (
              <img src={rapport.photos.faceA.url} alt="Face A" />
            ) : (
              <p className="state-text">Aucune photo Face A.</p>
            )}
          </div>
          <div className="photo-block">
            <h3>Face B</h3>
            {rapport.photos?.faceB?.url ? (
              <img src={rapport.photos.faceB.url} alt="Face B" />
            ) : (
              <p className="state-text">Aucune photo Face B.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
