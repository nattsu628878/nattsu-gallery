import 'piccolore';
import { o as decodeKey } from './chunks/astro/server_BBgmcOY7.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_Bz5bhc2r.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/nattsu/dev/project/nattsu-gallery/","cacheDir":"file:///Users/nattsu/dev/project/nattsu-gallery/node_modules/.astro/","outDir":"file:///Users/nattsu/dev/project/nattsu-gallery/dist/","srcDir":"file:///Users/nattsu/dev/project/nattsu-gallery/src/","publicDir":"file:///Users/nattsu/dev/project/nattsu-gallery/public/","buildClientDir":"file:///Users/nattsu/dev/project/nattsu-gallery/dist/client/","buildServerDir":"file:///Users/nattsu/dev/project/nattsu-gallery/dist/server/","adapterName":"@astrojs/node","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"aboutme/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/aboutme","isIndex":true,"type":"page","pattern":"^\\/aboutme\\/?$","segments":[[{"content":"aboutme","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/aboutme/index.astro","pathname":"/aboutme","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"article/view/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/article/view","isIndex":false,"type":"page","pattern":"^\\/article\\/view\\/?$","segments":[[{"content":"article","dynamic":false,"spread":false}],[{"content":"view","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/article/view.astro","pathname":"/article/view","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"article/view.html/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/article/view.html","isIndex":false,"type":"page","pattern":"^\\/article\\/view\\.html\\/?$","segments":[[{"content":"article","dynamic":false,"spread":false}],[{"content":"view.html","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/article/view.html.astro","pathname":"/article/view.html","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"article/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/article","isIndex":true,"type":"page","pattern":"^\\/article\\/?$","segments":[[{"content":"article","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/article/index.astro","pathname":"/article","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"opus/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/opus","isIndex":true,"type":"page","pattern":"^\\/opus\\/?$","segments":[[{"content":"opus","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/opus/index.astro","pathname":"/opus","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/node.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/editor/opus","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/editor\\/opus\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"editor","dynamic":false,"spread":false}],[{"content":"opus","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/editor/opus.ts","pathname":"/api/editor/opus","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/nattsu-gallery/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/nattsu/dev/project/nattsu-gallery/src/pages/aboutme/index.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/article/view.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/article/view.html.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/article/[prefix]/[id].astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/article/index.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/opus/index.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/aboutme/index@_@astro":"pages/aboutme.astro.mjs","\u0000@astro-page:src/pages/api/editor/opus@_@ts":"pages/api/editor/opus.astro.mjs","\u0000@astro-page:src/pages/article/view@_@astro":"pages/article/view.astro.mjs","\u0000@astro-page:src/pages/article/view.html@_@astro":"pages/article/view.html.astro.mjs","\u0000@astro-page:src/pages/article/[prefix]/[id]@_@astro":"pages/article/_prefix_/_id_.astro.mjs","\u0000@astro-page:src/pages/article/index@_@astro":"pages/article.astro.mjs","\u0000@astro-page:src/pages/opus/index@_@astro":"pages/opus.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/node@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_B5wmi999.mjs","/Users/nattsu/dev/project/nattsu-gallery/node_modules/unstorage/drivers/fs-lite.mjs":"chunks/fs-lite_COtHaKzy.mjs","/Users/nattsu/dev/project/nattsu-gallery/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_ByunQYr0.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/AbletonLiveの思想.md":"chunks/AbletonLiveの思想_BedryXzX.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/Bevy(Rust)_env.md":"chunks/Bevy(Rust)_env_C5DoEAQN.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/Bevy.md":"chunks/Bevy_BeMekFVA.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/Compressor.md":"chunks/Compressor_CY37SY7Q.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/DataとかToolとかの話.md":"chunks/DataとかToolとかの話_pJXcNBYS.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/GodotでLowpoly.md":"chunks/GodotでLowpoly_BIoySYk2.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/LUFS.md":"chunks/LUFS_BLDEURRM.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/LogicProの思想.md":"chunks/LogicProの思想_BzcW5v3h.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/Mastering Assistant.md":"chunks/Mastering Assistant_lGVzZuh2.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/PCの威力を初心者に教える.md":"chunks/PCの威力を初心者に教える_DjdEgB4R.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/RMS.md":"chunks/RMS_CejijEay.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/Rust.md":"chunks/Rust_DaLgskpz.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/Rust_env.md":"chunks/Rust_env_C825C5OM.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/Rust_便利機能.md":"chunks/Rust_便利機能__MgCEa51.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/SteamOS.md":"chunks/SteamOS_CLy-Y3QT.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/SteamOSで日本語入力.md":"chunks/SteamOSで日本語入力_BmLvoBNd.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/TDA_env.md":"chunks/TDA_env_CAl3pvSZ.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/Tauri.md":"chunks/Tauri_B4TZ6-83.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/Tauri_env.md":"chunks/Tauri_env_BcDMIg-C.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/ZorinOS.md":"chunks/ZorinOS_uBIYlXxf.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/_home.md":"chunks/_home_CTodqW3y.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/cursor_env.md":"chunks/cursor_env_x6UdD-3p.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/dotfilesを作りたい.md":"chunks/dotfilesを作りたい_DhPEqnt8.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/dtm_mixing_resources.md":"chunks/dtm_mixing_resources_B1cHKoPT.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/github-repo-list.md":"chunks/github-repo-list_Cji1XqeE.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/homepage向けweb技術.md":"chunks/homepage向けweb技術_Be8p-He6.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/pyxelでゲーム作りの工程を全て体験してみた.md":"chunks/pyxelでゲーム作りの工程を全て体験してみた_DzEgbYOj.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/short-cut-key.md":"chunks/short-cut-key_C2kRHUyI.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/unsafeなRust.md":"chunks/unsafeなRust_Ctmb5ymr.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/コンピュータシステムの理論と実装 with Turing Complete.md":"chunks/コンピュータシステムの理論と実装 with Turing Complete_C9m3TFMr.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/所有権システム.md":"chunks/所有権システム_D48n7aUK.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/markdown/開発環境2025.md":"chunks/開発環境2025_DcBvhMZR.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/components/aboutme/AboutMeView.svelte":"_astro/AboutMeView.vOifEVMW.js","/Users/nattsu/dev/project/nattsu-gallery/src/components/article/ArticleView.svelte":"_astro/ArticleView.CRYp60lo.js","/Users/nattsu/dev/project/nattsu-gallery/src/components/article/ArticleList.svelte":"_astro/ArticleList.DZeH698l.js","/Users/nattsu/dev/project/nattsu-gallery/src/components/opus/OpusView.svelte":"_astro/OpusView.CCRIKwyD.js","@astrojs/svelte/client.js":"_astro/client.svelte.V8msrdGc.js","/Users/nattsu/dev/project/nattsu-gallery/src/pages/index.astro?astro&type=script&index=0&lang.ts":"_astro/index.astro_astro_type_script_index_0_lang.B9rlLQAj.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/Users/nattsu/dev/project/nattsu-gallery/src/pages/index.astro?astro&type=script&index=0&lang.ts","(()=>{if(new URLSearchParams(window.location.search).get(\"mode\")===\"about\"){window.location.replace(\"aboutme/\"+window.location.hash);return}window.location.replace(\"opus/\"+window.location.search+window.location.hash)})();"]],"assets":["/nattsu-gallery/_astro/スクリーンショット 2026-01-06 9.40.56.9569NyTa.webp","/nattsu-gallery/_astro/スクリーンショット 2026-02-10 1.26.50.BwSu-IH-.webp","/nattsu-gallery/_astro/画面収録 2025-12-31 7.03.36.B6nUpz_v.webm","/nattsu-gallery/_astro/_id_.OinJ6G8r.css","/nattsu-gallery/_astro/index.deMgeR1Q.css","/nattsu-gallery/_astro/AboutMeView.vOifEVMW.js","/nattsu-gallery/_astro/ArticleList.DZeH698l.js","/nattsu-gallery/_astro/ArticleView.CRYp60lo.js","/nattsu-gallery/_astro/OpusView.CCRIKwyD.js","/nattsu-gallery/_astro/attributes.Bgd70Za1.js","/nattsu-gallery/_astro/client.svelte.V8msrdGc.js","/nattsu-gallery/_astro/html.DZmuDGCI.js","/nattsu-gallery/_astro/lifecycle.CDCPPskx.js","/nattsu-gallery/_astro/props.idlwI3vP.js","/nattsu-gallery/_astro/render.BO41xuV9.js","/nattsu-gallery/_astro/template.ecjch-SD.js","/nattsu-gallery/aboutme/ableton-live.webp","/nattsu-gallery/aboutme/final-cut-pro.webp","/nattsu-gallery/aboutme/logic-pro.webp","/nattsu-gallery/aboutme/motion.webp","/nattsu-gallery/aboutme/nattsu_320_320_tt.webp","/nattsu-gallery/aboutme/nattsu_real.webp","/nattsu-gallery/aboutme/renoise.webp","/nattsu-gallery/aboutme/touch-designer.webp","/nattsu-gallery/opus/2026-03-29-10.webp","/nattsu-gallery/opus/2026-03-29-11.webp","/nattsu-gallery/opus/2026-03-29-12.webp","/nattsu-gallery/opus/2026-03-29-13.webp","/nattsu-gallery/opus/2026-03-29-14.webp","/nattsu-gallery/opus/2026-03-29-15.webp","/nattsu-gallery/opus/2026-03-29-2.webp","/nattsu-gallery/opus/2026-03-29-3.webp","/nattsu-gallery/opus/2026-03-29-4.webp","/nattsu-gallery/opus/2026-03-29-5.webp","/nattsu-gallery/opus/2026-03-29-6.webp","/nattsu-gallery/opus/2026-03-29-7.webp","/nattsu-gallery/opus/2026-03-29-8.webp","/nattsu-gallery/opus/2026-03-29-9.webp","/nattsu-gallery/opus/2026-03-29.webp","/nattsu-gallery/opus/2026-04-08.webp","/nattsu-gallery/opus/2026-04-23.webp","/nattsu-gallery/aboutme/index.html","/nattsu-gallery/article/view/index.html","/nattsu-gallery/article/view.html/index.html","/nattsu-gallery/article/index.html","/nattsu-gallery/opus/index.html","/nattsu-gallery/index.html"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"4QAHk7rMkCzdBn4u0Rgfs9kv2cIqUXF+oLVpGQy9/qg=","sessionConfig":{"driver":"fs-lite","options":{"base":"/Users/nattsu/dev/project/nattsu-gallery/node_modules/.astro/sessions"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/fs-lite_COtHaKzy.mjs');

export { manifest };
