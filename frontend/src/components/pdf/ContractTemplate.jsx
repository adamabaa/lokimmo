import { forwardRef } from 'react'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

const ContractTemplate = forwardRef(({ contract, agency }, ref) => {
  return (
    <div
      id="contract-template"
      ref={ref}
      style={{
        width:      '210mm',
        minHeight:  '297mm',
        padding:    '20mm',
        background: '#ffffff',
        fontFamily: 'Georgia, serif',
        color:      '#1a1a1a',
        fontSize:   '11pt',
        lineHeight: 1.8,
        boxSizing:  'border-box',
      }}
    >
      {/* En-tête */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   '10mm',
        paddingBottom:  '6mm',
        borderBottom:   `3px solid ${agency?.primary_color || '#d4a853'}`,
      }}>
        <div>
          {agency?.logo_url && (
            <img
              src={`${API_URL}${agency.logo_url}`}
              alt={agency.name}
              crossOrigin="anonymous"
              style={{ height: '18mm', marginBottom: '3mm', objectFit: 'contain' }}
            />
          )}
          <div style={{ fontSize: '14pt', fontWeight: 'bold', color: agency?.primary_color || '#d4a853' }}>
            {agency?.name}
          </div>
          {agency?.address && <div style={{ fontSize: '9pt', color: '#666' }}>{agency.address}</div>}
          {agency?.phone && <div style={{ fontSize: '9pt', color: '#666' }}>Tél : {agency.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize:      '18pt',
            fontWeight:    'bold',
            color:         agency?.primary_color || '#d4a853',
            textTransform: 'uppercase',
          }}>
            Contrat de bail
          </div>
          <div style={{ fontSize: '9pt', color: '#666', marginTop: '2mm' }}>
            Réf : BAIL-{String(contract?.id).padStart(6, '0')}
          </div>
          <div style={{ fontSize: '9pt', color: '#666' }}>
            Date : {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
        <div style={{
          fontSize:      '13pt',
          fontWeight:    'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Contrat de location à usage d'habitation
        </div>
      </div>

      {/* Parties */}
      <div style={{ marginBottom: '6mm' }}>
        <div style={{
          fontWeight:    'bold',
          fontSize:      '11pt',
          marginBottom:  '2mm',
          color:         agency?.primary_color || '#d4a853',
        }}>
          ENTRE LES SOUSSIGNÉS :
        </div>
        <p>
          <strong>Le Bailleur :</strong> {agency?.name}, agence immobilière,
          {agency?.address && ` sise à ${agency.address},`}
          {agency?.phone && ` tél. ${agency.phone},`}
          ci-après dénommé « le Bailleur »,
        </p>
        <p style={{ marginTop: '3mm' }}>
          <strong>Le Locataire :</strong> {contract?.tenant_name},
          ci-après dénommé « le Locataire »,
        </p>
      </div>

      <div style={{ marginBottom: '6mm' }}>
        <div style={{
          fontWeight:   'bold',
          fontSize:     '11pt',
          marginBottom: '2mm',
          color:        agency?.primary_color || '#d4a853',
        }}>
          IL A ÉTÉ CONVENU CE QUI SUIT :
        </div>
      </div>

      {/* Articles */}
      {[
        {
          title: 'Article 1 — Objet',
          content: `Le Bailleur loue au Locataire le bien immobilier désigné comme suit : ${contract?.property_title}, sis à ${contract?.property_address || 'adresse non renseignée'}.`,
        },
        {
          title: 'Article 2 — Durée',
          content: `Le présent contrat est consenti pour une durée commençant le ${formatDate(contract?.start_date)}${contract?.end_date ? ` et se terminant le ${formatDate(contract?.end_date)}` : ', à durée indéterminée'}.`,
        },
        {
          title: 'Article 3 — Loyer',
          content: `Le loyer mensuel est fixé à ${formatCurrency(contract?.rent_amount)}, payable le ${contract?.payment_day || 5} de chaque mois.`,
        },
        {
          title: 'Article 4 — Dépôt de garantie',
          content: contract?.deposit_amount
            ? `Un dépôt de garantie d'un montant de ${formatCurrency(contract.deposit_amount)} est versé à la signature du présent contrat.`
            : 'Aucun dépôt de garantie n\'est exigé.',
        },
        {
          title: 'Article 5 — Obligations du Locataire',
          content: 'Le Locataire s\'engage à : payer le loyer aux échéances convenues, user paisiblement des lieux loués, ne pas sous-louer sans accord écrit du Bailleur, maintenir les lieux en bon état d\'entretien.',
        },
        {
          title: 'Article 6 — Obligations du Bailleur',
          content: 'Le Bailleur s\'engage à : délivrer les lieux en bon état, assurer la jouissance paisible des lieux, effectuer les réparations nécessaires autres que locatives.',
        },
        {
          title: 'Article 7 — Résiliation',
          content: 'Le présent contrat pourra être résilié par l\'une ou l\'autre des parties avec un préavis d\'un mois pour les locations meublées et trois mois pour les locations nues.',
        },
      ].map((article, i) => (
        <div key={i} style={{ marginBottom: '5mm' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>{article.title}</div>
          <p style={{ margin: 0, textAlign: 'justify' }}>{article.content}</p>
        </div>
      ))}

      {/* Signatures */}
      <div style={{
        marginTop:     '10mm',
        paddingTop:    '6mm',
        borderTop:     '1px solid #e0e0e0',
        display:       'flex',
        justifyContent: 'space-between',
      }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>Le Bailleur</div>
          <div style={{ fontSize: '9pt', color: '#666', marginBottom: '15mm' }}>
            {agency?.name}
          </div>
          <div style={{
            borderTop:  '1px solid #333',
            paddingTop: '2mm',
            fontSize:   '9pt',
            color:      '#666',
          }}>
            Signature et cachet
          </div>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>Le Locataire</div>
          <div style={{ fontSize: '9pt', color: '#666', marginBottom: '15mm' }}>
            {contract?.tenant_name}
          </div>
          <div style={{
            borderTop:  '1px solid #333',
            paddingTop: '2mm',
            fontSize:   '9pt',
            color:      '#666',
          }}>
            Signature précédée de « Lu et approuvé »
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div style={{
        marginTop:  '8mm',
        textAlign:  'center',
        fontSize:   '8pt',
        color:      '#999',
        borderTop:  `1px solid ${agency?.primary_color || '#d4a853'}40`,
        paddingTop: '3mm',
      }}>
        Document généré par Lokimmo — {new Date().toLocaleDateString('fr-FR')}
      </div>
    </div>
  )
})

ContractTemplate.displayName = 'ContractTemplate'
export default ContractTemplate