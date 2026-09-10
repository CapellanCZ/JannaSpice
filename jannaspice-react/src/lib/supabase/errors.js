export function getErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;
  const raw = error.message || String(error);
  return raw.replace(/^.*ERROR:\s*/i, '').replace(/\s+CONTEXT:[\s\S]*$/, '').trim() || fallback;
}
