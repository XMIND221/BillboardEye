import { useEffect, useMemo, useState } from "react";
import PanneauxMap from "../components/PanneauxMap";
import FiltersBar from "../components/FiltersBar";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import PanneauCard from "../components/PanneauCard";
import { getPanneaux } from "../services/api";

const mapStatus = (statut) => {
  return statut === "completed" ? "COMPLET" : "INCOMPLET";
};

export default function DashboardPage() {
  const [panneaux, setPanneaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entrepriseFilter, setEntrepriseFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");

  useEffect(() => {
    const loadPanneaux = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getPanneaux();
        setPanneaux(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPanneaux();
  }, []);

  const filteredPanneaux = useMemo(() => {
    return panneaux.filter((panneau) => {
      const statusLabel = mapStatus(panneau.statut);
      const matchEntreprise = panneau.entreprise
        .toLowerCase()
        .includes(entrepriseFilter.trim().toLowerCase());
      const matchStatut = statutFilter === "all" || statusLabel === statutFilter;
      return matchEntreprise && matchStatut;
    });
  }, [panneaux, entrepriseFilter, statutFilter]);

  return (
    <main className="container">
      <header className="header">
        <h1>Dashboard BillboardEye</h1>
        <p>Vue globale des panneaux et de leur etat.</p>
      </header>

      <FiltersBar
        entrepriseFilter={entrepriseFilter}
        setEntrepriseFilter={setEntrepriseFilter}
        statutFilter={statutFilter}
        setStatutFilter={setStatutFilter}
      />

      <PanneauxMap panneaux={filteredPanneaux} />

      <section className="list-section">
        <h2>Liste des panneaux</h2>
        {loading && <Loader />}
        {error && <ErrorState message={error} />}

        {!loading && !error && filteredPanneaux.length === 0 && (
          <p className="state-text">Aucun panneau correspondant.</p>
        )}

        {!loading &&
          !error &&
          filteredPanneaux.map((panneau) => <PanneauCard key={panneau.id} panneau={panneau} />)}
      </section>
    </main>
  );
}
