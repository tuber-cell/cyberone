import type { ScanResults } from '@/lib/scanner'

export async function generatePDFReport(results: ScanResults, userEmail?: string) {
  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // ── Helper functions ────────────────────────────────────
  function addPage() {
    doc.addPage()
    yPos = 20
    addPageHeader()
  }

  function checkPageBreak(needed: number) {
    if (yPos + needed > pageHeight - 20) addPage()
  }

  function addPageHeader() {
    doc.setFillColor(2, 4, 8)
    doc.rect(0, 0, pageWidth, 12, 'F')
    doc.setFont('courier', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(0, 212, 255)
    doc.text('CYBERONE SECURITY PLATFORM', 10, 8)
    doc.text(`TARGET: ${results.target}`, pageWidth - 10, 8, { align: 'right' })
  }

  // ── Cover header ────────────────────────────────────────
  doc.setFillColor(2, 4, 8)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Accent bar
  doc.setFillColor(0, 212, 255)
  doc.rect(0, 0, 4, pageHeight, 'F')

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text('CYBERONE', 15, 40)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(0, 212, 255)
  doc.text('SECURITY SCAN REPORT', 15, 50)

  // Meta
  doc.setFontSize(9)
  doc.setTextColor(74, 96, 112)
  doc.text(`Target: ${results.target}`, 15, 70)
  doc.text(`Scanned: ${new Date(results.timestamp).toLocaleString()}`, 15, 77)
  if (userEmail) doc.text(`Operator: ${userEmail}`, 15, 84)

  // Divider
  doc.setDrawColor(15, 33, 51)
  doc.setLineWidth(0.5)
  doc.line(15, 95, pageWidth - 15, 95)

  yPos = 110

  // ── Executive Summary ────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0, 212, 255)
  doc.text('EXECUTIVE SUMMARY', 15, yPos)
  yPos += 10

  const summaryData = [
    ['SSL Grade', results.ssl.grade, results.ssl.grade.startsWith('A') ? 'PASS' : 'WARN'],
    ['Open Ports', `${results.ports.ports.length} detected`, results.ports.ports.length > 10 ? 'HIGH' : 'LOW'],
    ['Subdomains', `${results.subdomains.total} found`, 'INFO'],
    ['Data Breaches', results.breaches.breached ? `${results.breaches.breaches.length} breach(es)` : 'None found', results.breaches.breached ? 'HIGH' : 'PASS'],
    ['Technologies', `${results.technologies.technologies.length} detected`, 'INFO'],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Finding', 'Risk']],
    body: summaryData,
    styles: { font: 'courier', fontSize: 8, fillColor: [8, 14, 22], textColor: [200, 216, 232] },
    headStyles: { fillColor: [13, 24, 36], textColor: [0, 212, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [10, 18, 28] },
    columnStyles: {
      2: {
        cellCallback: (cell: { text: string[]; styles: { textColor: number[] } }) => {
          const val = cell.text[0]
          if (val === 'PASS') cell.styles.textColor = [0, 255, 136]
          else if (val === 'HIGH') cell.styles.textColor = [255, 32, 82]
          else if (val === 'WARN') cell.styles.textColor = [255, 184, 0]
        }
      }
    },
    margin: { left: 15, right: 15 },
  })

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // ── SSL Details ──────────────────────────────────────────
  checkPageBreak(50)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(0, 212, 255)
  doc.text('SSL / TLS ANALYSIS', 15, yPos)
  yPos += 8

  autoTable(doc, {
    startY: yPos,
    body: [
      ['Grade', results.ssl.grade],
      ['Protocol', results.ssl.protocol],
      ['Key Strength', results.ssl.keyStrength ? `${results.ssl.keyStrength}-bit` : 'N/A'],
      ['Valid From', results.ssl.validFrom || 'N/A'],
      ['Valid Until', results.ssl.validTo || 'N/A'],
      ['Issuer', results.ssl.issuer || 'N/A'],
      ['Warnings', results.ssl.hasWarnings ? 'YES' : 'None'],
    ],
    styles: { font: 'courier', fontSize: 8, fillColor: [8, 14, 22], textColor: [200, 216, 232] },
    columnStyles: { 0: { textColor: [0, 212, 255], fontStyle: 'bold', cellWidth: 45 } },
    margin: { left: 15, right: 15 },
  })

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // ── Open Ports ───────────────────────────────────────────
  if (results.ports.ports.length > 0) {
    checkPageBreak(40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 212, 255)
    doc.text('OPEN PORTS', 15, yPos)
    yPos += 8

    autoTable(doc, {
      startY: yPos,
      head: [['Port', 'Protocol', 'Service', 'State']],
      body: results.ports.ports.map(p => [p.port, p.protocol, p.service, p.state]),
      styles: { font: 'courier', fontSize: 8, fillColor: [8, 14, 22], textColor: [200, 216, 232] },
      headStyles: { fillColor: [13, 24, 36], textColor: [0, 212, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [10, 18, 28] },
      margin: { left: 15, right: 15 },
    })
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // ── Subdomains ───────────────────────────────────────────
  if (results.subdomains.found.length > 0) {
    checkPageBreak(40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 212, 255)
    doc.text('SUBDOMAINS', 15, yPos)
    yPos += 8

    autoTable(doc, {
      startY: yPos,
      head: [['Subdomain']],
      body: results.subdomains.found.map(s => [s]),
      styles: { font: 'courier', fontSize: 8, fillColor: [8, 14, 22], textColor: [200, 216, 232] },
      headStyles: { fillColor: [13, 24, 36], textColor: [0, 212, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [10, 18, 28] },
      margin: { left: 15, right: 15 },
    })
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // ── Breach Data ──────────────────────────────────────────
  if (results.breaches.breaches.length > 0) {
    checkPageBreak(40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 32, 82)
    doc.text('DATA BREACHES', 15, yPos)
    yPos += 8

    autoTable(doc, {
      startY: yPos,
      head: [['Breach Name', 'Date', 'Data Types']],
      body: results.breaches.breaches.map(b => [
        b.name,
        b.date,
        b.dataClasses.slice(0, 3).join(', ')
      ]),
      styles: { font: 'courier', fontSize: 8, fillColor: [8, 14, 22], textColor: [200, 216, 232] },
      headStyles: { fillColor: [13, 24, 36], textColor: [255, 32, 82], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [10, 18, 28] },
      margin: { left: 15, right: 15 },
    })
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // ── Technologies ─────────────────────────────────────────
  if (results.technologies.technologies.length > 0) {
    checkPageBreak(40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 212, 255)
    doc.text('DETECTED TECHNOLOGIES', 15, yPos)
    yPos += 8

    autoTable(doc, {
      startY: yPos,
      head: [['Technology', 'Category', 'Version']],
      body: results.technologies.technologies.map(t => [t.name, t.category, t.version || '—']),
      styles: { font: 'courier', fontSize: 8, fillColor: [8, 14, 22], textColor: [200, 216, 232] },
      headStyles: { fillColor: [13, 24, 36], textColor: [0, 212, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [10, 18, 28] },
      margin: { left: 15, right: 15 },
    })
  }

  // ── Footer on all pages ──────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(8, 14, 22)
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F')
    doc.setFont('courier', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(74, 96, 112)
    doc.text('CYBERONE SECURITY PLATFORM — CONFIDENTIAL', 15, pageHeight - 4)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 4, { align: 'right' })
  }

  doc.save(`cyberone-${results.target}-${Date.now()}.pdf`)
}
