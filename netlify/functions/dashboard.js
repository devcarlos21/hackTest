const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const expectedToken = process.env.ADMIN_TOKEN

exports.handler = async (event) => {
  const token = event.queryStringParameters.token
  if (!token || token !== expectedToken) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<h1>401 No autorizado</h1><p>Token inv&aacute;lido. No tienes permiso para acceder a este panel.</p>'
    }
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<h1>500 Error de configuraci&oacute;n</h1><p>Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY.</p>'
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let total = 0
  let resumen = {}
  let ultimos = []

  try {
    const { data: todos } = await supabase
      .from('clics')
      .select('campana, creado_en, user_agent, ip_address, idioma, resolucion')
      .order('creado_en', { ascending: false })
      .limit(200)

    if (todos && todos.length > 0) {
      total = todos.length
      ultimos = todos.slice(0, 50)

      for (const c of todos) {
        if (!resumen[c.campana]) resumen[c.campana] = 0
        resumen[c.campana]++
      }
    }
  } catch (e) {
    console.error('Error al consultar Supabase:', e)
  }

  let resumenRows = ''
  const sortedCamps = Object.entries(resumen).sort((a, b) => b[1] - a[1])
  for (const [camp, count] of sortedCamps) {
    resumenRows += `<tr><td>${esc(camp)}</td><td>${count}</td></tr>`
  }

  let ultimosRows = ''
  for (const c of ultimos) {
    ultimosRows += `<tr>
      <td>${c.creado_en ? new Date(c.creado_en).toLocaleString() : '-'}</td>
      <td>${esc(c.campana)}</td>
      <td title="${esc(c.user_agent || '')}">${trunc(esc(c.user_agent || '-'), 45)}</td>
      <td>${esc(c.ip_address || '-')}</td>
      <td>${esc(c.idioma || '-')}</td>
      <td>${esc(c.resolucion || '-')}</td>
    </tr>`
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Click Tracker Dashboard</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f2f5;padding:20px;color:#333}
  h1{font-size:24px;margin-bottom:20px;color:#1a1a2e}
  h2{font-size:18px;margin:30px 0 15px;color:#1a1a2e}
  .stats{display:flex;gap:15px;margin-bottom:25px;flex-wrap:wrap}
  .card{background:#fff;padding:20px 25px;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.12);flex:1;min-width:150px}
  .card .label{font-size:12px;text-transform:uppercase;color:#888;margin-bottom:5px;letter-spacing:0.5px}
  .card .value{font-size:32px;font-weight:700;color:#1a73e8}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.12);margin-bottom:30px}
  th{background:#1a73e8;color:#fff;padding:12px 15px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
  td{padding:10px 15px;border-bottom:1px solid #eee;font-size:13px}
  tr:last-child td{border-bottom:none}
  tr:hover{background:#f8faff}
  @media(max-width:600px){td,th{padding:8px 10px;font-size:12px}}
</style>
</head>
<body>
  <h1>Click Tracker Dashboard</h1>

  <div class="stats">
    <div class="card"><div class="label">Total Clicks</div><div class="value">${total}</div></div>
    <div class="card"><div class="label">Campa&ntilde;as</div><div class="value">${Object.keys(resumen).length}</div></div>
  </div>

  <h2>Resumen por Campa&ntilde;a</h2>
  <table>
    <thead><tr><th>Campa&ntilde;a</th><th>Clicks</th></tr></thead>
    <tbody>${resumenRows || '<tr><td colspan="2" style="text-align:center;padding:30px;color:#999">Sin datos</td></tr>'}</tbody>
  </table>

  <h2>&Uacute;ltimos Clicks (m&aacute;x 50)</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Campa&ntilde;a</th><th>User-Agent</th><th>IP</th><th>Idioma</th><th>Resoluci&oacute;n</th></tr></thead>
    <tbody>${ultimosRows || '<tr><td colspan="6" style="text-align:center;padding:30px;color:#999">Sin datos</td></tr>'}</tbody>
  </table>
</body>
</html>`

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html
  }
}

function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function trunc(str, max) {
  if (str.length <= max) return str
  return str.substring(0, max) + '...'
}
