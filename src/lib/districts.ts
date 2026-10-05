export const BANGLADESH_64_DISTRICTS = [
  // Dhaka Division
  'DHAKA', 'FARIDPUR', 'GAZIPUR', 'GOPALGANJ', 'KISHOREGANJ',
  'MADARIPUR', 'MANIKGANJ', 'MUNSHIGANJ', 'NARAYANGANJ', 'NARSINGDI',
  'RAJBARI', 'SHARIATPUR', 'TANGAIL',
  // Chittagong Division
  'BANDARBAN', 'BRAHMANBARIA', 'CHANDPUR', 'CHITTAGONG', 'CHATTOGRAM',
  'COMILLA', 'CUMILLA', 'COXS BAZAR', "COX'S BAZAR", 'FENI',
  'KHAGRACHARI', 'LAKSHMIPUR', 'NOAKHALI', 'RANGAMATI',
  // Rajshahi Division
  'BOGRA', 'BOGURA', 'CHAPAINAWABGANJ', 'NAWABGANJ', 'JOYPURHAT',
  'NAOGAON', 'NATORE', 'PABNA', 'RAJSHAHI', 'SIRAJGANJ',
  // Khulna Division
  'BAGERHAT', 'CHUADANGA', 'JESSORE', 'JASHORE', 'JHENAIDAH',
  'KHULNA', 'KUSHTIA', 'MAGURA', 'MEHERPUR', 'NARAIL', 'SATKHIRA',
  // Barisal Division
  'BARGUNA', 'BARISAL', 'BARISHAL', 'BHOLA', 'JHALOKATI', 'JHALAKATHI',
  'PATUAKHALI', 'PIROJPUR',
  // Sylhet Division
  'HABIGANJ', 'MAULVIBAZAR', 'MOULVIBAZAR', 'SUNAMGANJ', 'SYLHET',
  // Rangpur Division
  'DINAJPUR', 'GAIBANDHA', 'KURIGRAM', 'LALMONIRHAT', 'NILPHAMARI',
  'PANCHAGARH', 'RANGPUR', 'THAKURGAON',
  // Mymensingh Division
  'JAMALPUR', 'MYMENSINGH', 'NETROKONA', 'SHERPUR',
] as const;

export function findDistrictFromText(text: string): string {
  if (!text) return 'DHAKA';
  const upper = text.toUpperCase();

  // Match longer names first to avoid partial conflicts
  const sorted = [...BANGLADESH_64_DISTRICTS].sort((a, b) => b.length - a.length);
  for (const d of sorted) {
    // Word boundary check
    const regex = new RegExp(`\\b${d.replace(/['’]/g, "['’]?")}\\b`, 'i');
    if (regex.test(upper)) {
      // Normalize variant spellings to Indian visa portal standard
      if (d === 'CHATTOGRAM') return 'CHITTAGONG';
      if (d === 'CUMILLA') return 'COMILLA';
      if (d === 'BOGURA') return 'BOGRA';
      if (d === 'JASHORE') return 'JESSORE';
      if (d === 'BARISHAL') return 'BARISAL';
      if (d === 'MOULVIBAZAR') return 'MAULVIBAZAR';
      if (d === 'COXS BAZAR' || d === "COX'S BAZAR") return "COX'S BAZAR";
      return d;
    }
  }
  return 'DHAKA';
}
