export default function BarreEtapes({ etapeActuelle, total }) {
  return (
    <div className="barre-etapes">
      {Array.from({ length: total }, (_, i) => {
        const num = i + 1;
        const statut = num < etapeActuelle ? 'done' : num === etapeActuelle ? 'active' : 'pending';
        return (
          <div key={num} className={`etape-item etape-${statut}`}>
            <div className="etape-cercle">{statut === 'done' ? '✓' : num}</div>
            <span className="etape-label">
              {num === 1 ? 'Identifiant' : num === 2 ? 'Question' : 'Code OTP'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
