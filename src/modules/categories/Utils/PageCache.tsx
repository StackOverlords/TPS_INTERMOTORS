// // eslint-disable-next-line @typescript-eslint/no-explicit-any


// const CACHE_KEY = "intermotors-category-cache";
// const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutos

// type PageCacheEntry = {
//   key: string; // ej: search=abc&page=2&perPage=10
//   data: any;
//   timestamp: number;
// };

// const getCache = (): PageCacheEntry[] => {
//   try {
//     const raw = localStorage.getItem(CACHE_KEY);
//     return raw ? JSON.parse(raw) : [];
//   } catch {
//     return [];
//   }
// };

// const saveCache = (entries: PageCacheEntry[]) => {
//   localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
// };

// export const getCachedPage = (key: string) => {
//   const cache = getCache();
//   const entry = cache.find((e) => e.key === key);
//   if (!entry) return null;

//   const expired = Date.now() - entry.timestamp > EXPIRATION_TIME;
//   return expired ? null : entry.data;
// };

// export const setCachedPage = (key: string, data: any) => {
//   const cache = getCache().filter(
//     (e) => Date.now() - e.timestamp < EXPIRATION_TIME
//   ); // elimina expirados

//   cache.push({ key, data, timestamp: Date.now() });

//   // límite de 50 entradas para no saturar localStorage
//   const trimmed = cache.slice(-50);
//   saveCache(trimmed);
// };
