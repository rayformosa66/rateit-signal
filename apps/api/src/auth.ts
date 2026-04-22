import jwt from 'jsonwebtoken';
import http from 'http';

const _rawSecret = process.env.JWT_SECRET;

if (!_rawSecret && process.env.NODE_ENV === 'production') {
  throw new Error(
    'JWT_SECRET environment variable must be set in production. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
  );
}

const JWT_SECRET = _rawSecret ?? 'rateit-dev-secret-change-in-prod';
const JWT_EXPIRES_IN = '8h';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function getAuthUser(req: http.IncomingMessage): TokenPayload | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
