import { URL } from 'url';

export class SimpleRouter {
  constructor() {
    this.routes = [];
  }

  register(method, path, handler) {
    this.routes.push({ method: method.toUpperCase(), path, handler });
  }

  get(path, handler) {
    this.register('GET', path, handler);
  }

  post(path, handler) {
    this.register('POST', path, handler);
  }

  async handle(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method.toUpperCase();

    // Find matching route
    for (const route of this.routes) {
      if (route.method !== method) continue;

      // Simple path matching with :param support
      const routeParts = route.path.split('/');
      const pathParts = pathname.split('/');

      if (routeParts.length !== pathParts.length) continue;

      let match = true;
      const params = {};

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          params[routeParts[i].slice(1)] = pathParts[i];
        } else if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        try {
          // Parse JSON body if present
          let body = null;
          if (method === 'POST' || method === 'PUT') {
            body = await parseBody(req);
          }

          await route.handler(req, res, { params, body });
          return;
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
          return;
        }
      }
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
