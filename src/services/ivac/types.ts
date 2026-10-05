export interface IvacAccount {
  phone: string;
  password?: string;
  otp?: string;
}

export interface IvacAvailableDate {
  dayNumber: number;
  monthTitle: string;
  year: number;
  month: number;
  isoDate: string;
  monthOffset: 0 | 1;
  timestamp: number;
  rawText: string;
}

export interface IvacBookingConfig {
  account: IvacAccount;
  pdfPath: string;
  missionName?: string; // Optional: Mission is locked/auto-detected by Webfile jurisdiction
  missionId?: string;
  centerName?: string;  // Optional: Auto-selects the first available center if omitted
  centerId?: string;
  targetDates?: string[]; // Specific dates to snipe or empty to snipe all available
  preferredDate?: string; // e.g. "2026-10-28", "28", "10-28" to prioritize first
  dateOrder?: 'latest' | 'earliest'; // Priority: 'latest' (newest first, default) or 'earliest' (oldest first)
  avoidDates?: string[]; // Dates to avoid (e.g. ["2026-10-15", "12"])
  skipOtpIfSessionValid?: boolean;
}

export interface Step1Result {
  success: boolean;
  alreadyAuthenticated?: boolean;
  requestId?: string;
  currentUrl: string;
  error?: string;
}

export interface Step2Result {
  success: boolean;
  token?: string;
  sessionSavedPath?: string;
  currentUrl: string;
  error?: string;
}

export interface Step3Result {
  success: boolean;
  currentUrl: string;
  error?: string;
}

export interface Step4Result {
  success: boolean;
  currentUrl: string;
  error?: string;
}

export interface Step5Result {
  success: boolean;
  webfileNumber?: string;
  applicantName?: string;
  passportNumber?: string;
  visaType?: string;
  currentUrl: string;
  error?: string;
}

export interface Step6Result {
  success: boolean;
  mission: string;
  center: string;
  currentUrl: string;
  error?: string;
}

export interface Step7Result {
  success: boolean;
  slotBooked: boolean;
  bookedDate?: string;
  reservationId?: string;
  reserveTtlSeconds?: number;
  availableDatesFound?: string[];
  attemptsCount: number;
  currentUrl: string;
  error?: string;
}

export interface Step8Result {
  success: boolean;
  appointmentId?: string;
  checkoutUrl?: string;
  currentUrl: string;
  error?: string;
}

export interface Step9Result {
  success: boolean;
  checkoutUrl: string;
  savedToPath: string;
  idleCompleted: boolean;
  error?: string;
}

export interface IvacRunnerResult {
  success: boolean;
  stepReached: number;
  reservationId?: string;
  bookedDate?: string;
  checkoutUrl?: string;
  error?: string;
}
