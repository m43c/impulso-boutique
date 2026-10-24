export const QR_ERRORS = {
  INVALID_QR: 'El código escaneado no es una unidad válida',
  INVALID_MANUAL_ID: 'El ID ingresado no es un UUID válido de unidad',
  GENERIC_START: 'No se pudo iniciar la cámara. Intenta de nuevo',
}

export function mapQrScannerError(error) {
  const message = String(error?.message ?? error ?? '')
  const errorName = String(error?.name ?? '')

  if (
    /NotAllowedError|Permission denied|denied/i.test(message) ||
    errorName === 'NotAllowedError'
  ) {
    return 'Permiso de cámara denegado. Actívalo en el navegador para escanear'
  }

  if (/NotFoundError|DevicesNotFound|no camera/i.test(message) || errorName === 'NotFoundError') {
    return 'No se encontró ninguna cámara en este dispositivo.'
  }

  if (/NotReadableError|in use|busy/i.test(message) || errorName === 'NotReadableError') {
    return 'La cámara está en uso por otra aplicación. Ciérrala e intenta de nuevo'
  }

  if (/NotSupportedError|insecure|https/i.test(message)) {
    return 'El escaneo requiere HTTPS o localhost'
  }

  return QR_ERRORS.GENERIC_START
}
