/**
 * whatsapp.js
 * Envía notificaciones de WhatsApp vía CallMeBot (servicio gratuito de
 * terceros, no oficial de WhatsApp/Meta). Se dispara directo desde el
 * navegador de quien solicita la recuperación — no requiere backend.
 *
 * Cada admin que quiera recibir notificaciones debe:
 *  1. Agregar el contacto de CallMeBot (+34 644 51 95 23) a su WhatsApp.
 *  2. Enviarle el mensaje "I allow callmebot to send me messages".
 *  3. Guardar la clave que le respondan en su perfil (Mi Perfil).
 *
 * Se usa una petición de imagen en vez de fetch para no depender de que
 * CallMeBot habilite CORS — el navegador igual dispara el GET aunque la
 * respuesta no sea una imagen válida (solo falla el render, silenciosamente).
 */
export const sendWhatsAppNotification = (phone, apiKey, text) => {
  if (!phone || !apiKey) return;
  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;
  const img = new Image();
  img.src = url;
};
