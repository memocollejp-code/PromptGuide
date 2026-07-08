// prompt_drawer sw.js v1.13.0
const CACHE_PREFIX = "prompt-drawer";
let appVersion = "20260709v1.13.0";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_VERSION") {
    appVersion = event.data.version;
  }
});

const CACHE_NAME = () => `${CACHE_PREFIX}-${appVersion}`;

// ✅ 環境非依存の相対パス（sw.jsの登録スコープ基準で解決されるため、
//    リポジトリ名変更・ローカルテスト・別ドメインでもキャッシュ登録が成功する）
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  console.log("[SW] install:", CACHE_NAME());
  event.waitUntil(
    caches.open(CACHE_NAME()).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.error("[SW] precache failed:", err);
        return Promise.resolve();
      });
    })
    // 🐞 修正1: install中にdeleteOldCaches()を呼ぶと、まだ新しいSWが
    //    画面を制御していない（＝旧SWが現在のタブを操作中の）段階で
    //    旧キャッシュが消され、動作中のアプリがクラッシュする恐れがあった。
    //    削除は必ず activate（新SWが実際に制御を握った後）でのみ行う。
    .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate:", CACHE_NAME());
  event.waitUntil(
    deleteOldCaches()
      .then(() => self.clients.claim())
      .catch((err) => console.error("[SW] activate error:", err))
  );
});

function deleteOldCaches() {
  return caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME()) {
          console.log("[SW] deleting old cache:", cacheName);
          return caches.delete(cacheName);
        }
      })
    );
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then((response) => {
      if (!response || response.status !== 200) return response;
      const clone = response.clone();

      // 🐞 修正1（揮発バグ）: cache.put()の完了を待たずにレスポンスだけ返すと、
      //    iOS Safari等ではレスポンス到達直後にSWのバックグラウンド処理が
      //    打ち切られ、ディスクへのキャッシュ書き込みが途中で失敗することがある。
      //    event.waitUntil()に書き込みタスクを渡すことで、画面表示（return response）は
      //    1ミリ秒も遅らせずに即座に行いつつ、書き込みが完了するまでブラウザに
      //    SWを終了させないようシグナルを送る。
      event.waitUntil(
        caches.open(CACHE_NAME()).then((cache) => cache.put(request, clone))
          .catch((err) => console.error("[SW] cache.put失敗:", request.url, err))
      );

      return response;
    }).catch((err) => {
      console.warn("[SW] network fetch failed, trying cache:", request.url, err);
      return caches.match(request).then((cached) => {
        if (cached) return cached;

        // 🐞 修正2: 画像やJSONなど非ナビゲーションのリクエストにまでindex.htmlを
        //    返すと、ブラウザ側でHTMLをJSONや画像としてパースしようとして
        //    エラーになり動作が不安定になっていた。
        //    index.htmlへのフォールバックは画面遷移（navigate）のリクエストのみに限定する。
        if (request.mode === "navigate") {
          console.log("[SW] navigate fallback -> index.html");
          return caches.match("./index.html");
        }

        console.error("[SW] no cache match and not a navigation request:", request.url);
        return new Response("", { status: 504, statusText: "Offline and not cached" });
      });
    })
  );
});
