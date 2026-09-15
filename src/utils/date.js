const RELATIVE_UNITS = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
]

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const relativeFormatter = new Intl.RelativeTimeFormat('es-BO', { numeric: 'auto' })

export function formatRelativeDate(isoString) {
  const diffInSeconds = (new Date(isoString).getTime() - Date.now()) / 1000

  if (Math.abs(diffInSeconds) < 60) {
    return 'justo ahora'
  }

  for (const { unit, seconds } of RELATIVE_UNITS) {
    if (Math.abs(diffInSeconds) >= seconds) {
      return relativeFormatter.format(Math.round(diffInSeconds / seconds), unit)
    }
  }

  return relativeFormatter.format(Math.round(diffInSeconds / 60), 'minute')
}
