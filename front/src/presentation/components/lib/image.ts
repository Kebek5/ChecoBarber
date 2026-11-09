// Ajusta el ancho de una URL de Cloudinary. Si la imagen no es de Cloudinary, la deja igual.
// …/upload/f_auto,q_auto,w_1000,c_limit/…  →  …/upload/f_auto,q_auto,w_520,c_limit/…
export function resizeImage(url: string, width: number): string {
   if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url

   if (/\/upload\/[^/]*w_\d+/.test(url)) {
      return url.replace(/(\/upload\/[^/]*)w_\d+/, `$1w_${width}`)
   }
   return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`)
}