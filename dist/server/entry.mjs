import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_DPSfAMPx.mjs';
import { manifest } from './manifest_B5wmi999.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/aboutme.astro.mjs');
const _page2 = () => import('./pages/api/editor/opus.astro.mjs');
const _page3 = () => import('./pages/article/view.astro.mjs');
const _page4 = () => import('./pages/article/view.html.astro.mjs');
const _page5 = () => import('./pages/article/_prefix_/_id_.astro.mjs');
const _page6 = () => import('./pages/article.astro.mjs');
const _page7 = () => import('./pages/opus.astro.mjs');
const _page8 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/aboutme/index.astro", _page1],
    ["src/pages/api/editor/opus.ts", _page2],
    ["src/pages/article/view.astro", _page3],
    ["src/pages/article/view.html.astro", _page4],
    ["src/pages/article/[prefix]/[id].astro", _page5],
    ["src/pages/article/index.astro", _page6],
    ["src/pages/opus/index.astro", _page7],
    ["src/pages/index.astro", _page8]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///Users/nattsu/dev/project/nattsu-gallery/dist/client/",
    "server": "file:///Users/nattsu/dev/project/nattsu-gallery/dist/server/",
    "host": false,
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
