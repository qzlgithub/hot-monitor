import { useEffect, useCallback, useState } from 'react'

export function useApi<T>(
  url: string,
  options?: RequestInit
) {
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }
      return await response.json() as T
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }, [url, options])

  return { fetchData }
}

export function useApiWithRefresh<T>(
  url: string,
  initialData: T,
  refreshInterval: number = 30000
) {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = React.useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(url)
      if (response.ok) {
        setData(await response.json())
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, refreshInterval)
    return () => clearInterval(interval)
  }, [refresh, refreshInterval])

  return { data, loading, refresh }
}
