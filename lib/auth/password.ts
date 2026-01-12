import bcrypt from 'bcryptjs';

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 72, // bcrypt limit
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
} as const;

/**
 * Password validation result
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  if (password && password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be no more than ${PASSWORD_REQUIREMENTS.maxLength} characters long`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hash password using bcrypt with 12 rounds
 */
export async function hashPassword(password: string): Promise<string> {
  const validation = validatePasswordStrength(password);

  if (!validation.isValid) {
    throw new Error(`Invalid password: ${validation.errors.join(', ')}`);
  }

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);

  return hash;
}

/**
 * Verify password against hash using constant-time comparison
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

/**
 * Get password strength score (0-4)
 * 0 = Very weak, 1 = Weak, 2 = Fair, 3 = Good, 4 = Strong
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (!password) {
    return { score: 0, label: 'Very weak', color: 'red' };
  }

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Complexity checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++; // Special characters

  // Cap at 4
  score = Math.min(score, 4);

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['red', 'orange', 'yellow', 'blue', 'green'];

  return {
    score,
    label: labels[score],
    color: colors[score],
  };
}
