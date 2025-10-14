let webcontainerInstance: any = null
let bootPromise: Promise<any> | null = null

export async function getWebContainerInstance() {
  if (webcontainerInstance) {
    return webcontainerInstance
  }

  if (bootPromise) {
    return bootPromise
  }

  bootPromise = (async () => {
    const { WebContainer } = await import("@webcontainer/api")
    webcontainerInstance = await WebContainer.boot()
    return webcontainerInstance
  })()

  return bootPromise
}
