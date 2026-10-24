import { onBeforeUnmount, ref } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { mapQrScannerError, QR_ERRORS } from '@/utils/qrScannerErrors'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const URL_UNIT_REGEX = /^.*\/units\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
const READER_ELEMENT_ID = 'qr-scanner-reader'

function extractUnitId(value) {
  const trimmed = String(value ?? '').trim()

  if (UUID_REGEX.test(trimmed)) {
    return trimmed
  }

  const urlMatch = trimmed.match(URL_UNIT_REGEX)
  if (urlMatch) {
    return urlMatch[1]
  }

  return null
}

let scanner = null
let isHandling = false

export function useQrScanner() {
  const isScanning = ref(false)
  const scanError = ref(null)
  const cameras = ref([])
  const selectedCameraId = ref(null)

  async function loadCameras() {
    try {
      const devices = await Html5Qrcode.getCameras()
      cameras.value = devices ?? []

      if (devices?.length && !selectedCameraId.value) {
        const back = devices.find((d) => /back|rear|environment/i.test(d.label))
        selectedCameraId.value = (back ?? devices[devices.length - 1]).id
      }

      return cameras.value
    } catch (error) {
      console.error('Error al listar cámaras:', error)
      cameras.value = []

      return []
    }
  }

  async function waitForReaderElement(retries = 10, delayMs = 100) {
    for (let i = 0; i < retries; i++) {
      if (document.getElementById(READER_ELEMENT_ID)) {
        return true
      }

      await new Promise((r) => setTimeout(r, delayMs))
    }

    return !!document.getElementById(READER_ELEMENT_ID)
  }

  async function startScan(onDetected) {
    scanError.value = null
    isHandling = false

    if (isScanning.value) return true

    try {
      const ready = await waitForReaderElement()

      if (!ready) {
        scanError.value = 'No se encontró el contenedor del escáner'
        return false
      }

      await stopScan()

      document.getElementById(READER_ELEMENT_ID).innerHTML = ''
      scanner = new Html5Qrcode(READER_ELEMENT_ID)

      await loadCameras()

      const cameraConfig = selectedCameraId.value
        ? { deviceId: { exact: selectedCameraId.value } }
        : { facingMode: 'environment' }

      await scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
            const qrboxSize = Math.floor(minEdge * 0.7)

            return { width: qrboxSize, height: qrboxSize }
          },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          if (isHandling) {
            return
          }

          const value = String(decodedText ?? '').trim()

          if (!value) {
            return
          }

          const unitId = extractUnitId(value)

          if (!unitId) {
            console.warn('[QR Scanner] Código escaneado no es una unidad válida:', value)
            scanError.value = QR_ERRORS.INVALID_QR
            return
          }

          isHandling = true
          onDetected?.(unitId)
        },
        () => {
          // Per-frame decode failures are expected noise
        },
      )

      isScanning.value = true
      return true
    } catch (error) {
      console.error('Error al iniciar escáner QR:', error)
      scanError.value = mapQrScannerError(error)

      await stopScan()

      return false
    }
  }

  async function stopScan() {
    isHandling = false

    try {
      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop()
          }
        } catch {
          // stop() throws when camera already released
        }
        try {
          await scanner.clear()
        } catch {
          // clear() may fail if element was unmounted
        }
      }
    } catch (error) {
      console.warn('Error al detener escáner QR:', error)
    } finally {
      scanner = null
      isScanning.value = false
    }
  }

  async function switchCamera(cameraId) {
    selectedCameraId.value = cameraId
  }

  function validateManualInput(value) {
    const trimmed = String(value ?? '').trim()

    const unitId = extractUnitId(trimmed)

    if (!unitId) {
      console.warn('[QR Scanner] ID ingresado no es válido:', trimmed)
      return { ok: false, error: QR_ERRORS.INVALID_MANUAL_ID }
    }

    return { ok: true, value: unitId }
  }

  onBeforeUnmount(() => {
    stopScan()
  })

  return {
    READER_ELEMENT_ID,
    isScanning,
    scanError,
    cameras,
    selectedCameraId,
    loadCameras,
    startScan,
    stopScan,
    switchCamera,
    validateManualInput,
  }
}
