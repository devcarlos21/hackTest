exports.handler = async (event) => {
  const campana = event.queryStringParameters.campana || 'sin_nombre'
  const urlDestino = process.env.REDIRECT_URL || event.queryStringParameters.url || 'https://www.google.com'
  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'desconocido'
  const referer = event.headers['referer'] || ''

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Redireccionando...</title>
<style>
  body{background:#fff;margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;font-size:14px;color:#999}
</style>
</head>
<body>
<div>Cargando</div>
<script>
(function(){
  var data = {
    campana: ${JSON.stringify(campana)},
    url_destino: ${JSON.stringify(urlDestino)},
    ip_address: ${JSON.stringify(ip)},
    idioma: navigator.language,
    acepta_cookies: navigator.cookieEnabled,
    resolucion: screen.width + 'x' + screen.height,
    profundidad_color: screen.colorDepth,
    zona_horaria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    user_agent: navigator.userAgent,
    referer: ${JSON.stringify(referer)}
  }

  var xhr = new XMLHttpRequest()
  xhr.open('POST', '${supabaseUrl}/rest/v1/clics', true)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.setRequestHeader('apikey', '${supabaseKey}')
  xhr.onload = function() { window.location.replace(data.url_destino) }
  xhr.onerror = function() { window.location.replace(data.url_destino) }
  xhr.send(JSON.stringify(data))

  setTimeout(function() { window.location.replace(data.url_destino) }, 3000)
})()
</script>
</body>
</html>`

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: html
  }
}
