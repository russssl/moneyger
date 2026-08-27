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
 * Enable attack mode (per-identifier, not global, to prevent single IP from DoS-ing all users)
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

    // Per-identifier block
    const perIpKey = `${ATTACK_STATUS_KEY}:${identifier}`;
    await client.setEx(
      perIpKey,
      Math.ceil(ATTACK_COOLDOWN_MS / 1000),
      JSON.stringify(status)
    );

    // Also set global key for monitoring/dashboard visibility, but not used for blocking
    await client.setEx(
      `${ATTACK_STATUS_KEY}:global:last`,
      Math.ceil(ATTACK_COOLDOWN_MS / 1000),
      JSON.stringify({ ...status, identifier })
    );

    console.warn(
      `🚨 ATTACK DETECTED: ${identifier} triggered ${violationCount} rate limit violations. ` +
      `Blocking ${identifier} for ${ATTACK_COOLDOWN_MS / 1000 / 60} minutes (per-IP, not global).`
    );
  } catch (error) {
    console.error("Failed to enable attack mode:", error);
  }
}

/**
 * Check if the app is currently under attack (per-identifier)
 * If identifier omitted, checks global fallback (for backward compat, always false unless global key exists)
 */
export async function isUnderAttack(identifier?: string): Promise<boolean> {
  try {
    const client = await redis();
    if (identifier) {
      const perIpKey = `${ATTACK_STATUS_KEY}:${identifier}`;
      const statusJson = await client.get(perIpKey);
      if (!statusJson) return false;
      const status: AttackStatus = JSON.parse(statusJson);
      if (status.cooldownUntil && Date.now() > status.cooldownUntil) {
        await client.del(perIpKey);
        return false;
      }
      return status.isUnderAttack;
    }
    // Fallback global check (legacy)
    const statusJson = await client.get(ATTACK_STATUS_KEY);
    if (!statusJson) return false;
    const status: AttackStatus = JSON.parse(statusJson);
    if (status.cooldownUntil && Date.now() > status.cooldownUntil) {
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

