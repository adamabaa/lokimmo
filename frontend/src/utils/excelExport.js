import * as XLSX from 'xlsx'

/**
 * Exporte un tableau de données vers un fichier Excel
 * @param {Array}  data      — tableau d'objets
 * @param {Array}  columns   — [{ key, label }]
 * @param {string} filename  — nom du fichier sans extension
 * @param {string} sheetName — nom de l'onglet
 */
export function exportToExcel(data, columns, filename, sheetName = 'Données') {
  // Construire les en-têtes
  const headers = columns.map(col => col.label)

  // Construire les lignes
  const rows = data.map(row =>
    columns.map(col => {
      const val = row[col.key]
      if (val === null || val === undefined) return '—'
      if (col.format) return col.format(val, row)
      return val
    })
  )

  // Assembler headers + rows
  const worksheetData = [headers, ...rows]

  // Créer la feuille
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Style des en-têtes — largeur auto
  const colWidths = columns.map(col => ({
    wch: Math.max(col.label.length, 15)
  }))
  worksheet['!cols'] = colWidths

  // Créer le workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Télécharger
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Export multi-onglets
 * @param {Array} sheets — [{ data, columns, sheetName }]
 * @param {string} filename
 */
export function exportMultiSheet(sheets, filename) {
  const workbook = XLSX.utils.book_new()

  sheets.forEach(({ data, columns, sheetName }) => {
    const headers = columns.map(col => col.label)
    const rows    = data.map(row =>
      columns.map(col => {
        const val = row[col.key]
        if (val === null || val === undefined) return '—'
        if (col.format) return col.format(val, row)
        return val
      })
    )

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    worksheet['!cols'] = columns.map(col => ({ wch: Math.max(col.label.length, 15) }))
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}