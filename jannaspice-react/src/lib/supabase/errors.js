export function getErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;
  const raw = error.message || String(error);
  const cleaned = raw.replace(/^.*ERROR:\s*/i, '').replace(/\s+CONTEXT:[\s\S]*$/, '').trim() || fallback;
  if (/date is no longer available|fully booked or unavailable/i.test(cleaned)) {
    return 'This date is fully booked. JannaSpice only takes 2 events per day so every celebration gets our full attention. Please pick another day.';
  }
  return cleaned;
}

export function isCapacityMessage(message = '') {
  return /fully booked|only takes 2 events|spots left|set aside and not open/i.test(String(message));
}
