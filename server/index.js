import { createReadStream, existsSync, statSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

import app from '../dist/rsc/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDir = path.join(__dirname, '..', 'dist', 'client')
const port = Number(process.env.PORT || 3000)

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const staticFile = resolveStaticFile(requestUrl.pathname)

    if (staticFile) {
      await serveStaticFile(staticFile, req, res)
      return
    }

    const response = await app.fetch(createWebRequest(req, requestUrl))
    await sendWebResponse(response, req, res)
  } catch (error) {
    console.error(error)
    if (!res.headersSent) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    }
    res.end('Internal Server Error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`)
})

function resolveStaticFile(pathname) {
  const decodedPath = decodeURIComponent(pathname)
  const relativePath = decodedPath.replace(/^\/+/, '')
  if (!relativePath) {
    return null
  }

  const filePath = path.resolve(clientDir, relativePath)
  if (!filePath.startsWith(clientDir + path.sep) && filePath !== clientDir) {
    return null
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return null
  }
  return filePath
}

async function serveStaticFile(filePath, req, res) {
  const ext = path.extname(filePath)
  const headers = {
    'cache-control':
      ext.startsWith('.woff') || ext === '.js' || ext === '.css'
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600',
    'content-type': mimeTypes[ext] || 'application/octet-stream'
  }

  res.writeHead(200, headers)
  if (req.method === 'HEAD') {
    res.end()
    return
  }

  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath)
    stream.on('error', reject)
    stream.on('end', resolve)
    stream.pipe(res)
  })
}

function createWebRequest(req, requestUrl) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item)
      }
      continue
    }
    if (value !== undefined) {
      headers.set(key, value)
    }
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  return new Request(requestUrl, {
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: hasBody ? 'half' : undefined,
    headers,
    method: req.method
  })
}

async function sendWebResponse(response, req, res) {
  for (const [key, value] of response.headers.entries()) {
    res.setHeader(key, value)
  }

  res.writeHead(response.status)
  if (!response.body || req.method === 'HEAD') {
    res.end()
    return
  }

  await new Promise((resolve, reject) => {
    const stream = Readable.fromWeb(response.body)
    stream.on('error', reject)
    stream.on('end', resolve)
    stream.pipe(res)
  })
}
