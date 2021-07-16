const APP_PREFIX = "BudgetEvent-";
const VERSION = "version_01";
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = APP_PREFIX + "data_cache" + VERSION;
const FILES_TO_CACHE = [
	"/",
	"./index.html",
	"./css/styles.css",
	"./js/idb.js",
	"./js/index.js",
];

// Intercept Fetch requests and server up cached content
self.addEventListener("fetch", event => {
	console.log(event.request.url);
	if (event.request.url.includes("/api")) {
		event.respondWith(
			caches
				.open(DATA_CACHE_NAME)
				.then(cache => {
					console.log(cache);
					return fetch(event.request)
						.then(response => {
							if (response.status === 200) {
								cache.put(event.request.url, response.clone());
							}
							return response;
						})
						.catch(err => {
							console.log(err);
							// Network failed, attempt to serve data from cache
							return cache.match(event.request);
						});
				})
				.catch(error => console.log(error))
		);
	} else {
		event.respondWith(
			fetch(event.request).catch(error => {
				console.log(error);
				return caches.match(event.request).then(response => {
					if (response) {
						return response;
					} else if (
						event.request.headers.get("accept").includes("text/html")
					) {
						// return cached page
						return caches.match(event.request.url);
					}
				});
			})
		);
	}
});

// Cache resources
self.addEventListener("install", function (e) {
	e.waitUntil(
		caches
			.open(CACHE_NAME)
			.then(function (cache) {
				console.log("installing cache : " + CACHE_NAME);
				return cache.addAll(FILES_TO_CACHE);
			})
			.then(() => self.skipWaiting())
			.catch(err => {
				console.log("error caching files", error);
			})
	);
});

// Delete outdated caches
self.addEventListener("activate", function (e) {
	e.waitUntil(
		caches.keys().then(function (keyList) {
			// `keyList` contains all cache names under your username.github.io
			// filter out ones that has this app prefix to create keeplist
			let cacheKeeplist = keyList.filter(function (key) {
				return key.indexOf(APP_PREFIX);
			});
			// add current cache name to keeplist
			cacheKeeplist.push(CACHE_NAME);

			return Promise.all(
				keyList.map(function (key, i) {
					if (cacheKeeplist.indexOf(key) === -1) {
						console.log("deleting cache : " + keyList[i]);
						return caches.delete(keyList[i]);
					}
				})
			);
		})
	);
});
