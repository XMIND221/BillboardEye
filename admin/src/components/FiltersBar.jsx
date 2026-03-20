export default function FiltersBar({
  entrepriseFilter,
  setEntrepriseFilter,
  projetFilter,
  setProjetFilter,
  projets,
  statutFilter,
  setStatutFilter,
}) {
  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Filtrer par entreprise"
        value={entrepriseFilter}
        onChange={(event) => setEntrepriseFilter(event.target.value)}
      />

      <select value={statutFilter} onChange={(event) => setStatutFilter(event.target.value)}>
        <option value="all">Tous les statuts</option>
        <option value="COMPLET">COMPLET</option>
        <option value="INCOMPLET">INCOMPLET</option>
      </select>
      <select value={projetFilter} onChange={(event) => setProjetFilter(event.target.value)}>
        <option value="all">Tous les projets</option>
        {projets.map((projet) => (
          <option key={projet.id} value={projet.id}>
            {projet.nom}
          </option>
        ))}
      </select>
    </div>
  );
}
