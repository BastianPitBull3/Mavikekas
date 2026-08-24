/**
 * birthdayArt.js
 * Resuelve la imagen de felicitación de cumpleaños a partir de lo que haya
 * en src/assets/birthday/, sin importar el nombre del archivo.
 *
 * Usa import.meta.glob, que Vite resuelve en build time: para cambiar la
 * imagen basta con reemplazar (o agregar) el archivo en esa carpeta y
 * volver a compilar/desplegar — no requiere tocar código. Si hay varios
 * archivos, se usa el primero por orden alfabético; si la carpeta está
 * vacía, BIRTHDAY_ART_SRC queda en null y los componentes caen a su
 * placeholder de emoji.
 */
const images = import.meta.glob(
  '../assets/birthday/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP,GIF}',
  { eager: true, import: 'default' }
);

const paths = Object.keys(images).sort();

export const BIRTHDAY_ART_SRC = paths.length > 0 ? images[paths[0]] : null;
