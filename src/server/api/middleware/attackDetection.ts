import { redis } from "@/server/api/cache/cache";

const ATTACK_DETECTION_KEY = "attack:detection";
const ATTACK_THRESHOLD = 100; // Number of rate limit violations in window
const ATTACK_WINDOW_MS = 60 * 1000; // 1 minute window
const ATTACK_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown
const ATTACK_STATUS_KEY = "attack:status";

export interface AttackStatus {
  isUnderAttack: boolean;
  detectedAt: number;
  violationCount: number;
  cooldownUntil?: number;
}

/**
 * Record a rate limit violation for attack detection
 */
export async function recordRateLimitViolation(identifier: string): Promise<void> {
  try {
    const client = await redis();
    const now = Date.now();
    const windowStart = now - ATTACK_WINDOW_MS;
    const key = `${ATTACK_DETECTION_KEY}:${identifier}`;

    // Add violation to sorted set
    await client.zAdd(key, [
      {
        score: now,
        value: now.toString(),
      },
    ]);

    // Remove old violations outside the window
    await client.zRemRangeByScore(key, 0, windowStart);

    // Count violations in the window
    const violationCount = await client.zCard(key);

    // Set expiration
    await client.expire(key, Math.ceil((ATTACK_WINDOW_MS + 60000) / 1000));

    // Check if we've exceeded the threshold
    if (violationCount >= ATTACK_THRESHOLD) {
      await enableAttackMode(identifier, violationCount);
    }
  } catch (error) {
    // Silently fail - don't break the app if attack detection fails
    console.error("Attack detection error:", error);
  }
}

/**
 * Enable attack mode (app unavailable)
 */
async function enableAttackMode(identifier: string, violationCount: number): Promise<void> {
  try {
    const client = await redis();
    const now = Date.now();
    const cooldownUntil = now + ATTACK_COOLDOWN_MS;

    const status: AttackStatus = {
      isUnderAttack: true,
      detectedAt: now,
      violationCount,
      cooldownUntil,
    };

    // Store attack status with cooldown expiration
    await client.setEx(
      ATTACK_STATUS_KEY,
      Math.ceil(ATTACK_COOLDOWN_MS / 1000),
      JSON.stringify(status)
    );

    console.warn(
      `🚨 ATTACK DETECTED: ${identifier} triggered ${violationCount} rate limit violations. ` +
      `Enabling attack mode for ${ATTACK_COOLDOWN_MS / 1000 / 60} minutes.`
    );
  } catch (error) {
    console.error("Failed to enable attack mode:", error);
  }
}

/**
 * Check if the app is currently under attack
 */
export async function isUnderAttack(): Promise<boolean> {
  try {
    const client = await redis();
    const statusJson = await client.get(ATTACK_STATUS_KEY);

    if (!statusJson) {
      return false;
    }

    const status: AttackStatus = JSON.parse(statusJson);

    // Check if cooldown has passed
    if (status.cooldownUntil && Date.now() > status.cooldownUntil) {
      // Cooldown expired, clear the status
      await client.del(ATTACK_STATUS_KEY);
      return false;
    }

    return status.isUnderAttack;
  } catch (error) {
    // If we can't check, assume not under attack (fail open)
    console.error("Failed to check attack status:", error);
    return false;
  }
}

/**
 * Get current attack status
 */
export async function getAttackStatus(): Promise<AttackStatus | null> {
  try {
    const client = await redis();
    const statusJson = await client.get(ATTACK_STATUS_KEY);

    if (!statusJson) {
      return null;
    }

    const status: AttackStatus = JSON.parse(statusJson);

    // Check if cooldown has passed
    if (status.cooldownUntil && Date.now() > status.cooldownUntil) {
      await client.del(ATTACK_STATUS_KEY);
      return null;
    }

    return status;
  } catch (error) {
    console.error("Failed to get attack status:", error);
    return null;
  }
}

/**
 * Manually disable attack mode (for admin use)
 */
export async function disableAttackMode(): Promise<void> {
  try {
    const client = await redis();
    await client.del(ATTACK_STATUS_KEY);
    console.log("✅ Attack mode manually disabled");
  } catch (error) {
    console.error("Failed to disable attack mode:", error);
    throw error;
  }
}

