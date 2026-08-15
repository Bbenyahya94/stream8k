'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
});

const ROUTE_REDIRECTS = new Map([
  ['/subscriptions', '/subscription'],
  ['/reseller-panels', '/reseller'],
  ['/features', '/#features'],
  ['/devices', '/#devices'],
  ['/iptv-guide', '/#iptv-guide'],
  ['/server-directory', '/#server-directory'],
  ['/faq', '/#faq']
]);

const PRIVATE_FILES = new Set([
  'server.js',
  'package.json',
  'nixpacks.toml',
  'coolify-deployment.txt'
]);

function setSecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

function sendPlain(response, statusCode, message, requestMethod) {
  const body = Buffer.from(message, 'utf8');
  setSecurityHeaders(response);
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  });
  response.end(requestMethod === 'HEAD' ? undefined : body);
}

function redirect(response, requestMethod, location) {
  const body = Buffer.from(`Moved permanently to ${location}\n`, 'utf8');
  setSecurityHeaders(response);
  response.writeHead(301, {
    Location: location,
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'public, max-age=86400'
  });
  response.end(requestMethod === 'HEAD' ? undefined : body);
}

function safeResolve(relativePath) {
  const resolvedPath = path.resolve(ROOT, relativePath);
  if (resolvedPath !== ROOT && !resolvedPath.startsWith(`${ROOT}${path.sep}`)) {
    return null;
  }
  return resolvedPath;
}

function cacheControlFor(extension, statusCode) {
  if (statusCode !== 200 || extension === '.html') {
    return 'no-cache';
  }
  if (['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(extension)) {
    return 'public, max-age=604800, stale-while-revalidate=86400';
  }
  return 'public, max-age=3600, stale-while-revalidate=86400';
}

async function sendFile(request, response, filePath, statusCode = 200) {
  const stats = await fs.promises.stat(filePath);
  if (!stats.isFile()) {
    const error = new Error('Not a file');
    error.code = 'ENOENT';
    throw error;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = extension === '.html'
    ? 'text/html; charset=utf-8'
    : MIME_TYPES[extension] || 'application/octet-stream';
  const etag = `W/\"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}\"`;

  setSecurityHeaders(response);
  response.setHeader('Content-Type', contentType);
  response.setHeader('Content-Length', stats.size);
  response.setHeader('Cache-Control', cacheControlFor(extension, statusCode));
  response.setHeader('ETag', etag);
  response.setHeader('Last-Modified', stats.mtime.toUTCString());

  if (statusCode === 200 && request.headers['if-none-match'] === etag) {
    response.removeHeader('Content-Length');
    response.writeHead(304);
    response.end();
    return;
  }

  response.writeHead(statusCode);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => response.destroy());
  stream.pipe(response);
}

async function sendNotFound(request, response) {
  const notFoundPath = safeResolve('404.html');
  try {
    await sendFile(request, response, notFoundPath, 404);
  } catch {
    sendPlain(response, 404, '404 - Page not found\n', request.method);
  }
}

function decodedRequestPath(requestUrl) {
  const rawPath = String(requestUrl || '/').split(/[?#]/, 1)[0];
  const decodedRawPath = decodeURIComponent(rawPath).replace(/\\/g, '/');
  const segments = decodedRawPath.split('/');

  if (decodedRawPath.includes('\0') || segments.includes('..') || segments.some((segment) => segment.startsWith('.'))) {
    return null;
  }

  const parsedUrl = new URL(requestUrl || '/', 'http://localhost');
  return {
    pathname: decodeURIComponent(parsedUrl.pathname).replace(/\\/g, '/'),
    search: parsedUrl.search
  };
}

async function handleRequest(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    setSecurityHeaders(response);
    response.setHeader('Allow', 'GET, HEAD');
    sendPlain(response, 405, 'Method not allowed\n', request.method);
    return;
  }

  let requestPath;
  try {
    requestPath = decodedRequestPath(request.url);
  } catch {
    sendPlain(response, 400, 'Bad request\n', request.method);
    return;
  }

  if (!requestPath) {
    sendPlain(response, 403, 'Forbidden\n', request.method);
    return;
  }

  let { pathname } = requestPath;
  const { search } = requestPath;
  pathname = pathname.replace(/\/{2,}/g, '/');

  if (pathname !== '/' && pathname.endsWith('/')) {
    redirect(response, request.method, `${encodeURI(pathname.slice(0, -1))}${search}`);
    return;
  }

  if (/\/index\.html$/i.test(pathname)) {
    const parentRoute = pathname.replace(/\/index\.html$/i, '') || '/';
    redirect(response, request.method, `${encodeURI(parentRoute)}${search}`);
    return;
  }

  if (/\.html$/i.test(pathname)) {
    let cleanRoute = pathname.replace(/\.html$/i, '') || '/';
    if (cleanRoute === '/index') {
      cleanRoute = '/';
    }
    cleanRoute = ROUTE_REDIRECTS.get(cleanRoute) || cleanRoute;
    redirect(response, request.method, `${encodeURI(cleanRoute)}${search}`);
    return;
  }

  const canonicalRedirect = ROUTE_REDIRECTS.get(pathname);
  if (canonicalRedirect) {
    redirect(response, request.method, `${canonicalRedirect}${search}`);
    return;
  }

  if (pathname === '/404') {
    await sendNotFound(request, response);
    return;
  }

  if (pathname === '/') {
    await sendFile(request, response, safeResolve('index.html'));
    return;
  }

  const extension = path.extname(pathname).toLowerCase();
  if (extension) {
    const relativeAssetPath = pathname.replace(/^\/+/, '');
    if (PRIVATE_FILES.has(relativeAssetPath.toLowerCase())) {
      await sendNotFound(request, response);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(MIME_TYPES, extension)) {
      await sendNotFound(request, response);
      return;
    }

    const assetPath = safeResolve(relativeAssetPath);
    if (!assetPath) {
      sendPlain(response, 403, 'Forbidden\n', request.method);
      return;
    }

    try {
      await sendFile(request, response, assetPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await sendNotFound(request, response);
        return;
      }
      throw error;
    }
    return;
  }

  const pagePath = safeResolve(`${pathname.replace(/^\/+/, '')}.html`);
  if (!pagePath) {
    sendPlain(response, 403, 'Forbidden\n', request.method);
    return;
  }

  try {
    await sendFile(request, response, pagePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await sendNotFound(request, response);
      return;
    }
    throw error;
  }
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    if (!response.headersSent) {
      sendPlain(response, 500, 'Internal server error\n', request.method);
    } else {
      response.destroy();
    }
  });
});

server.on('clientError', (error, socket) => {
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`8KStream is listening on http://${HOST}:${PORT}`);
});
