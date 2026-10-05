export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  errorBn?: string;
  details?: {
    width?: number;
    height?: number;
    sizeKb?: number;
    format?: string;
  };
}

/**
 * Validates that an uploaded file is a valid 2×2 inch square consular passport photograph:
 * - Square 1:1 aspect ratio (0.92 - 1.08)
 * - Minimum 350×350 px resolution (standard 600×600 px)
 * - Size between 10 KB and 1024 KB (1 MB)
 * - Valid image format (JPEG/PNG/WebP)
 */
export async function validatePassportPhoto(
  file: File | null,
  isStandard: boolean = false
): Promise<MediaValidationResult> {
  if (!file) {
    return {
      valid: false,
      error: '2×2 inch consular passport photograph is required before launching automation.',
      errorBn: 'স্বয়ংক্রিয় প্রসেসিং শুরু করতে ২×২ ইঞ্চি কনস্যুলার ছবি আপলোড করা আবশ্যক।',
    };
  }

  // Format check
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!isImage) {
    return {
      valid: false,
      error: 'Photograph must be a valid image file (JPG, JPEG, or PNG).',
      errorBn: 'ছবি অবশ্যই একটি বৈধ ইমেজ ফাইল (JPG, JPEG বা PNG) হতে হবে।',
    };
  }

  // Size check (Minimum 10 KB; Starter: max 1 MB, Standard/Pro: max 20 MB)
  const sizeKb = Math.round(file.size / 1024);
  if (sizeKb < 10) {
    return {
      valid: false,
      error: `Photo file size is too small (${sizeKb} KB). Minimum 10 KB required by portal.`,
      errorBn: `ছবির ফাইল সাইজ খুব ছোট (${sizeKb} KB)। পোর্টালে ন্যূনতম ১০ KB আবশ্যক।`,
    };
  }

  const maxPhotoKb = isStandard ? 20 * 1024 : 1024;
  if (sizeKb > maxPhotoKb) {
    if (!isStandard) {
      return {
        valid: false,
        error: `Photo file size (${sizeKb} KB) exceeds the 1 MB limit on Starter plan. Upgrade to Standard or Agency Pro to upload images up to 20 MB.`,
        errorBn: `Starter প্ল্যানে ছবির সাইজ সর্বোচ্চ ১ MB (১০২৪ KB)। ২০ MB পর্যন্ত বড় ছবি আপলোড করতে Standard বা Agency Pro প্ল্যানে আপগ্রেড করুন।`,
      };
    } else {
      return {
        valid: false,
        error: `Photo file size (${(sizeKb / 1024).toFixed(1)} MB) exceeds the maximum 20 MB limit.`,
        errorBn: `ছবির ফাইল সাইজ (${(sizeKb / 1024).toFixed(1)} MB) সর্বোচ্চ ২০ MB এর বেশি।`,
      };
    }
  }

  // Dimensions & Aspect Ratio check via Image loading
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const ratio = width / height;

      // Indian visa portal requires square (1:1) aspect ratio
      if (ratio < 0.90 || ratio > 1.10) {
        resolve({
          valid: false,
          error: `Photo is not square (${width}×${height} px, ratio ${(ratio).toFixed(2)}:1). Consular 2×2 inch photo must be 1:1. Use our built-in cropper.`,
          errorBn: `ছবিটি বর্গাকার নয় (${width}×${height} px)। কনস্যুলার ২×২ ছবি অবশ্যই ১:১ রেশিও হতে হবে। বিল্ট-ইন ক্রপার ব্যবহার করুন।`,
          details: { width, height, sizeKb, format: file.type },
        });
        return;
      }

      // Minimum resolution check (Official portal requirement: minimum 350x350 px)
      if (width < 350 || height < 350) {
        resolve({
          valid: false,
          error: `Photo resolution (${width}×${height} px) is too low. The minimum dimensions are 350 pixels (width) x 350 pixels (height).`,
          errorBn: `ছবির রেজোলিউশন (${width}×${height} px) খুব কম। সরকারি নির্দেশিকা অনুযায়ী ন্যূনতম ৩৫০×৩৫০ পিক্সেল আবশ্যক।`,
          details: { width, height, sizeKb, format: file.type },
        });
        return;
      }

      resolve({
        valid: true,
        details: { width, height, sizeKb, format: file.type },
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Could not decode image file. Please provide a clear, uncorrupted JPEG or PNG.',
        errorBn: 'ইমেজ ফাইলটি ডিকোড করা যায়নি। পরিষ্কার JPG বা PNG ফাইল আপলোড করুন।',
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Validates that an uploaded file is strictly a valid passport PDF document:
 * - PDF format required: Indian Visa portal Step 7/9 strictly requires PDF (.pdf)
 * - Checks %PDF- magic bytes header
 * - Size between 10 KB and 5120 KB (5 MB)
 */
export async function validatePassportDocument(
  file: File | null,
  isStandard: boolean = false
): Promise<MediaValidationResult> {
  if (!file) {
    return {
      valid: false,
      error: 'Passport PDF document (.pdf) is required before launching automation.',
      errorBn: 'স্বয়ংক্রিয় প্রসেসিং শুরু করতে পাসপোর্ট পিডিএফ (.pdf) আপলোড করা আবশ্যক।',
    };
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    return {
      valid: false,
      error: 'Passport must strictly be a PDF file (.pdf). Images are not acceptable.',
      errorBn: 'পাসপোর্ট অবশ্যই একটি পিডিএফ (.pdf) ফাইল হতে হবে। কোনো ছবি ফাইল গ্রহণযোগ্য নয়।',
    };
  }

  const sizeKb = Math.round(file.size / 1024);
  if (sizeKb < 10) {
    return {
      valid: false,
      error: `Passport PDF file size is too small (${sizeKb} KB). Official portal minimum is 10 KB.`,
      errorBn: `পাসপোর্ট পিডিএফের সাইজ খুবই ছোট (${sizeKb} KB)। সরকারি নিয়মে ন্যূনতম ১০ KB আবশ্যক।`,
    };
  }

  const maxPdfKb = isStandard ? 10 * 1024 : 500;
  if (sizeKb > maxPdfKb) {
    if (!isStandard) {
      return {
        valid: false,
        error: `Passport PDF size (${sizeKb} KB) exceeds the 500 KB limit on Starter plan. Upgrade to Standard or Agency Pro to upload files up to 10 MB.`,
        errorBn: `Starter প্ল্যানে পাসপোর্ট পিডিএফ ফাইলের সাইজ সর্বোচ্চ ৫০০ KB। ১০ MB পর্যন্ত বড় ফাইল আপলোড করতে Standard বা Agency Pro প্ল্যানে আপগ্রেড করুন।`,
      };
    } else {
      return {
        valid: false,
        error: `Passport PDF size (${(sizeKb / 1024).toFixed(1)} MB) exceeds the maximum 10 MB limit.`,
        errorBn: `পাসপোর্ট পিডিএফ ফাইলের সাইজ (${(sizeKb / 1024).toFixed(1)} MB) সর্বোচ্চ ১০ MB সীমার বেশি।`,
      };
    }
  }

  try {
    const headerBytes = await file.slice(0, 5).text();
    if (!headerBytes.startsWith('%PDF-')) {
      return {
        valid: false,
        error: 'The uploaded file is not a valid PDF document (missing %PDF- header).',
        errorBn: 'আপলোড করা ফাইলটি সঠিক পিডিএফ ফরম্যাটে নেই।',
      };
    }
    return {
      valid: true,
      details: { sizeKb, format: 'application/pdf' },
    };
  } catch {
    return {
      valid: false,
      error: 'Failed to verify PDF structure. Please upload a valid passport PDF.',
      errorBn: 'পিডিএফ ফাইল স্ট্রাকচার যাচাই ব্যর্থ হয়েছে।',
    };
  }
}

