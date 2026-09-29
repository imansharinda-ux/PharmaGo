import { rs, fmtDate } from './format'

export function downloadInvoice(order, items) {
  const ops = []
  const esc = s => String(s).replace(/[^\x20-\x7E]/g, '-').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  const txt = (x, y, s, size, bold, rgb, right) => {
    const w = right ? String(s).length * size * (bold ? 0.56 : 0.5) : 0
    ops.push(`${rgb || '0.1 0.1 0.1'} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf ${(x - w).toFixed(1)} ${y} Td (${esc(s)}) Tj ET`)
  }
  const line = (x1, y1, x2, y2, rgb, w) => ops.push(`${rgb || '0.85 0.88 0.84'} RG ${w || 0.8} w ${x1} ${y1} m ${x2} ${y2} l S`)
  const G = '0.184 0.49 0.31'
  const M = '0.42 0.42 0.42'
  const paid = order.pay_method === 'card' || order.status === 'delivered'

  ops.push(`${G} rg 0 800 595 42 re f`)
  txt(48, 814, 'PharmaGo', 20, true, '1 1 1')
  txt(547, 814, 'INVOICE', 14, true, '1 1 1', true)
  txt(48, 760, 'Invoice No. INV-' + order.order_no.replace('PG-', ''), 11, true)
  txt(48, 744, 'Order No. ' + order.order_no, 10, false, M)
  txt(48, 730, 'Date: ' + fmtDate(order.created_at), 10, false, M)
  txt(547, 760, paid ? 'PAID' : 'PAY ON DELIVERY', 12, true, G, true)
  txt(547, 744, 'Payment: ' + (order.pay_method === 'cod' ? 'Cash on delivery' : 'Card'), 10, false, M, true)
  txt(48, 700, 'FROM', 8, true, M)
  txt(300, 700, 'BILLED TO', 8, true, M)
  ;['PharmaGo', 'No. 23, Galle Road, Galle, Sri Lanka', '+94 78 870 9802', 'imansharinda@gmail.com'].forEach((s, i) => txt(48, 684 - i * 14, s, 10))
  ;[order.customer_name || '', order.address || '', order.district || '', order.phone || ''].forEach((s, i) => txt(300, 684 - i * 14, String(s).slice(0, 44), 10))

  let y = 600
  line(48, y + 14, 547, y + 14, '0.1 0.1 0.1', 1)
  txt(48, y, 'ITEM', 8, true, M)
  txt(330, y, 'QTY', 8, true, M)
  txt(460, y, 'UNIT PRICE', 8, true, M, true)
  txt(547, y, 'AMOUNT', 8, true, M, true)
  line(48, y - 8, 547, y - 8)
  items.forEach(it => {
    y -= 30
    txt(48, y, it.name.slice(0, 40), 11, true)
    txt(48, y - 13, (it.pack_size || '') + (it.rx_required ? ' - Prescription' : ''), 9, false, M)
    txt(333, y, it.quantity, 11)
    txt(460, y, rs(it.price), 11, false, null, true)
    txt(547, y, rs(it.line_total), 11, true, null, true)
    line(48, y - 22, 547, y - 22)
    y -= 8
  })

  y -= 36
  txt(400, y, 'Subtotal', 10, false, M)
  txt(547, y, rs(order.total), 10, false, null, true)
  txt(400, y - 18, 'Delivery', 10, false, M)
  txt(547, y - 18, 'Free', 10, true, G, true)
  line(400, y - 28, 547, y - 28, '0.1 0.1 0.1', 1)
  txt(400, y - 46, 'Total', 13, true)
  txt(547, y - 46, rs(order.total), 13, true, null, true)
  txt(48, 110, 'Prescription medicines on this invoice were dispensed after verification by a licensed pharmacist.', 9, false, M)
  txt(48, 96, 'Thank you for choosing PharmaGo.', 9, false, M)
  line(48, 80, 547, 80)
  txt(48, 64, 'PharmaGo  |  +94 78 870 9802  |  imansharinda@gmail.com', 8, false, M)

  const stream = ops.join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let out = '%PDF-1.4\n'
  const offs = []
  objs.forEach((ob, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${ob}\nendobj\n` })
  const x = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(v => String(v).padStart(10, '0') + ' 00000 n \n').join('')
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`

  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }))
  a.download = `PharmaGo-Invoice-${order.order_no}.pdf`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
}