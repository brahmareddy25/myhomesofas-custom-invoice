/**
 * Utility to convert numbers to Indian Rupee words format.
 * E.g., 135000 -> "One Lakh Thirty-five Thousand Rupees Only/-"
 */

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertGroup(n) {
  if (n === 0) return "";
  let str = "";
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + ones[n % 10] : "") + " ";
  } else if (n > 0) {
    str += ones[n] + " ";
  }
  return str;
}

export function numberToIndianWords(num) {
  num = parseFloat(num);
  if (isNaN(num) || num <= 0) return "Zero Rupees Only/-";

  // Split integer and decimal parts
  const parts = num.toFixed(2).split(".");
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let words = "";

  if (integerPart === 0) {
    words = "Zero Rupees";
  } else {
    let crores = Math.floor(integerPart / 10000000);
    let lakhs = Math.floor((integerPart % 10000000) / 100000);
    let thousands = Math.floor((integerPart % 100000) / 1000);
    let remaining = integerPart % 1000;

    if (crores > 0) {
      words += convertGroup(crores) + "Crore ";
    }
    if (lakhs > 0) {
      words += convertGroup(lakhs) + "Lakh ";
    }
    if (thousands > 0) {
      words += convertGroup(thousands) + "Thousand ";
    }
    if (remaining > 0) {
      words += convertGroup(remaining);
    }
    words = words.trim() + " Rupees";
  }

  if (decimalPart > 0) {
    words += " and " + convertGroup(decimalPart).trim() + " Paise";
  }

  return words + " Only/-";
}
