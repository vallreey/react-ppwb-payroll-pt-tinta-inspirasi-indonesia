import { useCallback, useEffect, useRef, useState } from 'react'
import { toFriendlyError } from '../services/apiClient'

export const useFetch = (fetcher, deps = []) => {
  const depsKey = JSON.stringify(deps)
  const [state, setState] = useState({ key: depsKey, data: null, loading: true, error: null })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback(async (key, signal) => {
    setState((prev) => ({ key, data: prev.key === key ? prev.data : null, loading: true, error: null }))
    try {
      const data = await fetcherRef.current(signal)
      if (!signal?.aborted) setState({ key, data, loading: false, error: null })
    } catch (error) {
      if (!signal?.aborted) setState((prev) => ({ key, data: prev.key === key ? prev.data : null, loading: false, error: toFriendlyError(error) }))
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    run(depsKey, controller.signal)
    return () => controller.abort()
  }, [depsKey, run])

  const reload = useCallback(() => run(depsKey), [run, depsKey])
  const current = state.key === depsKey ? state : { data: null, loading: true, error: null }
  return { data: current.data, loading: current.loading, error: current.error, reload }
}
