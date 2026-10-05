import fs from 'node:fs';
import path from 'node:path';
import { initStagehand } from '@/stagehand';
import { solveCaptcha, getCaptchaBuffer } from './captcha';
import { uploadLocalFileToStorage } from '@/lib/r2';
import { getApplicationById, updateApplication } from '@/lib/db';

export interface ReprintPdfOptions {
  applicationId?: string;
  webFileNumber: string;
  passportNumber: string;
  dateOfBirth: string; // DD/MM/YYYY or YYYY-MM-DD
  indianMission?: string; // Mission code like 'BGDD', 'BGDC', 'BGDK', 'BGDR', 'BGDS'
  forceFresh?: boolean;
}

export interface ReprintPdfResult {
  success: boolean;
  webFileNumber: string;
  pdfBuffer?: Buffer;
  pdfPath?: string;
  finalPdfUrl?: string;
  error?: string;
}

/**
 * Normalizes any date format to portal's required DD/MM/YYYY.
 */
export function normalizeDobToPortal(dobInput: string): string {
  const str = (dobInput || '').trim();
  if (!str) return '';

  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }

  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) {
    const [y, m, d] = str.split('/');
    return `${d}/${m}/${y}`;
  }

  // Try parsing Date object
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return str;
}

/**
 * Resolves mission code from profile option or Web File Number prefix.
 */
export function resolveMissionCode(missionInput?: string, webFileNumber?: string): string {
  const input = (missionInput || '').trim().toUpperCase();
  if (['BGDC', 'BGDD', 'BGDK', 'BGDR', 'BGDS'].includes(input)) {
    return input;
  }
  if (input.includes('CHITTAGONG') || input.includes('CTG')) return 'BGDC';
  if (input.includes('DHAKA')) return 'BGDD';
  if (input.includes('KHULNA')) return 'BGDK';
  if (input.includes('RAJSHAHI')) return 'BGDR';
  if (input.includes('SYLHET')) return 'BGDS';

  // Infer from Web File Number prefix (e.g. BGDDW3112C26 -> BGDD)
  if (webFileNumber && webFileNumber.length >= 4) {
    const prefix = webFileNumber.slice(0, 4).toUpperCase();
    if (['BGDC', 'BGDD', 'BGDK', 'BGDR', 'BGDS'].includes(prefix)) {
      return prefix;
    }
  }

  return 'BGDD'; // Default to Dhaka
}

/**
 * Finds an application PDF in downloads matching the Web File Number.
 */
function findPdfInDownloads(dir: string, webFileNo: string, minMtimeMs = 0): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const cleanPrefix = webFileNo.toUpperCase();

  // Sort files by mtime descending (newest first)
  const matchingFiles = files
    .filter((f) => {
      const upper = f.toUpperCase();
      return upper.startsWith(cleanPrefix) && upper.endsWith('.PDF') && !upper.endsWith('.CRDOWNLOAD');
    })
    .map((f) => {
      const fullPath = path.join(dir, f);
      try {
        const stat = fs.statSync(fullPath);
        return { path: fullPath, size: stat.size, mtimeMs: stat.mtimeMs };
      } catch {
        return null;
      }
    })
    .filter((item): item is { path: string; size: number; mtimeMs: number } => {
      return item !== null && item.size > 20000 && item.mtimeMs >= minMtimeMs;
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return matchingFiles.length > 0 ? matchingFiles[0].path : null;
}

/**
 * Automates reprint of registered official Indian Visa PDF application
 * from https://indianvisa-bangladesh.nic.in/visa/PrintApplication
 */
export async function reprintOfficialPdf(
  input: string | ReprintPdfOptions
): Promise<ReprintPdfResult> {
  let opts: ReprintPdfOptions;

  if (typeof input === 'string') {
    const app = getApplicationById(input);
    if (!app) {
      return {
        success: false,
        webFileNumber: '',
        error: `Application ${input} not found in database`,
      };
    }
    if (!app.web_file_number) {
      return {
        success: false,
        webFileNumber: '',
        error: `Application ${input} does not have a permanent Web File Number (Application ID) yet`,
      };
    }

    interface PartialRegistrationData {
      step1_registration?: {
        dateOfBirth?: string;
        indianMission?: string;
      };
      step2_applicant_details?: {
        passportNumber?: string;
      };
      dateOfBirth?: string;
      birthdate?: string;
      dob?: string;
      passportNumber?: string;
      passport_number?: string;
      indianMission?: string;
    }

    let formData: PartialRegistrationData = {};
    try {
      formData = JSON.parse(app.form_data_json || '{}') as PartialRegistrationData;
    } catch {}

    const dob =
      formData?.step1_registration?.dateOfBirth ||
      formData?.dateOfBirth ||
      formData?.birthdate ||
      formData?.dob ||
      '';

    const passport =
      app.passport_number ||
      formData?.step2_applicant_details?.passportNumber ||
      formData?.passportNumber ||
      formData?.passport_number ||
      '';

    const mission =
      formData?.step1_registration?.indianMission ||
      formData?.indianMission ||
      app.web_file_number.slice(0, 4);

    opts = {
      applicationId: app.id,
      webFileNumber: app.web_file_number,
      passportNumber: passport,
      dateOfBirth: dob,
      indianMission: mission,
    };
  } else {
    opts = input;
  }

  const cleanWebFileNo = (opts.webFileNumber || '').trim().toUpperCase();
  const cleanPassport = (opts.passportNumber || '').trim().toUpperCase();
  const formattedDob = normalizeDobToPortal(opts.dateOfBirth);
  const missionCode = resolveMissionCode(opts.indianMission, cleanWebFileNo);

  console.log(`\n📄 [Reprint PDF] Starting automated government portal reprint:`);
  console.log(`   Web File Number: ${cleanWebFileNo}`);
  console.log(`   Passport Number: ${cleanPassport}`);
  console.log(`   Date of Birth:   ${formattedDob}`);
  console.log(`   Mission Code:    ${missionCode}`);

  if (!cleanWebFileNo || !cleanPassport || !formattedDob) {
    return {
      success: false,
      webFileNumber: cleanWebFileNo,
      error: 'Missing required credentials: Web File Number, Passport Number, and Date of Birth are mandatory.',
    };
  }

  const downloadsDir = path.resolve(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // If not forcing a fresh reprint, check if file is already on local disk
  if (!opts.forceFresh) {
    const existingFile = findPdfInDownloads(downloadsDir, cleanWebFileNo);
    if (existingFile) {
      console.log(`📂 [Reprint] Found existing official PDF on local disk: ${existingFile}`);
      const pdfBuffer = fs.readFileSync(existingFile);

      // Upload to R2 if needed
      let finalPdfUrl: string | undefined;
      try {
        const storageKey = opts.applicationId
          ? `applications/${opts.applicationId}/${cleanWebFileNo}.pdf`
          : `reprints/${cleanWebFileNo}.pdf`;
        const uploadRes = await uploadLocalFileToStorage(existingFile, storageKey, 'application/pdf');
        finalPdfUrl = uploadRes.url;
      } catch {}

      if (opts.applicationId) {
        updateApplication(opts.applicationId, {
          pdf_path: existingFile,
          ...(finalPdfUrl ? { final_pdf_url: finalPdfUrl } : {}),
        });
      }

      return {
        success: true,
        webFileNumber: cleanWebFileNo,
        pdfBuffer,
        pdfPath: existingFile,
        finalPdfUrl,
      };
    }
  }

  let session: Awaited<ReturnType<typeof initStagehand>> | null = null;
  const startTime = Date.now() - 3000;

  try {
    session = await initStagehand();
    const { page } = session;

    // 1. Visit landing page to initialize cookies & session
    console.log(`🌐 [Reprint] Connecting to Indian Visa portal...`);
    await page.goto('https://indianvisa-bangladesh.nic.in/visa/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 2. Navigate to Print Registered Application page
    console.log(`🌐 [Reprint] Navigating to Print Registered Application page...`);
    await page.goto('https://indianvisa-bangladesh.nic.in/visa/PrintApplication', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const maxAttempts = 6;
    let foundDownloadedPath: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 [Reprint] Captcha submission attempt ${attempt}/${maxAttempts}...`);

      await page.waitForSelector('#visa_type2', { timeout: 15000 });
      await page.waitForSelector('#application_id', { timeout: 15000 });

      // Populate form fields
      await page.evaluate(
        (data: { mission: string; appId: string; dob: string; pass: string }) => {
          const r = document.getElementById('visa_type2') as HTMLInputElement;
          if (r) r.checked = true;

          const m = document.getElementById('missioncode_id_reprint') as HTMLSelectElement;
          if (m) m.value = data.mission;

          const a = document.getElementById('application_id') as HTMLInputElement;
          if (a) a.value = data.appId;

          const d = document.getElementById('dob_id') as HTMLInputElement;
          if (d) d.value = data.dob;

          const p = document.getElementById('passport_no') as HTMLInputElement;
          if (p) p.value = data.pass;
        },
        {
          mission: missionCode,
          appId: cleanWebFileNo,
          dob: formattedDob,
          pass: cleanPassport,
        }
      );
      await page.waitForTimeout(300);

      // Wait for captcha image
      await page.waitForSelector('#capt', { timeout: 10000 });
      const captchaBuf = await getCaptchaBuffer(page);
      if (!captchaBuf || captchaBuf.length === 0) {
        throw new Error('Failed to capture captcha image from portal');
      }

      const captchaText = await solveCaptcha(captchaBuf);
      console.log(`🤖 [Reprint] Solved captcha: "${captchaText}"`);

      // Fill captcha input
      await page.evaluate((capText: string) => {
        const c = document.getElementById('captcha') as HTMLInputElement;
        if (c) c.value = capText;
      }, captchaText);
      await page.waitForTimeout(200);

      const attemptStartTime = Date.now();

      // Click Reprint button
      try {
        await page.locator('input[name="submit_btn"][value="Reprint"]').click().catch(() => {
          return page.evaluate(() => {
            const btn = document.querySelector('input[name="submit_btn"][value="Reprint"]') as HTMLInputElement;
            if (btn) btn.click();
          });
        });
      } catch (submitErr) {
        console.warn(`⚠️ [Reprint] Submit click warning:`, submitErr);
      }

      // Poll downloads directory for up to 12s for newly written official PDF
      const pollStart = Date.now();
      while (Date.now() - pollStart < 12000) {
        const candidate = findPdfInDownloads(downloadsDir, cleanWebFileNo, attemptStartTime - 1000);
        if (candidate) {
          // Verify file write is finished (size steady for 400ms)
          const s1 = fs.statSync(candidate).size;
          await new Promise((r) => setTimeout(r, 400));
          const s2 = fs.statSync(candidate).size;
          if (s1 === s2 && s1 > 20000) {
            foundDownloadedPath = candidate;
            console.log(`🎉 [Reprint] Captured official PDF on disk: ${candidate} (${(s1 / 1024).toFixed(1)} KB)`);
            break;
          }
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (foundDownloadedPath) {
        break;
      }

      // Check portal response text
      const pageText = await page.evaluate(() => (document.body ? document.body.innerText : ''));
      if (pageText.toLowerCase().includes('could not be found')) {
        throw new Error('Govt Portal: Details entered by you could not be found with provided information.');
      }

      console.warn(`⚠️ [Reprint] Attempt ${attempt} did not download. Refreshing page for clean attempt...`);
      await page.goto('https://indianvisa-bangladesh.nic.in/visa/PrintApplication', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      }).catch(() => {});
      await page.waitForTimeout(800);
    }

    if (!foundDownloadedPath || !fs.existsSync(foundDownloadedPath)) {
      throw new Error(`Failed to acquire official PDF from portal after ${maxAttempts} attempts`);
    }

    // Standardize to downloads/${cleanWebFileNo}.pdf
    const targetLocalPath = path.resolve(downloadsDir, `${cleanWebFileNo}.pdf`);
    if (foundDownloadedPath !== targetLocalPath) {
      fs.copyFileSync(foundDownloadedPath, targetLocalPath);
    }
    console.log(`💾 [Reprint] Saved official PDF to standardized path: ${targetLocalPath}`);

    const pdfBuffer = fs.readFileSync(targetLocalPath);

    // Upload to Cloudflare R2 / Storage
    let finalPdfUrl: string | undefined;
    try {
      const storageKey = opts.applicationId
        ? `applications/${opts.applicationId}/${cleanWebFileNo}.pdf`
        : `reprints/${cleanWebFileNo}.pdf`;

      const uploadRes = await uploadLocalFileToStorage(
        targetLocalPath,
        storageKey,
        'application/pdf'
      );
      finalPdfUrl = uploadRes.url;
      console.log(`☁️ [Reprint] Persisted official PDF to Cloudflare R2 / Storage: ${finalPdfUrl}`);
    } catch (uploadErr) {
      console.warn(`⚠️ [Reprint] Failed to upload to R2, local file will be used:`, uploadErr);
    }

    // Update DB record if applicationId is available
    if (opts.applicationId) {
      try {
        updateApplication(opts.applicationId, {
          pdf_path: targetLocalPath,
          ...(finalPdfUrl ? { final_pdf_url: finalPdfUrl } : {}),
        });
        console.log(`✅ [Reprint] Database application record updated with PDF references`);
      } catch (dbErr) {
        console.warn(`⚠️ [Reprint] Failed to update application record in DB:`, dbErr);
      }
    }

    return {
      success: true,
      webFileNumber: cleanWebFileNo,
      pdfBuffer,
      pdfPath: targetLocalPath,
      finalPdfUrl,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('❌ [Reprint] Government portal reprint error:', errorMsg);
    return {
      success: false,
      webFileNumber: cleanWebFileNo,
      error: errorMsg,
    };
  } finally {
    if (session) {
      await session.close().catch(() => {});
    }
  }
}
