import fs from 'fs';
import path from 'path';
import { initStagehand } from '@/stagehand';
import { executeStep1 } from '@/services/step1';
import { executeStep2 } from '@/services/step2';
import { executeStep3 } from '@/services/step3';
import { executeStep4 } from '@/services/step4';
import { executeStep5 } from '@/services/step5';
import { executeStep6 } from '@/services/step6';
import { executeStep7 } from '@/services/step7';
import { executeStep8 } from '@/services/step8';
import { executeStep9 } from '@/services/step9';
import { executeCompletePartially } from '@/services/completePartially';
import { VisaApplicantProfile } from '@/types/profile';
import { sanitizeProfileDefaults } from '@/lib/profile-constants';
import {
  getApplicationById,
  updateApplication,
  deductUserQuota,
  getUserSubscription,
} from '@/lib/db';
import { downloadR2Buffer, uploadLocalFileToStorage } from '@/lib/r2';
import { emitProgress } from '@/lib/progressEmitter';

export interface AutomationResult {
  success: boolean;
  currentStep: number;
  temporaryApplicationId?: string;
  finalApplicationId?: string;
  applicantName?: string;
  downloadedPdfPath?: string;
  error?: string;
}

/**
 * Resolves a local absolute path for photograph or passport PDF.
 * Materializes only application-scoped private objects.
 */
export async function resolveMediaFileOnDisk(
  applicationId: string,
  filePathOrUrl?: string | null,
  type: 'photo' | 'passport' = 'photo'
): Promise<string | null> {
  const runtimeDir = path.resolve(process.cwd(), 'data', 'runtime-media', applicationId);

  // 1. Explicit paths are accepted only inside this application's managed folders.
  if (filePathOrUrl && !filePathOrUrl.startsWith('storage:')) {
    const candidate = path.resolve(filePathOrUrl);
    if (candidate.startsWith(`${runtimeDir}${path.sep}`) && fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
      return candidate;
    }
  }

  // 3. Materialize an opaque private-storage object for browser upload.
  if (filePathOrUrl?.startsWith('storage:')) {
    const key = filePathOrUrl.slice('storage:'.length);
    if (!key.startsWith(`applications/${applicationId}/`)) return null;
    const buffer = await downloadR2Buffer(key);
    fs.mkdirSync(runtimeDir, { recursive: true });
    const target = path.join(runtimeDir, type === 'photo' ? 'photo.jpg' : 'passport.pdf');
    fs.writeFileSync(target, buffer);
    return target;
  }

  return null;
}

// Global registry of active browser automation sessions for clean lifecycle management
const activeSessions = new Map<string, { close: () => Promise<void> }>();

/**
 * Forcefully terminates and closes a running browser automation session.
 */
export async function stopApplicationAutomation(applicationId: string): Promise<boolean> {
  const session = activeSessions.get(applicationId);
  if (session) {
    activeSessions.delete(applicationId);
    try {
      await session.close();
      console.log(`🛑 [App ${applicationId}] Browser session forcefully closed.`);
      return true;
    } catch (err) {
      console.warn(`⚠️ [App ${applicationId}] Error closing browser session:`, err);
    }
  }
  return false;
}

/**
 * Executes the complete 9-step visa form automation for an application in the database.
 */
export async function runApplicationAutomation(applicationId: string): Promise<AutomationResult> {
  const application = getApplicationById(applicationId);
  if (!application) {
    throw new Error(`Application ${applicationId} not found`);
  }

  // Check quota
  const sub = getUserSubscription(application.user_id);
  if (!sub || (sub.quota_total !== null && sub.quota_used >= sub.quota_total)) {
    throw new Error('QUOTA_EXCEEDED');
  }

  // Parse application payload
  let profile: VisaApplicantProfile;
  try {
    profile = sanitizeProfileDefaults(JSON.parse(application.form_data_json));
  } catch (err: unknown) {
    throw new Error(`Invalid application form data JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Deduct quota
  if (!deductUserQuota(application.user_id)) {
    throw new Error('QUOTA_EXCEEDED');
  }

  // Update DB status to processing
  updateApplication(applicationId, {
    status: 'processing',
    current_step: 1,
    failed_step: null,
    failure_reason: null,
  });

  const session = await initStagehand();
  activeSessions.set(applicationId, session);
  const { page } = session;
  let currentStep = 1;

  try {
    console.log(`\n🌐 [App ${applicationId}][Init] Browser initialized`);
    emitProgress(applicationId, {
      step: 1,
      status: 'processing',
      message: `Initializing browser & navigating to official Indian Visa portal...`,
      messageBn: 'ব্রাউজার চালু করে অফিসিয়াল ইন্ডিয়ান ভিসা পোর্টালে প্রবেশ করা হচ্ছে...',
      type: 'info',
    });

    // ----------------------------------------------------
    // STEP 1: Registration & Captcha
    // ----------------------------------------------------
    console.log(`\n⚡ [App ${applicationId}][Step 1] Registration & Captcha OCR`);
    emitProgress(applicationId, {
      step: 1,
      status: 'processing',
      message: `Step 1: Navigating to portal & solving Captcha...`,
      messageBn: 'ধাপ ১: সরকারি পোর্টালে প্রবেশ ও ক্যাপচা সমাধান হচ্ছে...',
      type: 'info',
    });

    const step1Result = await executeStep1(page, profile.step1_registration, (msg, msgBn) => {
      emitProgress(applicationId, {
        step: 1,
        status: 'processing',
        message: msg,
        messageBn: msgBn,
        type: 'info',
      });
    });
    if (!step1Result.success) {
      throw new Error(`Step 1 failed: ${step1Result.error}`);
    }

    const tempId = step1Result.temporaryApplicationId || profile.temporaryApplicationId;
    const urlAfterStep1 = await page.url();
    if (tempId) {
      profile.temporaryApplicationId = tempId;
      updateApplication(applicationId, {
        temp_id: tempId,
        current_step: 2,
        form_data_json: JSON.stringify(profile),
      });
      emitProgress(applicationId, {
        step: 2,
        status: 'processing',
        message: `Step 1 Verified! Temporary Application ID: ${tempId} (Redirected to: ${urlAfterStep1})`,
        messageBn: `ধাপ ১ সম্পন্ন! টেম্পোরারি আইডি তৈরি হয়েছে: ${tempId}`,
        tempId,
        type: 'success',
      });
    }

    currentStep = 2;

    // ----------------------------------------------------
    // STEP 2: Applicant & Passport Details
    // ----------------------------------------------------
    if (profile.step2_applicant_details) {
      const step2Url = await page.url();
      console.log(`\n⚡ [App ${applicationId}][Step 2] Applicant & Passport Details on: ${step2Url}`);
      emitProgress(applicationId, {
        step: 2,
        status: 'processing',
        message: `Step 2: Submitting Applicant & Passport particulars (URL: ${step2Url})...`,
        messageBn: 'ধাপ ২: আবেদনকারী ও পাসপোর্টের বিবরণ পূরণ হচ্ছে...',
        type: 'info',
      });

      const step2Result = await executeStep2(page, profile.step2_applicant_details, 'continue');
      if (!step2Result.success) {
        throw new Error(`Step 2 failed: ${step2Result.error}`);
      }

      const urlAfterStep2 = await page.url();
      emitProgress(applicationId, {
        step: 3,
        status: 'processing',
        message: `Step 2 Verified: Personal & passport data recorded. (Next URL: ${urlAfterStep2})`,
        messageBn: 'ধাপ ২ সম্পন্ন: ব্যক্তিগত ও পাসপোর্ট তথ্য নিবন্ধিত।',
        type: 'success',
      });

      updateApplication(applicationId, { current_step: 3 });
      currentStep = 3;
    }

    // ----------------------------------------------------
    // STEP 3: Family Details & Address
    // ----------------------------------------------------
    if (profile.step3_family_address) {
      const step3Url = await page.url();
      console.log(`\n⚡ [App ${applicationId}][Step 3] Family Details & Address on: ${step3Url}`);
      emitProgress(applicationId, {
        step: 3,
        status: 'processing',
        message: `Step 3: Submitting Family Details & Address (URL: ${step3Url})...`,
        messageBn: 'ধাপ ৩: পিতা-মাতার বিবরণ ও বর্তমান/স্থায়ী ঠিকানা পূরণ হচ্ছে...',
        type: 'info',
      });

      const step3Result = await executeStep3(page, profile.step3_family_address, 'continue');
      if (!step3Result.success) {
        throw new Error(`Step 3 failed: ${step3Result.error}`);
      }

      const urlAfterStep3 = await page.url();
      emitProgress(applicationId, {
        step: 4,
        status: 'processing',
        message: `Step 3 Verified: Family and address details saved. (Next URL: ${urlAfterStep3})`,
        messageBn: 'ধাপ ৩ সম্পন্ন: ঠিকানা ও পরিবারের বিবরণ নিবন্ধিত।',
        type: 'success',
      });

      updateApplication(applicationId, { current_step: 4 });
      currentStep = 4;
    }

    // ----------------------------------------------------
    // STEP 4: Visa Details & References
    // ----------------------------------------------------
    if (profile.step4_visa_references) {
      const step4Url = await page.url();
      console.log(`\n⚡ [App ${applicationId}][Step 4] Visa Details & References on: ${step4Url}`);
      emitProgress(applicationId, {
        step: 4,
        status: 'processing',
        message: `Step 4: Submitting Visa Specifics, Ports & References (URL: ${step4Url})...`,
        messageBn: 'ধাপ ৪: ভিসার ধরন, পোর্ট ও রেফারেন্স তথ্য পূরণ হচ্ছে...',
        type: 'info',
      });

      const step4Result = await executeStep4(page, profile.step4_visa_references, 'continue');
      if (!step4Result.success) {
        throw new Error(`Step 4 failed: ${step4Result.error}`);
      }

      const urlAfterStep4 = await page.url();
      emitProgress(applicationId, {
        step: 5,
        status: 'processing',
        message: `Step 4 Verified: References and travel history saved. (Next URL: ${urlAfterStep4})`,
        messageBn: 'ধাপ ৪ সম্পন্ন: রেফারেন্স ও ভ্রমণ ইতিহাস সংরক্ষিত।',
        type: 'success',
      });

      updateApplication(applicationId, { current_step: 5 });
      currentStep = 5;
    }

    // ----------------------------------------------------
    // STEP 5: Additional Questions & Declaration
    // ----------------------------------------------------
    if (profile.step5_additional_questions) {
      const step5Url = await page.url();
      console.log(`\n⚡ [App ${applicationId}][Step 5] Security Questions on: ${step5Url}`);
      emitProgress(applicationId, {
        step: 5,
        status: 'processing',
        message: `Step 5: Answering statutory security declarations (URL: ${step5Url})...`,
        messageBn: 'ধাপ ৫: নিরাপত্তা সংক্রান্ত আইনি প্রশ্নের উত্তর প্রদান হচ্ছে...',
        type: 'info',
      });

      const step5Result = await executeStep5(page, profile.step5_additional_questions, 'continue');
      if (!step5Result.success) {
        throw new Error(`Step 5 failed: ${step5Result.error}`);
      }

      const urlAfterStep5 = await page.url();
      emitProgress(applicationId, {
        step: 6,
        status: 'processing',
        message: `Step 5 Verified: Statutory questions verified. (Next URL: ${urlAfterStep5})`,
        messageBn: 'ধাপ ৫ সম্পন্ন: নিরাপত্তা প্রশ্নাবলী যাচাই সম্পন্ন।',
        type: 'success',
      });

      updateApplication(applicationId, { current_step: 6 });
      currentStep = 6;
    }

    // Resolve media files if attached to profile or application
    const resolvedPhotoPath = await resolveMediaFileOnDisk(
      applicationId,
      profile.photoFilePath || application.photo_url,
      'photo'
    );
    const resolvedPassportPath = await resolveMediaFileOnDisk(
      applicationId,
      profile.passportPdfPath || application.passport_pdf_url,
      'passport'
    );

    // ----------------------------------------------------
    // STEP 6: Photograph Upload (Automatic)
    // ----------------------------------------------------
    const currentUrlBeforeStep6 = await page.url();
    if (currentUrlBeforeStep6.includes('/visa/PhotoUpload') || currentUrlBeforeStep6.includes('/visa/UploadImage')) {
      if (resolvedPhotoPath && fs.existsSync(resolvedPhotoPath)) {
        console.log(`\n📸 [App ${applicationId}][Step 6] Photograph upload on: ${currentUrlBeforeStep6}`);
        emitProgress(applicationId, {
          step: 6,
          status: 'processing',
          message: `Step 6: Normalizing & uploading 2×2 Consular Photo (URL: ${currentUrlBeforeStep6})...`,
          messageBn: 'ধাপ ৬: ২×২ কনস্যুলার ছবি আপলোড ও ফ্রেম ক্রপিং হচ্ছে...',
          type: 'info',
        });

        const step6Result = await executeStep6(page, resolvedPhotoPath, 'upload');
        if (!step6Result.success) {
          throw new Error(`Step 6 failed: ${step6Result.error}`);
        }

        const urlAfterStep6 = await page.url();
        emitProgress(applicationId, {
          step: 7,
          status: 'processing',
          message: `Step 6 Verified: 2×2 Photograph successfully attached. (Next URL: ${urlAfterStep6})`,
          messageBn: 'ধাপ ৬ সম্পন্ন: ছবি সফলভাবে সংযুক্ত করা হয়েছে।',
          type: 'success',
        });
      } else {
        throw new Error('Step 6 failed: A valid 2×2 inch square consular photo is required by the portal to proceed. Please ensure photo is uploaded.');
      }
      updateApplication(applicationId, { current_step: 7 });
      currentStep = 7;
    }

    // ----------------------------------------------------
    // STEP 7: Document Upload (Passport PDF - Automatic)
    // ----------------------------------------------------
    const currentUrlBeforeStep7 = await page.url();
    if (currentUrlBeforeStep7.includes('/visa/DocumentUpload') || currentUrlBeforeStep7.includes('/visa/UploadDoc')) {
      if (resolvedPassportPath && fs.existsSync(resolvedPassportPath)) {
        console.log(`\n📄 [App ${applicationId}][Step 7] Passport document upload on: ${currentUrlBeforeStep7}`);
        emitProgress(applicationId, {
          step: 7,
          status: 'processing',
          message: `Step 7: Validating & uploading Passport Document PDF (URL: ${currentUrlBeforeStep7})...`,
          messageBn: 'ধাপ ৭: পাসপোর্ট ডকুমেন্ট পিডিএফ সরকারিভাবে আপলোড হচ্ছে...',
          type: 'info',
        });

        const step7Result = await executeStep7(page, resolvedPassportPath, 'upload');
        if (!step7Result.success) {
          throw new Error(`Step 7 failed: ${step7Result.error}`);
        }

        const urlAfterStep7 = await page.url();
        emitProgress(applicationId, {
          step: 8,
          status: 'processing',
          message: `Step 7 Verified: Passport document confirmed on portal. (Next URL: ${urlAfterStep7})`,
          messageBn: 'ধাপ ৭ সম্পন্ন: পাসপোর্ট ডকুমেন্ট সফলভাবে গৃহীত হয়েছে।',
          type: 'success',
        });
      } else {
        console.log(`\n⚠️ [App ${applicationId}][Step 7] No passport PDF attached on ${currentUrlBeforeStep7}. Skipping...`);
        emitProgress(applicationId, {
          step: 7,
          status: 'processing',
          message: `Step 7: Skipping document upload (none attached) on ${currentUrlBeforeStep7}...`,
          messageBn: 'ধাপ ৭: ডকুমেন্ট আপলোড বাদ দেওয়া হচ্ছে...',
          type: 'warning',
        });

        const step7Result = await executeStep7(page, undefined, 'exit');
        if (!step7Result.success) {
          throw new Error(`Step 7 exit failed: ${step7Result.error}`);
        }
      }
      updateApplication(applicationId, { current_step: 8 });
      currentStep = 8;
    }

    // ----------------------------------------------------
    // STEP 8: Visit Details / Hotel Stay
    // ----------------------------------------------------
    const currentUrlBeforeStep8 = await page.url();
    if (currentUrlBeforeStep8.includes('/visa/BangladeshDetails')) {
      console.log(`\n⚡ [App ${applicationId}][Step 8] Visit & Stay Details on: ${currentUrlBeforeStep8}`);
      emitProgress(applicationId, {
        step: 8,
        status: 'processing',
        message: `Step 8: Populating Stay & Hotel details (URL: ${currentUrlBeforeStep8})...`,
        messageBn: 'ধাপ ৮: ভারতে অবস্থান ও হোটেলের বিবরণ পূরণ হচ্ছে...',
        type: 'info',
      });

      const step8Result = await executeStep8(page, profile.step8_stay_details, profile.step4_visa_references);
      if (!step8Result.success) {
        throw new Error(`Step 8 failed: ${step8Result.error}`);
      }

      const urlAfterStep8 = await page.url();
      emitProgress(applicationId, {
        step: 9,
        status: 'processing',
        message: `Step 8 Verified: Stay details saved. (Next URL: ${urlAfterStep8})`,
        messageBn: 'ধাপ ৮ সম্পন্ন: অবস্থান ও হোটেলের বিবরণ সংরক্ষিত।',
        type: 'success',
      });

      updateApplication(applicationId, { current_step: 9 });
      currentStep = 9;
    }

    // ----------------------------------------------------
    // STEP 9: Final Verification & Submission
    // ----------------------------------------------------
    const currentUrlBeforeStep9 = await page.url();
    console.log(`\n⚡ [App ${applicationId}][Step 9] Final Verification on: ${currentUrlBeforeStep9}`);
    emitProgress(applicationId, {
      step: 9,
      status: 'processing',
      message: `Step 9: Final verification on ${currentUrlBeforeStep9}... Submitting for Confirmation...`,
      messageBn: 'ধাপ ৯: চূড়ান্ত যাচাইকরণ ও সরকারি কনফার্মেশন প্রক্রিয়াকরণ হচ্ছে...',
      type: 'info',
    });

    const step9Result = await executeStep9(page, true, {
      onLog: (msg) => {
        emitProgress(applicationId, {
          step: 9,
          status: 'processing',
          message: msg,
          type: 'info',
        });
      },
    });
    if (!step9Result.success) {
      throw new Error(`Step 9 failed: ${step9Result.error}`);
    }

    const completedTempId = step9Result.temporaryApplicationId || profile.temporaryApplicationId;
    const finalAppId = step9Result.finalApplicationId || null;
    const pdfPath = step9Result.downloadedPdfPath || null;

    if (!finalAppId) {
      throw new Error(`[IVAC Webfile Creation Server Down]: Did not receive permanent Web File Number (Application ID) from Confirmation page.`);
    }

    let finalPdfUrl: string | null = null;
    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        const uploadRes = await uploadLocalFileToStorage(
          pdfPath,
          `applications/${applicationId}/${finalAppId || 'visa_application'}.pdf`,
          'application/pdf'
        );
        finalPdfUrl = uploadRes.url;
        console.log(`☁️ Synced official application PDF to Cloudflare R2: ${finalPdfUrl}`);
      } catch (uploadErr: unknown) {
        console.warn('⚠️ Could not sync official PDF to R2:', uploadErr instanceof Error ? uploadErr.message : String(uploadErr));
      }
    }

    updateApplication(applicationId, {
      status: 'completed',
      current_step: 9,
      temp_id: completedTempId,
      web_file_number: finalAppId,
      pdf_path: pdfPath,
      final_pdf_url: finalPdfUrl,
      form_data_json: JSON.stringify({
        ...profile,
        temporaryApplicationId: completedTempId,
        finalApplicationId: finalAppId,
        downloadedPdfPath: pdfPath,
        finalPdfUrl,
        completedAt: new Date().toISOString(),
      }),
    });

    emitProgress(applicationId, {
      step: 9,
      status: 'completed',
      message: `Application Confirmed! Web File No: ${finalAppId || completedTempId}`,
      messageBn: `আবেদন সফলভাবে সম্পন্ন হয়েছে! ওয়েব ফাইল নং: ${finalAppId || completedTempId}`,
      webFileNumber: finalAppId,
      tempId: completedTempId,
      pdfAvailable: Boolean(pdfPath),
      downloadUrl: `/api/applications/${applicationId}/pdf`,
      type: 'success',
    });

    return {
      success: true,
      currentStep: 9,
      temporaryApplicationId: completedTempId,
      finalApplicationId: finalAppId || undefined,
      applicantName: step9Result.applicantName,
      downloadedPdfPath: pdfPath || undefined,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [App ${applicationId}] Failed at step ${currentStep}:`, errorMsg);

    updateApplication(applicationId, {
      status: 'failed',
      failed_step: currentStep,
      failure_reason: errorMsg,
    });

    emitProgress(applicationId, {
      step: currentStep,
      status: 'failed',
      message: `Failed at Step ${currentStep}: ${errorMsg}`,
      messageBn: `ধাপ ${currentStep}-এ সমস্যা হয়েছে: ${errorMsg}`,
      error: errorMsg,
      type: 'error',
    });

    return {
      success: false,
      currentStep,
      error: errorMsg,
    };
  } finally {
    activeSessions.delete(applicationId);
    try {
      await session.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Resumes an application from a saved Temporary Application ID.
 */
export async function resumeApplicationAutomation(applicationId: string): Promise<AutomationResult> {
  const application = getApplicationById(applicationId);
  if (!application) {
    throw new Error(`Application ${applicationId} not found`);
  }

  const tempId = application.temp_id;
  if (!tempId) {
    throw new Error(`No temporary application ID found for application ${applicationId}`);
  }

  let profile: VisaApplicantProfile;
  try {
    profile = sanitizeProfileDefaults(JSON.parse(application.form_data_json));
  } catch (err: unknown) {
    throw new Error(`Invalid application form data JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  updateApplication(applicationId, {
    status: 'processing',
    failed_step: null,
    failure_reason: null,
  });

  const session = await initStagehand();
  activeSessions.set(applicationId, session);
  const { page } = session;
  let currentStep = application.current_step || 1;

  try {
    console.log(`\n🔄 [App ${applicationId}][Resume] Resuming application with Temp ID ${tempId}...`);
    emitProgress(applicationId, {
      step: 1,
      status: 'processing',
      message: `Resuming application ${tempId}: Logging in via portal CompletePartially...`,
      messageBn: `অস্থায়ী আইডি ${tempId} দিয়ে পোর্টাল লগইন ও রিজিউম প্রক্রিয়া শুরু হচ্ছে...`,
      type: 'info',
    });

    const resumeResult = await executeCompletePartially(page, tempId);
    if (!resumeResult.success) {
      throw new Error(`Resume portal login failed: ${resumeResult.error}`);
    }

    let currentUrl = resumeResult.currentUrl;
    console.log(`🌐 [App ${applicationId}][Resume] Logged in successfully. Current URL: ${currentUrl}`);

    // STEP 2: Applicant Details
    if (currentUrl.includes('/visa/BasicDetails') && profile.step2_applicant_details) {
      console.log(`⚡ [App ${applicationId}][Resume] Advancing from BasicDetails (Step 2) on ${currentUrl}...`);
      emitProgress(applicationId, {
        step: 2,
        status: 'processing',
        message: `Step 2: Processing Applicant Details (URL: ${currentUrl})...`,
        messageBn: 'ধাপ ২: আবেদনকারীর ব্যক্তিগত বিবরণ পূরণ হচ্ছে...',
        type: 'info',
      });

      const s2 = await executeStep2(page, profile.step2_applicant_details, 'continue');
      if (!s2.success) {
        throw new Error(`Step 2 failed: ${s2.error}`);
      }
      currentUrl = s2.currentUrl;
      currentStep = 3;
      updateApplication(applicationId, { current_step: 3 });

      emitProgress(applicationId, {
        step: 2,
        status: 'processing',
        message: `Step 2 Verified: Applicant Details saved. (Next URL: ${currentUrl})`,
        messageBn: 'ধাপ ২ সম্পন্ন: ব্যক্তিগত বিবরণ সংরক্ষিত।',
        type: 'success',
      });
    }

    // STEP 3: Family & Address Details
    if (currentUrl.includes('/visa/FamilyDetails') && profile.step3_family_address) {
      console.log(`⚡ [App ${applicationId}][Resume] Advancing from FamilyDetails (Step 3) on ${currentUrl}...`);
      emitProgress(applicationId, {
        step: 3,
        status: 'processing',
        message: `Step 3: Processing Family & Address Details (URL: ${currentUrl})...`,
        messageBn: 'ধাপ ৩: পিতামাতা, স্বামী/স্ত্রী ও ঠিকানার বিবরণ পূরণ হচ্ছে...',
        type: 'info',
      });

      const s3 = await executeStep3(page, profile.step3_family_address, 'continue');
      if (!s3.success) {
        throw new Error(`Step 3 failed: ${s3.error}`);
      }
      currentUrl = s3.currentUrl;
      currentStep = 4;
      updateApplication(applicationId, { current_step: 4 });

      emitProgress(applicationId, {
        step: 3,
        status: 'processing',
        message: `Step 3 Verified: Family Details saved. (Next URL: ${currentUrl})`,
        messageBn: 'ধাপ ৩ সম্পন্ন: পারিবারিক তথ্য সংরক্ষিত।',
        type: 'success',
      });
    }

    // STEP 4: Visa & Reference Details
    if (currentUrl.includes('/visa/VisaDetails') && profile.step4_visa_references) {
      console.log(`⚡ [App ${applicationId}][Resume] Advancing from VisaDetails (Step 4) on ${currentUrl}...`);
      emitProgress(applicationId, {
        step: 4,
        status: 'processing',
        message: `Step 4: Processing Visa Purpose & References (URL: ${currentUrl})...`,
        messageBn: 'ধাপ ৪: ভিসার তথ্য ও রেফারেন্স পূরণ হচ্ছে...',
        type: 'info',
      });

      const s4 = await executeStep4(page, profile.step4_visa_references, 'continue');
      if (!s4.success) {
        throw new Error(`Step 4 failed: ${s4.error}`);
      }
      currentUrl = s4.currentUrl;
      currentStep = 5;
      updateApplication(applicationId, { current_step: 5 });

      emitProgress(applicationId, {
        step: 4,
        status: 'processing',
        message: `Step 4 Verified: Visa Details saved. (Next URL: ${currentUrl})`,
        messageBn: 'ধাপ ৪ সম্পন্ন: ভিসার তথ্য সংরক্ষিত।',
        type: 'success',
      });
    }

    // STEP 5: Additional Questions
    if (currentUrl.includes('/visa/AdditionalQuestions') && profile.step5_additional_questions) {
      console.log(`⚡ [App ${applicationId}][Resume] Advancing from AdditionalQuestions (Step 5) on ${currentUrl}...`);
      emitProgress(applicationId, {
        step: 5,
        status: 'processing',
        message: `Step 5: Processing Background & Security Questions (URL: ${currentUrl})...`,
        messageBn: 'ধাপ ৫: নিরাপত্তা সংক্রান্ত প্রশ্নের উত্তর দেওয়া হচ্ছে...',
        type: 'info',
      });

      const s5 = await executeStep5(page, profile.step5_additional_questions, 'continue');
      if (!s5.success) {
        throw new Error(`Step 5 failed: ${s5.error}`);
      }
      currentUrl = s5.currentUrl;
      currentStep = 6;
      updateApplication(applicationId, { current_step: 6 });

      emitProgress(applicationId, {
        step: 5,
        status: 'processing',
        message: `Step 5 Verified: Questions answered. (Next URL: ${currentUrl})`,
        messageBn: 'ধাপ ৫ সম্পন্ন: প্রশ্নাবলীর উত্তর সংরক্ষিত।',
        type: 'success',
      });
    }

    const resolvedPhotoPath = await resolveMediaFileOnDisk(
      applicationId,
      profile.photoFilePath || application.photo_url,
      'photo'
    );
    const resolvedPassportPath = await resolveMediaFileOnDisk(
      applicationId,
      profile.passportPdfPath || application.passport_pdf_url,
      'passport'
    );

    // STEP 6: Photograph Upload
    if (currentUrl.includes('/visa/UploadImage') || currentUrl.includes('/visa/PhotoUpload')) {
      console.log(`⚡ [App ${applicationId}][Resume] Advancing from PhotoUpload (Step 6) on ${currentUrl}...`);
      emitProgress(applicationId, {
        step: 6,
        status: 'processing',
        message: `Step 6: Uploading applicant photograph (URL: ${currentUrl})...`,
        messageBn: 'ধাপ ৬: ছবি আপলোড করা হচ্ছে...',
        type: 'info',
      });

      if (resolvedPhotoPath && fs.existsSync(resolvedPhotoPath)) {
        console.log(`📸 [Resume] Automatically uploading photograph (${resolvedPhotoPath})...`);
        const s6 = await executeStep6(page, resolvedPhotoPath, 'upload');
        if (!s6.success) throw new Error(`Step 6 photo upload failed: ${s6.error}`);
        currentUrl = s6.currentUrl;
      } else {
        console.log(`⚠️ [Resume] No photograph attached. Skipping photo step via portal exit...`);
        const s6 = await executeStep6(page, undefined, 'exit');
        if (!s6.success) throw new Error(`Step 6 photo skip failed: ${s6.error}`);
        currentUrl = s6.currentUrl;
      }
      currentStep = 7;
      updateApplication(applicationId, { current_step: 7 });

      emitProgress(applicationId, {
        step: 6,
        status: 'processing',
        message: `Step 6 Verified: Photo processed. (Next URL: ${currentUrl})`,
        messageBn: 'ধাপ ৬ সম্পন্ন: ছবি যাচাইকরণ সম্পন্ন।',
        type: 'success',
      });
    }

    // STEP 7: Passport Document Upload
    if (currentUrl.includes('/visa/UploadDoc') || currentUrl.includes('/visa/DocumentUpload')) {
      console.log(`⚡ [App ${applicationId}][Resume] Advancing from DocumentUpload (Step 7) on ${currentUrl}...`);
      emitProgress(applicationId, {
        step: 7,
        status: 'processing',
        message: `Step 7: Uploading passport PDF (URL: ${currentUrl})...`,
        messageBn: 'ধাপ ৭: পাসপোর্ট কপি আপলোড হচ্ছে...',
        type: 'info',
      });

      if (resolvedPassportPath && fs.existsSync(resolvedPassportPath)) {
        console.log(`📄 [Resume] Automatically uploading passport PDF (${resolvedPassportPath})...`);
        const s7 = await executeStep7(page, resolvedPassportPath, 'upload');
        if (!s7.success) throw new Error(`Step 7 document upload failed: ${s7.error}`);
        currentUrl = s7.currentUrl;
      } else {
        console.log(`⚠️ [Resume] No passport PDF attached. Skipping document upload...`);
        const s7 = await executeStep7(page, undefined, 'exit');
        if (!s7.success) throw new Error(`Step 7 document skip failed: ${s7.error}`);
        currentUrl = s7.currentUrl;
      }
      currentStep = 8;
      updateApplication(applicationId, { current_step: 8 });

      emitProgress(applicationId, {
        step: 7,
        status: 'processing',
        message: `Step 7 Verified: Passport document processed. (Next URL: ${currentUrl})`,
        messageBn: 'ধাপ ৭ সম্পন্ন: পাসপোর্ট ডকুমেন্ট যাচাইকরণ সম্পন্ন।',
        type: 'success',
      });
    }

    // STEP 8: Stay Details
    if (currentUrl.includes('/visa/BangladeshDetails')) {
      console.log(`⚡ [App ${applicationId}][Resume] Advancing from BangladeshDetails (Step 8) on ${currentUrl}...`);
      emitProgress(applicationId, {
        step: 8,
        status: 'processing',
        message: `Step 8: Populating Stay & Hotel details (URL: ${currentUrl})...`,
        messageBn: 'ধাপ ৮: ভারতে অবস্থান ও হোটেলের বিবরণ পূরণ হচ্ছে...',
        type: 'info',
      });

      const s8 = await executeStep8(page, profile.step8_stay_details, profile.step4_visa_references);
      if (!s8.success) {
        throw new Error(`Step 8 failed: ${s8.error}`);
      }
      currentUrl = s8.currentUrl;
      currentStep = 9;
      updateApplication(applicationId, { current_step: 9 });

      emitProgress(applicationId, {
        step: 8,
        status: 'processing',
        message: `Step 8 Verified: Stay details saved. (Next URL: ${currentUrl})`,
        messageBn: 'ধাপ ৮ সম্পন্ন: অবস্থান ও হোটেলের বিবরণ সংরক্ষিত।',
        type: 'success',
      });
    }

    // STEP 9: Final Verification & PDF Download
    if (currentUrl.includes('/visa/VerifiedDetails') || currentUrl.includes('/visa/Verification')) {
      console.log(`⚡ Advancing from Review page (Step 9) on ${currentUrl}...`);
      emitProgress(applicationId, {
        step: 9,
        status: 'processing',
        message: `Step 9: Final verification on ${currentUrl}... Submitting for Confirmation...`,
        messageBn: 'ধাপ ৯: চূড়ান্ত যাচাইকরণ ও সরকারি কনফার্মেশন প্রক্রিয়াকরণ হচ্ছে...',
        type: 'info',
      });

      const s9 = await executeStep9(page, true, {
        onLog: (msg) => {
          emitProgress(applicationId, {
            step: 9,
            status: 'processing',
            message: msg,
            type: 'info',
          });
        },
      });
      if (!s9.success) {
        throw new Error(`Step 9 verification failed: ${s9.error}`);
      }

      const finalAppId = s9.finalApplicationId || null;
      const pdfPath = s9.downloadedPdfPath || null;

      if (!finalAppId) {
        throw new Error(`[IVAC Webfile Creation Server Down]: Did not receive permanent Web File Number (Application ID) from Confirmation page.`);
      }
      let finalPdfUrl: string | null = null;

      if (pdfPath && fs.existsSync(pdfPath)) {
        try {
          const uploadRes = await uploadLocalFileToStorage(
            pdfPath,
            `applications/${applicationId}/${finalAppId || 'visa_application'}.pdf`,
            'application/pdf'
          );
          finalPdfUrl = uploadRes.url;
          console.log(`☁️ [Resume] Synced official application PDF to Cloudflare R2: ${finalPdfUrl}`);
        } catch (uploadErr: unknown) {
          console.warn('⚠️ [Resume] Could not sync official PDF to R2:', uploadErr instanceof Error ? uploadErr.message : String(uploadErr));
        }
      }

      updateApplication(applicationId, {
        status: 'completed',
        current_step: 9,
        temp_id: tempId,
        web_file_number: finalAppId,
        pdf_path: pdfPath,
        final_pdf_url: finalPdfUrl,
        form_data_json: JSON.stringify({
          ...profile,
          temporaryApplicationId: tempId,
          finalApplicationId: finalAppId,
          downloadedPdfPath: pdfPath,
          finalPdfUrl,
          completedAt: new Date().toISOString(),
        }),
      });

      emitProgress(applicationId, {
        step: 9,
        status: 'completed',
        message: `Application Confirmed via Resume! Web File No: ${finalAppId || tempId}`,
        messageBn: `রিজিউমের মাধ্যমে আবেদন সম্পন্ন হয়েছে! ওয়েব ফাইল নং: ${finalAppId || tempId}`,
        webFileNumber: finalAppId,
        tempId: tempId,
        pdfAvailable: Boolean(pdfPath),
        downloadUrl: `/api/applications/${applicationId}/pdf`,
        type: 'success',
      });

      return {
        success: true,
        currentStep: 9,
        temporaryApplicationId: tempId,
        finalApplicationId: finalAppId || undefined,
        applicantName: s9.applicantName,
        downloadedPdfPath: pdfPath || undefined,
      };
    }

    updateApplication(applicationId, {
      status: 'completed',
      current_step: currentStep,
    });

    return {
      success: true,
      currentStep,
      temporaryApplicationId: tempId,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [App ${applicationId}] Resume failed at step ${currentStep}:`, errorMsg);

    updateApplication(applicationId, {
      status: 'failed',
      failed_step: currentStep,
      failure_reason: errorMsg,
    });

    emitProgress(applicationId, {
      step: currentStep,
      status: 'failed',
      message: `Resume Failed at Step ${currentStep}: ${errorMsg}`,
      messageBn: `রিজিউম প্রক্রিয়া ধাপ ${currentStep}-এ ব্যর্থ হয়েছে: ${errorMsg}`,
      error: errorMsg,
      type: 'error',
    });

    return {
      success: false,
      currentStep,
      error: errorMsg,
    };
  } finally {
    activeSessions.delete(applicationId);
    try {
      await session.close();
    } catch {
      // ignore
    }
  }
}
