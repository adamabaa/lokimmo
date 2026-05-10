import { forwardRef }     from 'react'
import { formatDate }     from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

/**
 * Template de quittance de loyer
 * Rendu en HTML blanc pour capture PDF
 */
const ReceiptTemplate = forwardRef(({ payment, contract, agency }, ref) => {
  const month = new Date(payment.due_date).toLocaleString('fr-FR', {
    month: 'long', year: 'numeric'
  })

  return (
    <div
      id="receipt-template"
      ref={ref}
      style={{
        width:       '210mm',
        minHeight:   '297mm',
        padding:     '20mm',
        background:  '#ffffff',
        fontFamily:  'Georgia, serif',
        color:       '#1a1a1a',
        fontSize:    '11pt',
        lineHeight:  1.6,
        boxSizing:   'border-box',
      }}
    >
      {/* En-tête agence */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   '12mm',
        paddingBottom:  '8mm',
        borderBottom:   `3px solid ${agency?.primary_color || '#d4a853'}`,
      }}>
        <div>
          {agency?.logo_url && (
            <img
              src={`${API_URL}${agency.logo_url}`}
              alt={agency.name}
              crossOrigin="anonymous"
              style={{ height: '20mm', marginBottom: '4mm', objectFit: 'contain' }}
            />
          )}
          <div style={{ fontSize: '16pt', fontWeight: 'bold', color: agency?.primary_color || '#d4a853' }}>
            {agency?.name || 'Lokimmo'}
          </div>
          {agency?.address && (
            <div style={{ fontSize: '9pt', color: '#666', marginTop: '2mm' }}>
              {agency.address}
            </div>
          )}
          {agency?.phone && (
            <div style={{ fontSize: '9pt', color: '#666' }}>
              Tél : {agency.phone}
            </div>
          )}
          {agency?.email && (
            <div style={{ fontSize: '9pt', color: '#666' }}>
              Email : {agency.email}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize:        '20pt',
            fontWeight:      'bold',
            color:           agency?.primary_color || '#d4a853',
            textTransform:   'uppercase',
            letterSpacing:   '1px',
          }}>
            Quittance de loyer
          </div>
          <div style={{ fontSize: '10pt', color: '#666', marginTop: '2mm' }}>
            N° {String(payment.id).padStart(6, '0')}
          </div>
          <div style={{ fontSize: '10pt', color: '#666' }}>
            {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Période */}
      <div style={{
        background:    `${agency?.primary_color || '#d4a853'}15`,
        border:        `1px solid ${agency?.primary_color || '#d4a853'}40`,
        borderRadius:  '4mm',
        padding:       '4mm 6mm',
        marginBottom:  '8mm',
        textAlign:     'center',
      }}>
        <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>
          Période : {month.charAt(0).toUpperCase() + month.slice(1)}
        </div>
      </div>

      {/* Parties */}
      <div style={{ display: 'flex', gap: '8mm', marginBottom: '8mm' }}>
        {/* Bailleur */}
        <div style={{
          flex:         1,
          padding:      '4mm',
          border:       '1px solid #e0e0e0',
          borderRadius: '3mm',
        }}>
          <div style={{
            fontSize:      '9pt',
            fontWeight:    'bold',
            color:         '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom:  '2mm',
          }}>
            Bailleur (Agence)
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{agency?.name}</div>
          {agency?.address && <div style={{ fontSize: '9pt', color: '#444' }}>{agency.address}</div>}
          {agency?.phone && <div style={{ fontSize: '9pt', color: '#444' }}>Tél : {agency.phone}</div>}
        </div>

        {/* Locataire */}
        <div style={{
          flex:         1,
          padding:      '4mm',
          border:       '1px solid #e0e0e0',
          borderRadius: '3mm',
        }}>
          <div style={{
            fontSize:      '9pt',
            fontWeight:    'bold',
            color:         '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom:  '2mm',
          }}>
            Locataire
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{contract?.tenant_name}</div>
          <div style={{ fontSize: '9pt', color: '#444' }}>
            {contract?.property_title}
          </div>
          <div style={{ fontSize: '9pt', color: '#444' }}>
            {contract?.property_address}
          </div>
        </div>
      </div>

      {/* Bien loué */}
      <div style={{
        padding:      '4mm 6mm',
        border:       '1px solid #e0e0e0',
        borderRadius: '3mm',
        marginBottom: '8mm',
      }}>
        <div style={{
          fontSize:      '9pt',
          fontWeight:    'bold',
          color:         '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom:  '2mm',
        }}>
          Bien loué
        </div>
        <div style={{ fontWeight: 'bold' }}>{contract?.property_title}</div>
        <div style={{ fontSize: '9pt', color: '#444' }}>{contract?.property_address}</div>
      </div>

      {/* Tableau des montants */}
      <table style={{
        width:           '100%',
        borderCollapse:  'collapse',
        marginBottom:    '8mm',
        fontSize:        '10pt',
      }}>
        <thead>
          <tr style={{ background: agency?.primary_color || '#d4a853' }}>
            <th style={{ padding: '3mm 4mm', textAlign: 'left', color: '#fff', fontWeight: 'bold' }}>
              Désignation
            </th>
            <th style={{ padding: '3mm 4mm', textAlign: 'right', color: '#fff', fontWeight: 'bold' }}>
              Montant
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: '#f9f9f9' }}>
            <td style={{ padding: '3mm 4mm', borderBottom: '1px solid #e0e0e0' }}>
              Loyer — {month}
            </td>
            <td style={{ padding: '3mm 4mm', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
              {formatCurrency(payment.amount_due)}
            </td>
          </tr>
          {payment.amount_paid !== payment.amount_due && (
            <tr>
              <td style={{ padding: '3mm 4mm', borderBottom: '1px solid #e0e0e0', color: '#e5534b' }}>
                Reste à payer
              </td>
              <td style={{ padding: '3mm 4mm', textAlign: 'right', borderBottom: '1px solid #e0e0e0', color: '#e5534b' }}>
                {formatCurrency(payment.amount_due - payment.amount_paid)}
              </td>
            </tr>
          )}
          <tr style={{ background: `${agency?.primary_color || '#d4a853'}15` }}>
            <td style={{ padding: '3mm 4mm', fontWeight: 'bold', fontSize: '11pt' }}>
              Total payé
            </td>
            <td style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 'bold', fontSize: '11pt', color: agency?.primary_color || '#d4a853' }}>
              {formatCurrency(payment.amount_paid)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Mode de paiement */}
      <div style={{
        padding:      '3mm 6mm',
        background:   '#f5f5f5',
        borderRadius: '3mm',
        marginBottom: '8mm',
        fontSize:     '9pt',
        color:        '#444',
      }}>
        Mode de paiement : <strong>
          {{ cash: 'Espèces', transfer: 'Virement', mobile_money: 'Mobile Money', check: 'Chèque' }[payment.payment_method] || payment.payment_method}
        </strong>
        {payment.payment_date && (
          <> — Payé le : <strong>{formatDate(payment.payment_date)}</strong></>
        )}
      </div>

      {/* Déclaration */}
      <div style={{
        padding:      '4mm 6mm',
        border:       '1px solid #e0e0e0',
        borderRadius: '3mm',
        marginBottom: '12mm',
        fontSize:     '9pt',
        color:        '#444',
        lineHeight:   1.8,
      }}>
        Je soussigné(e), <strong>{agency?.name}</strong>, donne quittance à{' '}
        <strong>{contract?.tenant_name}</strong> pour le paiement de la somme de{' '}
        <strong>{formatCurrency(payment.amount_paid)}</strong> au titre du loyer du logement
        situé au <strong>{contract?.property_title}</strong> pour la période de{' '}
        <strong>{month}</strong>.
      </div>

      {/* Signature */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9pt', color: '#666', marginBottom: '12mm' }}>
            Signature et cachet de l'agence
          </div>
          <div style={{
            width:        '50mm',
            height:       '20mm',
            border:       '1px dashed #ccc',
            borderRadius: '2mm',
          }} />
          <div style={{ fontSize: '8pt', color: '#999', marginTop: '2mm' }}>
            {agency?.name}
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div style={{
        borderTop:   `1px solid ${agency?.primary_color || '#d4a853'}40`,
        paddingTop:  '4mm',
        textAlign:   'center',
        fontSize:    '8pt',
        color:       '#999',
      }}>
        Document généré par Lokimmo — {new Date().toLocaleDateString('fr-FR')}
        {agency?.website && ` — ${agency.website}`}
      </div>
    </div>
  )
})

ReceiptTemplate.displayName = 'ReceiptTemplate'
export default ReceiptTemplate