type AndroidDownloadBridge = {
  saveBase64: (fileName: string, mimeType: string, base64: string) => void;
};

declare global {
  interface Window {
    PadariaDownloads?: AndroidDownloadBridge;
  }
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo'));
    reader.readAsDataURL(blob);
  });
}

export async function downloadBlob(blob: Blob, fileName: string): Promise<void> {
  const bridge = window.PadariaDownloads;
  if (bridge) {
    const dataUrl = await readBlobAsDataUrl(blob);
    const separator = dataUrl.indexOf(',');
    if (separator < 0) throw new Error('Formato de arquivo inválido');
    bridge.saveBase64(fileName, blob.type || 'application/octet-stream', dataUrl.slice(separator + 1));
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
