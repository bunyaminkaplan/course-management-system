export async function getDocumentAsync(options: any) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options?.type || '*/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        resolve({
          canceled: false,
          assets: [{ name: file.name, uri: URL.createObjectURL(file), size: file.size, mimeType: file.type }]
        });
      } else {
        resolve({ canceled: true });
      }
    };
    input.click();
  });
}
