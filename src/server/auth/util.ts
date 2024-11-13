import bcrypt from 'bcrypt';

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string | null
): Promise<boolean> => {
  if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
    return false;  // Return `false` if inputs are not valid strings
  }

  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;  // Ensure a `boolean` is always returned
  }
};
