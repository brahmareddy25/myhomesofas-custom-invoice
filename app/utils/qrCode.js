import QRCode from 'qrcode';

/**
 * Generates a base64 QR Code image URL for UPI payments.
 * @param {string} upiId - The UPI ID (VPA)
 * @param {number|string} amount - The transaction amount
 * @param {string} name - The payee name
 * @returns {Promise<string>} Base64 Data URL
 */
export async function generateUPIQRCode(upiId, amount, name = "MY HOME SOFAS") {
  try {
    // standard UPI deep link: upi://pay?pa=address&pn=name&am=amount&cu=INR
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    return await QRCode.toDataURL(upiUrl, {
      margin: 1,
      width: 120,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating UPI QR code', err);
    return '';
  }
}
