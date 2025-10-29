// Validate email format
export const isValidEmail = email => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Validate phone number (only digits, 10-15 characters)
export const isValidPhone = phone => {
  return /^[0-9]{10,15}$/.test(phone);
};

// Validate password length (minimum 6 characters)
export const isValidPassword = password => {
  return password.length >= 6;
};

// Optional: Validate name (non-empty and letters only)
export const isValidName = name => {
  return /^[A-Za-z\s]{2,50}$/.test(name.trim());
};

// Optional: OTP validation (numeric, 4-6 digits)
export const isValidOtp = otp => {
  return /^[0-9]{4,6}$/.test(otp);
};

export const isValidProductName = name => {
  return name && name.trim().length >= 2 && name.trim().length <= 100;
};

export const isValidPrice = price => {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && num <= 999999;
};

export const isValidQuantity = quantity => {
  const num = parseInt(quantity);
  return !isNaN(num) && num >= 0 && num <= 999999;
};

export const isValidDescription = description => {
  return (
    description &&
    description.trim().length >= 10 &&
    description.trim().length <= 1000
  );
};