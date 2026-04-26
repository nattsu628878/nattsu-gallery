import 'piccolore';
import { f as decodeKey } from './chunks/astro/server_B5boBF5S.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_CLC0OA5R.mjs';
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

const manifest = deserializeManifest({"hrefRoot":"file:///Users/nattsu/dev/project/nattsu-gallery/","cacheDir":"file:///Users/nattsu/dev/project/nattsu-gallery/node_modules/.astro/","outDir":"file:///Users/nattsu/dev/project/nattsu-gallery/dist/","srcDir":"file:///Users/nattsu/dev/project/nattsu-gallery/src/","publicDir":"file:///Users/nattsu/dev/project/nattsu-gallery/public/","buildClientDir":"file:///Users/nattsu/dev/project/nattsu-gallery/dist/client/","buildServerDir":"file:///Users/nattsu/dev/project/nattsu-gallery/dist/server/","adapterName":"@astrojs/node","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"aboutme/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/aboutme","isIndex":true,"type":"page","pattern":"^\\/aboutme\\/?$","segments":[[{"content":"aboutme","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/aboutme/index.astro","pathname":"/aboutme","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"article/view/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/article/view","isIndex":false,"type":"page","pattern":"^\\/article\\/view\\/?$","segments":[[{"content":"article","dynamic":false,"spread":false}],[{"content":"view","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/article/view.astro","pathname":"/article/view","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"article/view.html/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/article/view.html","isIndex":false,"type":"page","pattern":"^\\/article\\/view\\.html\\/?$","segments":[[{"content":"article","dynamic":false,"spread":false}],[{"content":"view.html","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/article/view.html.astro","pathname":"/article/view.html","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"article/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/article","isIndex":true,"type":"page","pattern":"^\\/article\\/?$","segments":[[{"content":"article","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/article/index.astro","pathname":"/article","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"opus/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/opus","isIndex":true,"type":"page","pattern":"^\\/opus\\/?$","segments":[[{"content":"opus","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/opus/index.astro","pathname":"/opus","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"timeline/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/timeline","isIndex":true,"type":"page","pattern":"^\\/timeline\\/?$","segments":[[{"content":"timeline","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/timeline/index.astro","pathname":"/timeline","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/nattsu-gallery/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/nattsu/dev/project/nattsu-gallery/src/pages/aboutme/index.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/article/view.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/article/view.html.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/article/[prefix]/[id].astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/article/index.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/opus/index.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/timeline/index.astro",{"propagation":"none","containsHead":true}],["/Users/nattsu/dev/project/nattsu-gallery/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/aboutme/index@_@astro":"pages/aboutme.astro.mjs","\u0000@astro-page:src/pages/article/view@_@astro":"pages/article/view.astro.mjs","\u0000@astro-page:src/pages/article/view.html@_@astro":"pages/article/view.html.astro.mjs","\u0000@astro-page:src/pages/article/[prefix]/[id]@_@astro":"pages/article/_prefix_/_id_.astro.mjs","\u0000@astro-page:src/pages/article/index@_@astro":"pages/article.astro.mjs","\u0000@astro-page:src/pages/opus/index@_@astro":"pages/opus.astro.mjs","\u0000@astro-page:src/pages/timeline/index@_@astro":"pages/timeline.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_tXk1dAwZ.mjs","/Users/nattsu/dev/project/nattsu-gallery/node_modules/unstorage/drivers/fs-lite.mjs":"chunks/fs-lite_COtHaKzy.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/AbletonLiveの思想.md":"chunks/AbletonLiveの思想_BSO3h7Zq.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/Bevy(Rust)_env.md":"chunks/Bevy(Rust)_env_SYBiq0LZ.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/Bevy.md":"chunks/Bevy_BvBoK_bV.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/Compressor.md":"chunks/Compressor_CPCGJwSI.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/DataとかToolとかの話.md":"chunks/DataとかToolとかの話_hOWAdAB6.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/GodotでLowpoly.md":"chunks/GodotでLowpoly_B7syLAq9.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/LUFS.md":"chunks/LUFS_Wg8dB6Me.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/LogicProの思想.md":"chunks/LogicProの思想_CBMteJz6.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/Mastering Assistant.md":"chunks/Mastering Assistant_CyV3eN-I.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/PCの威力を初心者に教える.md":"chunks/PCの威力を初心者に教える_DqJ4dPf7.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/RMS.md":"chunks/RMS_D7f8aTlb.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/Rust.md":"chunks/Rust_BRSlpRHz.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/Rust_env.md":"chunks/Rust_env_xtw1bojZ.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/Rust_便利機能.md":"chunks/Rust_便利機能_Ws1IXbrT.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/SteamOS.md":"chunks/SteamOS_DBKZEZJN.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/SteamOSで日本語入力.md":"chunks/SteamOSで日本語入力_Dt4QJjmY.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/TDA_env.md":"chunks/TDA_env_CIIFkNUr.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/Tauri.md":"chunks/Tauri_gMShsFrI.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/Tauri_env.md":"chunks/Tauri_env_CBb-JUSm.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/ZorinOS.md":"chunks/ZorinOS_evSPrV3Z.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/_home.md":"chunks/_home_B99Zimfa.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/cursor_env.md":"chunks/cursor_env_BEJiAr5m.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/dotfilesを作りたい.md":"chunks/dotfilesを作りたい_5VU5HKz5.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/dtm_mixing_resources.md":"chunks/dtm_mixing_resources_CV4cTGpL.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/github-repo-list.md":"chunks/github-repo-list_Dq0cv9AA.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/homepage向けweb技術.md":"chunks/homepage向けweb技術_CCWKxBaF.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/pyxelでゲーム作りの工程を全て体験してみた.md":"chunks/pyxelでゲーム作りの工程を全て体験してみた_ojvO4hYk.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/short-cut-key.md":"chunks/short-cut-key_DbJwnjZW.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/test.md":"chunks/test_B-2CkSIt.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/unsafeなRust.md":"chunks/unsafeなRust_CeHsaeg6.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/コンピュータシステムの理論と実装 with Turing Complete.md":"chunks/コンピュータシステムの理論と実装 with Turing Complete_C8I1yP4C.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/所有権システム.md":"chunks/所有権システム_BAi-4hN2.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/data/article/content/article/開発環境2025.md":"chunks/開発環境2025_y8fFs5ak.mjs","/Users/nattsu/dev/project/nattsu-gallery/src/components/aboutme/AboutMeView.svelte":"_astro/AboutMeView.B5C0EkSe.js","/Users/nattsu/dev/project/nattsu-gallery/src/components/article/ArticleView.svelte":"_astro/ArticleView.BW_-Yv1Q.js","/Users/nattsu/dev/project/nattsu-gallery/src/components/article/ArticleList.svelte":"_astro/ArticleList.DxteNo3i.js","/Users/nattsu/dev/project/nattsu-gallery/src/components/opus/OpusView.svelte":"_astro/OpusView.HmNYZinR.js","/Users/nattsu/dev/project/nattsu-gallery/src/components/timeline/TimelineView.svelte":"_astro/TimelineView.CV422jzD.js","@astrojs/svelte/client.js":"_astro/client.svelte.BtBvhKI0.js","/Users/nattsu/dev/project/nattsu-gallery/src/pages/index.astro?astro&type=script&index=0&lang.ts":"_astro/index.astro_astro_type_script_index_0_lang.B9rlLQAj.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/Users/nattsu/dev/project/nattsu-gallery/src/pages/index.astro?astro&type=script&index=0&lang.ts","(()=>{if(new URLSearchParams(window.location.search).get(\"mode\")===\"about\"){window.location.replace(\"aboutme/\"+window.location.hash);return}window.location.replace(\"opus/\"+window.location.search+window.location.hash)})();"]],"assets":["/nattsu-gallery/_astro/26-03-29-13.DQROAJGC.webp","/nattsu-gallery/_astro/26-03-29-2.QwsDO1WM.webp","/nattsu-gallery/_astro/26-03-29-7.CRgp0mJt.webp","/nattsu-gallery/_astro/26-03-29-3.CKXc5_yZ.webp","/nattsu-gallery/_astro/26-03-29-4.DbWq7pKO.webp","/nattsu-gallery/_astro/26-03-29-9.BsLm_kFI.webp","/nattsu-gallery/_astro/26-03-29-6.Cpf7ued2.webp","/nattsu-gallery/_astro/26-03-29.DwSO_OwQ.webp","/nattsu-gallery/_astro/26-03-29-5.DaF5MaCk.webp","/nattsu-gallery/_astro/26-04-08.CVbMykCZ.webp","/nattsu-gallery/_astro/26-03-29-14.BY_CjwoY.webp","/nattsu-gallery/_astro/26-03-29-12.3y638GhI.webp","/nattsu-gallery/_astro/26-03-29-11.CMmG5NAY.webp","/nattsu-gallery/_astro/26-03-29-15.DYbfTcz2.webp","/nattsu-gallery/_astro/26-05-01.SLOG0myQ.webp","/nattsu-gallery/_astro/26-03-29-10.tTl3iy8N.webp","/nattsu-gallery/_astro/26-03-29-8.BPSBeU0l.webp","/nattsu-gallery/_astro/26-04-23-2.BGNQCnMo.webp","/nattsu-gallery/_astro/26-04-23.D7qFgrc4.webp","/nattsu-gallery/_astro/index.DWKp7x4b.css","/nattsu-gallery/_astro/_id_.OinJ6G8r.css","/nattsu-gallery/_astro/index.C5YoaoTg.css","/nattsu-gallery/_astro/AboutMeView.B5C0EkSe.js","/nattsu-gallery/_astro/ArticleList.DxteNo3i.js","/nattsu-gallery/_astro/ArticleView.BW_-Yv1Q.js","/nattsu-gallery/_astro/OpusView.HmNYZinR.js","/nattsu-gallery/_astro/TimelineView.CV422jzD.js","/nattsu-gallery/_astro/attributes.BtqVyj1e.js","/nattsu-gallery/_astro/client.svelte.BtBvhKI0.js","/nattsu-gallery/_astro/html.CKu_LnND.js","/nattsu-gallery/_astro/index.4KnEDPBq.js","/nattsu-gallery/_astro/lifecycle.PfvqJbYg.js","/nattsu-gallery/_astro/props.DXHNaH-b.js","/nattsu-gallery/_astro/render.C1fy5U-Q.js","/nattsu-gallery/_astro/template.Cq8MgjJN.js","/nattsu-gallery/aboutme/ableton-live.webp","/nattsu-gallery/aboutme/final-cut-pro.webp","/nattsu-gallery/aboutme/lilypond.webp","/nattsu-gallery/aboutme/logic-pro.webp","/nattsu-gallery/aboutme/motion.webp","/nattsu-gallery/aboutme/nattsu_320_320_tt.webp","/nattsu-gallery/aboutme/nattsu_real.webp","/nattsu-gallery/aboutme/renoise.webp","/nattsu-gallery/aboutme/steamdeck-color.svg","/nattsu-gallery/aboutme/touch-designer.webp","/nattsu-gallery/aboutme/zorin-color.svg","/nattsu-gallery/timeline/emo.webp","/nattsu-gallery/timeline/nattsu_320_320_tt.webp","/nattsu-gallery/timeline/tech.webp","/nattsu-gallery/aboutme/index.html","/nattsu-gallery/article/view/index.html","/nattsu-gallery/article/view.html/index.html","/nattsu-gallery/article/index.html","/nattsu-gallery/opus/index.html","/nattsu-gallery/timeline/index.html","/nattsu-gallery/index.html"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"RN9U89p+dgzwg6O52x5RUzgxAOIzjghgh2tJLnLmgXk=","sessionConfig":{"driver":"fs-lite","options":{"base":"/Users/nattsu/dev/project/nattsu-gallery/node_modules/.astro/sessions"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/fs-lite_COtHaKzy.mjs');

export { manifest };
