import { useState }           from 'react'
import Modal                  from '../../components/ui/Modal'
import ReceiptTemplate        from '../../components/pdf/ReceiptTemplate'
import { generatePdfFromElement, printElement } from '../../utils/pdfGenerator'
import Spinner                from '../../components/ui/Spinner'

export default function PaymentReceiptModal({ isOpen, onClose, payment, contract, agency }) {
  const [generating, setGenerating] = useState(false)
  const [printing,   setPrinting]   = useState(false)

  const download = async () => {
    setGenerating(true)
    try {
      const filename = `quittance_${contract?.tenant_name?.replace(/\s/g, '_')}_${payment?.period_month}_${payment?.period_year}.pdf`
      await generatePdfFromElement('receipt-template', filename)
    } finally {
      setGenerating(false)
    }
  }

  const print = async () => {
    setPrinting(true)
    try {
      await printElement('receipt-template')
    } finally {
      setPrinting(false)
    }
  }

  if (!payment || !contract) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quittance de loyer"
      footer={
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button className="lk-btn lk-btn-secondary" onClick={onClose} style={{ marginRight: 'auto' }}>
            Fermer
          </button>
          <button className="lk-btn lk-btn-secondary" onClick={print} disabled={printing}>
            {printing ? <Spinner size="sm" /> : '🖨 Imprimer'}
          </button>
          <button className="lk-btn lk-btn-primary" onClick={download} disabled={generating}>
            {generating ? <Spinner size="sm" /> : '⬇ Télécharger PDF'}
          </button>
        </div>
      }
    >
{/* Aperçu scrollable */}
<div style={{
  maxHeight:    '65vh',
  overflowY:    'auto',
  border:       '1px solid var(--lk-border)',
  borderRadius: 'var(--radius-md)',
  background:   '#ffffff',
}}>
  <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '182%' }}>
    <ReceiptTemplate
      payment={payment}
      contract={contract}
      agency={agency}
    />
  </div>
</div>
    </Modal>
  )
}