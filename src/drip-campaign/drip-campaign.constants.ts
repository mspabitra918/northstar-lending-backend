// Name of the BullMQ queue that powers the 5-day post-submission drip.
export const DRIP_CAMPAIGN_QUEUE = 'drip-campaign';

// Single recurring job type: "send the next daily reminder".
export const DRIP_REMINDER_JOB = 'daily-reminder';

// The campaign fires once every 24 hours, for exactly 5 days.
export const DRIP_TOTAL_DAYS = 5;
export const DRIP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// export const DRIP_TOTAL_DAYS = 5;
// export const DRIP_INTERVAL_MS = 30 * 1000; // 30 seconds

export interface DripJobData {
  applicationId: string;
  // 1-based day index of the drip (1..DRIP_TOTAL_DAYS).
  day: number;
}

// Deterministic job id so a campaign can be located/removed and never
// duplicated for the same application + day.
export const dripJobId = (applicationId: string, day: number) =>
  `drip:${applicationId}:day-${day}`;
