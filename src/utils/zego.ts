import crypto from 'crypto';
import { env } from '../config/env';

import { generateToken04 } from 'zego-server-assistant';

/**
 * Generate a ZEGOCLOUD Token (Secure version using zego-server-assistant)
 */
export function generateZegoToken(userId: string, roomId: string): string {
  const appId = parseInt(env.ZEGO_APP_ID, 10);
  const serverSecret = env.ZEGO_SERVER_SECRET;
  
  // Token validity: 1 hour (3600 seconds)
  const effectiveTimeInSeconds = 3600;
  
  // Empty payload is fine for basic WebRTC login
  const payload = '';

  const token = generateToken04(appId, userId, serverSecret, effectiveTimeInSeconds, payload);
  return token;
}

export const zegoConfig = {
  appId: env.ZEGO_APP_ID,
  appSign: env.ZEGO_APP_SIGN,
  wssUrl: env.ZEGO_WSS_URL
};
