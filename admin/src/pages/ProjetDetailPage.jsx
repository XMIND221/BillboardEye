import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import { getPanneauxByProjet, getProjetById, getProjetPDFUrl, getRapport } from "../services/api";
import { subscribeDashboardRealtime } from "../services/realtime";

const mapStatus = (statut) => {
  if (statut === "completed") {
    return "COMPLET";
  }
  if (statut === "pending") {
    return "EN COURS";
  }
  return "INCOMPLET";
};

export default function ProjetDetailPage() {
  const { id } = useParams();
  const [projet, setProjet] = useState(null);
  const [panneaux, setPanneaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [projetData, panneauxData] = await Promise.all([getProjetById(id), getPanneauxByProjet(id)]);
        setProjet(projetData);
        setPanneaux(panneauxData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribeRealtime = subscribeDashboardRealtime(loadData);
    const intervalId = setInterval(loadData, 30000);

    return () => {
      unsubscribeRealtime();
      clearInterval(intervalId);
    };
  }, [id]);

  const completeCount = useMemo(() => {
    return panneaux.filter((panneau) => mapStatus(panneau.statut) === "COMPLET").length;
  }, [panneaux]);

  const exportProjetPDF = async () => {
    try {
      setExportingPdf(true);
      const result = await getProjetPDFUrl(projet.id);
      if (!result?.url) {
        throw new Error("Lien PDF indisponible.");
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (_error) {
      setError("Impossible d'exporter le PDF projet.");
    } finally {
      setExportingPdf(false);
    }
  };

  const exportProjetPhotosZip = async () => {
    try {
      setExportingZip(true);
      const zip = new JSZip();
      const photosFolder = zip.folder(`projet-${projet.id}-photos`);

      for (const panneau of panneaux) {
        const rapport = await getRapport(panneau.id);
        const photos = [
          { label: "faceA", url: rapport?.photos?.faceA?.url },
          { label: "faceB", url: rapport?.photos?.faceB?.url },
        ].filter((item) => Boolean(item.url));

        for (const photo of photos) {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          photosFolder.file(`${panneau.id}-${photo.label}.jpg`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `projet-${projet.id}-photos.zip`);
    } catch (_error) {
      setError("Impossible de telecharger les photos du projet.");
    } finally {
      setExportingZip(false);
    }
  };

  if (loading) {
    return (
      <main className="container">
        <Loader />
      </main>
    );
  }

  if (error || !projet) {
    return (
      <main className="container">
        <ErrorState message={error || "Projet introuvable."} />
        <Link to="/" className="btn btn-inline">
          Retour dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="detail-header">
        <div>
          <h1>{projet.nom}</h1>
          <p>
            <strong>Entreprise:</strong> {projet.entreprise}
          </p>
          <p>
            <strong>Zone:</strong> {projet.zone || "Non renseignee"}
          </p>
          <p>
            <strong>Date:</strong> {projet.date ? new Date(projet.date).toLocaleDateString("fr-FR") : "N/A"}
          </p>
          <p>
            <strong>Statut global:</strong> {panneaux.length} panneau(x), {completeCount} complet(s)
          </p>
        </div>
        <div className="actions">
          <button className="btn" onClick={exportProjetPDF} disabled={exportingPdf}>
            {exportingPdf ? "Export PDF..." : "Exporter PDF projet"}
          </button>
          <button className="btn btn-secondary" onClick={exportProjetPhotosZip} disabled={exportingZip}>
            {exportingZip ? "Export ZIP..." : "Telecharger photos"}
          </button>
          <Link to="/" className="btn btn-secondary">
            Retour
          </Link>
        </div>
      </header>

      <section className="list-section">
        <h2>Panneaux du projet</h2>
        {panneaux.length === 0 ? (
          <p className="state-text">Aucun panneau pour ce projet.</p>
        ) : (
          <div className="project-panel-list">
            {panneaux.map((panneau) => (
              <article key={panneau.id} className="project-panel-row">
                <div>
                  <h3>{panneau.entreprise}</h3>
                  <p>{panneau.localisation?.adresse || "Adresse non renseignee"}</p>
                  <span className={`status status-${mapStatus(panneau.statut).toLowerCase().replace(" ", "-")}`}>
                    {mapStatus(panneau.statut)}
                  </span>
                </div>
                <Link className="btn" to={`/panneaux/${panneau.id}`}>
                  Voir detail
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
