import { useState }      from 'react'
import Modal             from '../../components/ui/Modal'
import ContractTemplate  from '../../components/pdf/ContractTemplate'
import { generatePdfFromElement, printElement } from '../../utils/pdfGenerator'
import Spinner           from '../../components/ui/Spinner'

export default function ContractPrintModal({ isOpen, onClose, contract, agency }) {
  const [generating, setGenerating] = useState(false)
  const [printing,   setPrinting]   = useState(false)

  const download = async () => {
    setGenerating(true)
    try {
      const filename = `contrat_${contract?.tenant_name?.replace(/\s/g, '_')}_${contract?.id}.pdf`
      generatePdfFromElement('contract-template', filename)
    } finally {
      setGenerating(false)
    }
  }

  const print = async () => {
    setPrinting(true)
    try {
      printElement('contract-template')
    } finally {
      setPrinting(false)
    }
  }

  if (!contract) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contrat de bail"
      footer={
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button className="lk-btn lk-btn-secondary"
            onClick={onClose} style={{ marginRight: 'auto' }}>
            Fermer
          </button>
          <button className="lk-btn lk-btn-secondary"
            onClick={print} disabled={printing}>
            {printing ? <Spinner size="sm" /> : '🖨 Imprimer'}
          </button>
          <button className="lk-btn lk-btn-primary"
            onClick={download} disabled={generating}>
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
          <ContractTemplate contract={contract} agency={agency} />
        </div>
      </div>
    </Modal>
  )
}