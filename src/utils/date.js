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

export const LA_PAZ_TZ = 'America/La_Paz'

export function formatDateTime(isoString, options = {}) {
  return new Date(isoString).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

export function formatDateTimeLaPaz(isoString) {
  return formatDateTime(isoString, { timeZone: LA_PAZ_TZ })
}

const laPazDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: LA_PAZ_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const laPazOffsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: LA_PAZ_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function getLaPazOffsetMs(date) {
  const parts = laPazOffsetFormatter.formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  )

  return asUtc - date.getTime()
}

export function laPazDayBounds(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input)
  const parts = laPazDateFormatter.formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  const year = Number(values.year)
  const month = Number(values.month)
  const day = Number(values.day)

  function resolveMidnight(dayOffset) {
    const guess = Date.UTC(year, month - 1, day + dayOffset)
    const firstOffset = getLaPazOffsetMs(new Date(guess))
    const candidate = guess - firstOffset
    const secondOffset = getLaPazOffsetMs(new Date(candidate))

    return new Date(guess - secondOffset)
  }

  return {
    from: resolveMidnight(0),
    to: resolveMidnight(1),
  }
}

const relativeFormatter = new Intl.RelativeTimeFormat('es-BO', { numeric: 'auto' })

export function formatRelativeDate(isoString, maxDaysForRelative = 7) {
  const date = new Date(isoString)
  const now = new Date()
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000)
  const diffInDays = Math.abs(Math.floor(diffInSeconds / 86400))

  if (diffInDays > maxDaysForRelative) {
    return formatDate(isoString)
  }

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
