import { isAxiosError } from 'axios'

/** Laravel's validation error body: `{ message, errors: { field: [msg, ...] } }`. */
interface LaravelError {
  message?: string
  errors?: Record<string, string[]>
}

const body = (error: unknown): LaravelError | undefined =>
  isAxiosError<LaravelError>(error) ? error.response?.data : undefined

/** The best human-readable message for a failed request. */
export const apiErrorMessage = (error: unknown, fallback = 'Something went wrong. Try again.') =>
  body(error)?.message ?? (error instanceof Error ? error.message : fallback)

/**
 * First message per field from a 422 response, keyed like Laravel sends them
 * ('name', 'variants.0.price'). Empty for any other kind of failure.
 */
export const fieldErrors = (error: unknown): Record<string, string> =>
  Object.fromEntries(
    Object.entries(body(error)?.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
  )

/** Every message whose field starts with `prefix`, e.g. all 'variants.*' errors. */
export const errorsUnder = (errors: Record<string, string>, prefix: string): string[] =>
  Object.entries(errors)
    .filter(([field]) => field === prefix || field.startsWith(`${prefix}.`))
    .map(([, message]) => message)
