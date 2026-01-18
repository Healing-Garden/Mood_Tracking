export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 8) return 'weak';
  if (password.length < 12) return 'medium';
  return 'strong';
};

export const validateAge = (age: number): boolean => {
  return age >= 13 && age <= 120;
};

export const validateHeight = (height: number): boolean => {
  return height > 50 && height < 300;
};

export const validateWeight = (weight: number): boolean => {
  return weight > 20 && weight < 500;
};
