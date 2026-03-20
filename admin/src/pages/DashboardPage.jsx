import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PanneauxMap from "../components/PanneauxMap";
import FiltersBar from "../components/FiltersBar";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import PanneauCard from "../components/PanneauCard";
import { getPanneaux, getProjets } from "../services/api";
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

const getProjectIndicator = (completeCount, totalCount) => {
  if (totalCount === 0 || completeCount === 0) {
    return { label: "INCOMPLET", colorClass: "indicator-red" };
  }

  if (completeCount === totalCount) {
    return { label: "COMPLET", colorClass: "indicator-green" };
  }

  return { label: "EN COURS", colorClass: "indicator-orange" };
};

export default function DashboardPage() {
  const [panneaux, setPanneaux] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entrepriseFilter, setEntrepriseFilter] = useState("");
  const [projetFilter, setProjetFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [liveBadge, setLiveBadge] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading((prev) => prev || panneaux.length === 0);
        setError("");
        const [panneauxData, projetsData] = await Promise.all([getPanneaux(), getProjets()]);
        setPanneaux(panneauxData);
        setProjets(projetsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribeRealtime = subscribeDashboardRealtime(async () => {
      setLiveBadge("Mise a jour en direct...");
      await loadData();
      setTimeout(() => setLiveBadge(""), 1400);
    });

    const intervalId = setInterval(loadData, 30000);

    return () => {
      unsubscribeRealtime();
      clearInterval(intervalId);
    };
  }, []);

  const projetsById = useMemo(() => {
    return projets.reduce((acc, projet) => {
      acc[projet.id] = projet;
      return acc;
    }, {});
  }, [projets]);

  const panneauxWithProjet = useMemo(() => {
    return panneaux.map((panneau) => ({
      ...panneau,
      projet: panneau.projetId ? projetsById[panneau.projetId] || null : null,
    }));
  }, [panneaux, projetsById]);

  const filteredPanneaux = useMemo(() => {
    return panneauxWithProjet.filter((panneau) => {
      const statusLabel = mapStatus(panneau.statut);
      const matchEntreprise = panneau.entreprise
        .toLowerCase()
        .includes(entrepriseFilter.trim().toLowerCase());
      const matchStatut = statutFilter === "all" || statusLabel === statutFilter;
      const matchProjet = projetFilter === "all" || panneau.projetId === projetFilter;
      return matchEntreprise && matchStatut && matchProjet;
    });
  }, [panneauxWithProjet, entrepriseFilter, statutFilter, projetFilter]);

  const stats = useMemo(() => {
    const total = filteredPanneaux.length;
    const complets = filteredPanneaux.filter((item) => mapStatus(item.statut) === "COMPLET").length;
    const incomplets = total - complets;
    return { total, complets, incomplets };
  }, [filteredPanneaux]);

  const projectCards = useMemo(() => {
    const allowedProjects =
      projetFilter === "all" ? projets : projets.filter((projet) => projet.id === projetFilter);

    return allowedProjects.map((projet) => {
      const projectPanneaux = filteredPanneaux.filter((item) => item.projetId === projet.id);
      const total = projectPanneaux.length;
      const complete = projectPanneaux.filter((item) => mapStatus(item.statut) === "COMPLET").length;
      const progression = total === 0 ? 0 : Math.round((complete / total) * 100);
      const indicator = getProjectIndicator(complete, total);

      return {
        ...projet,
        total,
        complete,
        progression,
        indicator,
      };
    });
  }, [projets, filteredPanneaux, projetFilter]);

  return (
    <main className="container">
      <header className="header">
        <h1>Dashboard BillboardEye</h1>
        <p>Suivi des projets, progression et qualite terrain.</p>
        {liveBadge ? <small className="live-badge">{liveBadge}</small> : null}
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Total panneaux</p>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card">
          <p>Panneaux complets</p>
          <strong>{stats.complets}</strong>
        </article>
        <article className="stat-card">
          <p>Panneaux incomplets</p>
          <strong>{stats.incomplets}</strong>
        </article>
      </section>

      <FiltersBar
        entrepriseFilter={entrepriseFilter}
        setEntrepriseFilter={setEntrepriseFilter}
        projetFilter={projetFilter}
        setProjetFilter={setProjetFilter}
        projets={projets}
        statutFilter={statutFilter}
        setStatutFilter={setStatutFilter}
      />

      <PanneauxMap panneaux={filteredPanneaux} />

      <section className="list-section">
        <h2>Projets</h2>
        {loading && <Loader />}
        {error && <ErrorState message={error} />}

        {!loading && !error && projectCards.length === 0 && (
          <p className="state-text">Aucun projet correspondant.</p>
        )}

        {!loading &&
          !error &&
          projectCards.map((project) => (
            <article key={project.id} className="project-summary-card">
              <div>
                <h3>{project.nom}</h3>
                <p>Entreprise: {project.entreprise}</p>
                <p>Zone: {project.zone || "Non renseignee"}</p>
                <p>
                  {project.complete}/{project.total} panneau(x) complet(s)
                </p>
                <div className="progress-wrapper">
                  <div className="progress-track">
                    <span style={{ width: `${project.progression}%` }} />
                  </div>
                  <span>{project.progression}%</span>
                </div>
              </div>
              <div className="project-summary-actions">
                <span className={`project-indicator ${project.indicator.colorClass}`}>
                  {project.indicator.label}
                </span>
                <Link to={`/projets/${project.id}`} className="btn">
                  Ouvrir projet
                </Link>
              </div>
            </article>
          ))}
      </section>

      <section className="list-section">
        <h2>Panneaux filtres</h2>
        {!loading && !error && filteredPanneaux.length === 0 && (
          <p className="state-text">Aucun panneau correspondant.</p>
        )}
        {!loading &&
          !error &&
          filteredPanneaux.map((panneau) => (
            <PanneauCard key={panneau.id} panneau={panneau} projetNom={panneau.projet?.nom || "Sans projet"} />
          ))}
      </section>
    </main>
  );
}
