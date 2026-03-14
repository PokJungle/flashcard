export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlashcardsApp/1.0)',
        'Referer': 'https://en.wikipedia.org/'
      }
    })

    if (!response.ok) return res.status(response.status).send('Fetch failed')

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=604800')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.send(Buffer.from(buffer))
  } catch (e) {
    res.status(500).send('Error: ' + e.message)
  }
}