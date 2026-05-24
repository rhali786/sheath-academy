/** Debug-only latency tracing for session ffc04b. Remove after investigation. */
export function latencyTrace(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = 'baseline',
): void {
  // #region agent log
  fetch('http://127.0.0.1:7867/ingest/ba82b305-ec67-4264-aab8-83a8635a4484', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'ffc04b',
    },
    body: JSON.stringify({
      sessionId: 'ffc04b',
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}
