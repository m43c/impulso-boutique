export function normalizeText(value) {
  if (!value) {
    return ''
  }

  return value
    .toString()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function toTitleCase(value) {
  if (!value) {
    return ''
  }

  return value.replace(/\b\p{L}/gu, (char) => char.toUpperCase())
}
