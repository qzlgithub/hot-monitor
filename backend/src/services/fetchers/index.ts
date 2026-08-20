// fetcher 层统一出口：按能力导出三类 fetcher
export { apiFetcher } from './apiFetcher.js'
export { htmlFetcher } from './htmlFetcher.js'
export { browserFetcher } from './browserFetcher.js'
export type {
  ApiFetcher,
  HtmlFetcher,
  BrowserFetcher,
  FetchOptions,
  BrowserScrapeOptions,
} from './types.js'
