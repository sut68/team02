// Password validation
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' };
  }
  
  return { valid: true };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input (ป้องกัน XSS)
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // ลบ HTML tags
    .trim();
}
