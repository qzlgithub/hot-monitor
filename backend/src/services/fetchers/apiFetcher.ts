import axios, { type AxiosRequestConfig } from 'axios'
import type { ApiFetcher, FetchOptions } from './types.js'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * ApiFetcher：HTTP API（JSON）请求封装
 * - 统一 headers / timeout / 重试（指数退避）
 * - 用于 B 站等 HTTP JSON 接口的数据源
 */
class ApiFetcherImpl implements ApiFetcher {
  private defaultTimeout = 15000
  private defaultRetries = 1

  async get<T>(url: string, params?: Record<string, any>, opts?: FetchOptions): Promise<T> {
    return this.request<T>({ method: 'GET', url, params }, opts)
  }

  async post<T>(url: string, data?: any, opts?: FetchOptions): Promise<T> {
    return this.request<T>({ method: 'POST', url, data }, opts)
  }

  private async request<T>(cfg: AxiosRequestConfig, opts?: FetchOptions): Promise<T> {
    const retries = opts?.retries ?? this.defaultRetries
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await axios.request<T>({
          ...cfg,
          headers: opts?.headers,
          timeout: opts?.timeout ?? this.defaultTimeout,
        })
        return res.data
      } catch (error) {
        if (i >= retries) throw error
        await sleep(300 * (i + 1))
      }
    }
    throw new Error('unreachable')
  }
}

export const apiFetcher: ApiFetcher = new ApiFetcherImpl()
export default apiFetcher
