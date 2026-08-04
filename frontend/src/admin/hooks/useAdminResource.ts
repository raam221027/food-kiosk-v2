import { useQuery } from '@tanstack/react-query'

/**
 * Unwraps a Laravel response. API Resources wrap collections in `{ data: [] }`,
 * plain `->get()` returns the array bare, and paginators nest it the same way.
 */
const unwrap = <T>(payload: unknown): T | null => {
  if (payload === null || payload === undefined) return null
  if (Array.isArray(payload)) return payload as T
  if (typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data: unknown }).data
    return inner === undefined || inner === null ? null : (inner as T)
  }
  return payload as T
}

interface AdminResource<T> {
  /** Live data when the endpoint answered, otherwise the supplied fallback. */
  data: T
  /** True while the fallback is standing in for a missing/failing endpoint. */
  isFallback: boolean
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Fetches one admin resource, falling back to placeholder data.
 *
 * Most of the kiosk endpoints are not implemented yet (`backend/routes/api.php`
 * only exposes `/user`), so a failed request is expected rather than
 * exceptional: the view still renders, flagged by `isFallback` so the banner
 * makes clear the numbers are not real. Deleting the `fallback` argument once
 * the API is live is all that is needed to make a view strictly data-driven.
 */
export function useAdminResource<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<unknown>,
  fallback: T,
): AdminResource<T> {
  const query = useQuery({
    queryKey,
    queryFn,
    // The endpoints 404 until the backend catches up; retrying just delays the
    // fallback render by several seconds.
    retry: false,
  })

  const resolved = query.isSuccess ? unwrap<T>(query.data) : null

  return {
    data: resolved ?? fallback,
    isFallback: resolved === null,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: () => void query.refetch(),
  }
}
