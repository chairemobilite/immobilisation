import { Application, Router } from "express";


type RouteInfo = {
  path: string;
  methods: string[];
  middlewares: string[];
};

export function extractRoutes(app: Application): RouteInfo[] {
  return extractRoutesFromStack((app._router?.stack ?? []), '');
}

function extractRoutesFromStack(stack: any[], prefix: string= ''): RouteInfo[] {
  const routes: RouteInfo[] = [];

  for (const layer of stack) {
    if (layer.route) {
      const path = prefix + layer.route.path;
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      const middlewares = layer.route.stack
        .map((mw: any) => mw.name || '<anonymous>')
        .filter((name: string) => name !== '<anonymous>');

      routes.push({ path, methods, middlewares });
    } else if (layer.name === 'router' && layer.handle?.stack) {
      const mountPath = extractMountPath(layer);
      const newPrefix = prefix + mountPath;
      const childRoutes = extractRoutesFromStack(layer.handle.stack, newPrefix);
      routes.push(...childRoutes);
    }
  }

  return routes;
}

function extractMountPath(layer: any): string {
  if (layer.regexp && layer.regexp.source) {
    const match = layer.regexp.source.match(/\\\/([^\\]+)(?=\\\/\?\(\?=\\\/\|\$\))/);
    if (match) return '/' + match[1];
  }
  return '';
}
const adminRoutes =(app: Application) => {
  const router = Router();

  router.get("/routes", (req, res) => {
    res.json(extractRoutes(app));
  });

  return router;
};

export default adminRoutes;