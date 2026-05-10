import { useState, useMemo } from 'react'

export function usePaginationFilter(data, perPage = 10, customFilter = null) {
  const [search,      setSearch]      = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Solution 1: Déplacer safeData à l'intérieur du useMemo
  const filtered = useMemo(() => {
    // ← Sécuriser à l'intérieur du useMemo
    const safeData = Array.isArray(data) ? data : []
    let result = safeData

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val ?? '').toLowerCase().includes(q)
        )
      )
    }

    if (customFilter) {
      result = result.filter(customFilter)
    }

    return result
  }, [data, search, customFilter])  // data directement comme dépendance

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage   = Math.min(currentPage, totalPages)
  const paginated  = filtered.slice(
    (safePage - 1) * perPage,
    safePage * perPage
  )

  const handleSearch = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  return {
    paginated,
    filtered,
    totalPages,
    currentPage: safePage,
    search,
    setCurrentPage,
    handleSearch,
  }
}