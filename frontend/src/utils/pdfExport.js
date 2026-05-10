export function exportListToPdf(data, columns, title, agency = {}) {
  if (!data || data.length === 0) return

  const agencyName    = agency?.name         || 'Lokimmo'
  const primaryColor  = agency?.primary_color || '#d4a853'
  const logoUrl       = agency?.logo_url
    ? `${import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'}${agency.logo_url}`
    : null

  const rows = data.map(row =>
    columns.map(col => {
      const val = row[col.key]
      if (val === null || val === undefined) return '—'
      if (col.format) return col.format(val, row)
      return String(val)
    })
  )

  const headers   = columns.map(col => `<th>${col.label}</th>`).join('')
  const tableRows = rows.map((row, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9f9f9'}">
      ${row.map(cell => `<td>${cell}</td>`).join('')}
    </tr>
  `).join('')

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${agencyName}" style="height:18mm;object-fit:contain;margin-bottom:3mm" crossorigin="anonymous" /><br/>`
    : ''

  const script = '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},500)}<' + '/sc' + 'ript>'

  const printWin = window.open('', '_blank', 'width=1100,height=700')

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, serif; color: #1a1a1a; padding: 15mm; font-size: 10pt; }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8mm;
          padding-bottom: 4mm;
          border-bottom: 2px solid ${primaryColor};
        }
        .agency    { font-size: 16pt; font-weight: bold; color: ${primaryColor}; }
        .doc-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; text-align: right; }
        .meta      { font-size: 9pt; color: #666; margin-top: 2mm; }
        table      { width: 100%; border-collapse: collapse; font-size: 9pt; }
        thead tr   { background: ${primaryColor}; color: #fff; }
        th         { padding: 3mm; text-align: left; font-weight: bold; white-space: nowrap; }
        td         { padding: 2.5mm 3mm; border-bottom: 1px solid #e0e0e0; vertical-align: middle; }
        tr:nth-child(even) td { background: #f9f9f9; }
        .footer    { margin-top: 6mm; text-align: center; font-size: 8pt; color: #999; border-top: 1px solid ${primaryColor}40; padding-top: 3mm; }
        @media print {
          body { padding: 10mm; }
          @page { size: A4 landscape; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${logoHtml}
          <div class="agency">${agencyName}</div>
          <div class="meta">Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div>
          <div class="doc-title">${title}</div>
          <div class="meta" style="text-align:right">${data.length} enregistrement${data.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">Document généré par Lokimmo — ${new Date().toLocaleDateString('fr-FR')}</div>
      ${script}
    </body>
    </html>
  `)

  printWin.document.close()
}