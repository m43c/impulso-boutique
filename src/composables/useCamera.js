import { onBeforeUnmount, ref } from 'vue'

export function useCamera() {
  let stream = null

  const isActive = ref(false)
  const cameraError = ref(null)

  async function start(videoEl) {
    cameraError.value = null

    if (!videoEl) {
      cameraError.value = 'No se encontró el elemento de video'
      return false
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
        audio: false,
      })

      videoEl.srcObject = stream

      await videoEl.play()

      isActive.value = true

      return true
    } catch (error) {
      console.error('Error al acceder a la cámara:', error)
      cameraError.value = 'No se pudo acceder a la cámara. Verifica los permisos'

      stop()
      return false
    }
  }

  function stop(videoEl = null) {
    stream?.getTracks().forEach((track) => track.stop())

    stream = null

    if (videoEl) {
      videoEl.srcObject = null
    }

    isActive.value = false
  }

  function capture(videoEl, fileName = 'photo.jpg') {
    if (!videoEl?.videoWidth || !videoEl?.videoHeight) {
      return Promise.resolve(null)
    }

    const canvas = document.createElement('canvas')

    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight

    const context = canvas.getContext('2d')

    context.drawImage(videoEl, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null)
            return
          }

          const file = new File([blob], fileName, { type: 'image/jpeg' })

          resolve(file)
        },
        'image/jpeg',
        0.9,
      )
    })
  }

  onBeforeUnmount(() => {
    stop()
  })

  return {
    isActive,
    cameraError,
    start,
    stop,
    capture,
  }
}
