// src/hooks/useApi.js — Ajouter debounce + cache local

import { useState, useEffect, useRef, useCallback } from 'react'

export function useApi(apiFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const cache     = useRef({})
  const cacheKey  = JSON.stringify(deps)

  const load = useCallback(async (force = false) => {
    // Utiliser cache si disponible et pas forcé
    if (!force && cache.current[cacheKey]) {
      setData(cache.current[cacheKey])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res  = await apiFn()
      const data = res.data?.data || res.data
      cache.current[cacheKey] = data
      setData(data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [apiFn, cacheKey])

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: () => load(true) }
}