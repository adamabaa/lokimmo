export function generatePdfFromElement(elementId, filename) {
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Élément introuvable')

  const content  = element.innerHTML
  const printWin = window.open('', '_blank', 'width=900,height=700')

  const script = '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},500)}</scr' + 'ipt>'

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>${filename}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; background: #fff; }
        @media print {
          body { margin: 0; }
          @page { size: A4; margin: 0; }
        }
        img { max-width: 100%; }
        table { border-collapse: collapse; }
      </style>
    </head>
    <body>
      ${content}
      ${script}
    </body>
    </html>
  `)

  printWin.document.close()
}

export function printElement(elementId) {
  return generatePdfFromElement(elementId, 'document')
}