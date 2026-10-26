import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from 'astro:env/server'
import { InvalidInputError } from '@/application/errors'

cloudinary.config({
   cloud_name: CLOUDINARY_CLOUD_NAME,
   api_key: CLOUDINARY_API_KEY,
   api_secret: CLOUDINARY_API_SECRET,
   secure: true,
})

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']


// Sube a Cloudinary la imagen del campo "imageFile" del formulario.
// Devuelve la URL, o null si no se eligió archivo (se conserva la imagen actual).

export async function uploadProductImage(form: FormData): Promise<string | null> {
   const file = form.get('imageFile')
   if (!(file instanceof File) || file.size === 0) return null

   if (!ALLOWED_TYPES.includes(file.type)) {
      throw new InvalidInputError('La imagen debe ser JPG, PNG, WebP o AVIF.')
   }
   if (file.size > MAX_BYTES) {
      throw new InvalidInputError('La imagen no debe pesar más de 5 MB.')
   }

   const buffer = Buffer.from(await file.arrayBuffer())

   try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
         cloudinary.uploader
            .upload_stream({ folder: 'checobarber/productos', resource_type: 'image' }, (err, res) =>
               err || !res ? reject(err ?? new Error('Cloudinary no respondió.')) : resolve(res)
            )
            .end(buffer)
      })

      // f_auto/q_auto: formato y calidad óptimos; w_1000,c_limit: máximo 1000 px de ancho
      return result.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1000,c_limit/')
   } catch (err) {
      console.error('[cloudinary]', err)
      throw new InvalidInputError('No se pudo subir la imagen. Intenta de nuevo.')
   }
}