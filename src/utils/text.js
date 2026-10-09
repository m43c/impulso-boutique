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

  return value.replace(/(^|[^\p{L}\p{N}'])(\p{L})/gu, (char) => char.toUpperCase())
}
