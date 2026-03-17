export default function FiltersBar({
  entrepriseFilter,
  setEntrepriseFilter,
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
    </div>
  );
}
