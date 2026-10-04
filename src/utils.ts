export const getIndonesianDayName = (dayIndex: number): string => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dayIndex];
};

export const getIndonesianMonthName = (monthIndex: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex] || '';
};

export const formatDateIndonesian = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = getIndonesianMonthName(monthIndex);
  const month = monthName ? monthName.substring(0, 3) : '';
  return `${day} ${month} ${year}`;
};

export const formatFullDateIndonesian = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = getIndonesianMonthName(monthIndex);
  return `${day} ${monthName} ${year}`;
};

export const getHolidayInfo = (dateStr: string): { isHoliday: boolean; name: string } | null => {
  const holidays: Record<string, string> = {
    // 2024 National Holidays
    '2024-01-01': 'Tahun Baru 2024 Masehi',
    '2024-02-08': 'Isra Mikraj Nabi Muhammad SAW',
    '2024-02-09': 'Cuti Bersama Tahun Baru Imlek',
    '2024-02-10': 'Tahun Baru Imlek 2575 Kongzili',
    '2024-03-11': 'Hari Suci Nyepi Tahun Baru Saka 1946',
    '2024-03-12': 'Cuti Bersama Hari Suci Nyepi',
    '2024-03-29': 'Wafat Isa Al Masih',
    '2024-03-31': 'Hari Paskah',
    '2024-04-08': 'Cuti Bersama Idul Fitri',
    '2024-04-09': 'Cuti Bersama Idul Fitri',
    '2024-04-10': 'Hari Raya Idul Fitri 1445 Hijriah',
    '2024-04-11': 'Hari Raya Idul Fitri 1445 Hijriah',
    '2024-04-12': 'Cuti Bersama Idul Fitri',
    '2024-04-15': 'Cuti Bersama Idul Fitri',
    '2024-05-01': 'Hari Buruh Internasional',
    '2024-05-09': 'Kenaikan Isa Al Masih',
    '2024-05-10': 'Cuti Bersama Kenaikan Isa Al Masih',
    '2024-05-23': 'Hari Raya Waisak 2568 BE',
    '2024-05-24': 'Cuti Bersama Waisak',
    '2024-06-01': 'Hari Lahir Pancasila',
    '2024-06-17': 'Hari Raya Idul Adha 1445 Hijriah',
    '2024-06-18': 'Cuti Bersama Idul Adha',
    '2024-07-07': 'Tahun Baru Islam 1446 Hijriah',
    '2024-08-17': 'Hari Kemerdekaan RI',
    '2024-09-16': 'Maulid Nabi Muhammad SAW',
    '2024-12-25': 'Hari Raya Natal',
    '2024-12-26': 'Cuti Bersama Hari Raya Natal',
    
    // 2025 National Holidays (Estimates & some confirmed)
    '2025-01-01': 'Tahun Baru 2025 Masehi',
    '2025-01-27': 'Isra Mikraj Nabi Muhammad SAW',
    '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
    '2025-03-29': 'Hari Suci Nyepi Tahun Baru Saka 1947',
    '2025-03-31': 'Hari Raya Idul Fitri 1446 Hijriah',
    '2025-04-01': 'Hari Raya Idul Fitri 1446 Hijriah',
    '2025-04-18': 'Wafat Yesus Kristus',
    '2025-04-20': 'Hari Paskah',
    '2025-05-01': 'Hari Buruh Internasional',
    '2025-05-12': 'Hari Raya Waisak 2569 BE',
    '2025-05-29': 'Kenaikan Yesus Kristus',
    '2025-06-01': 'Hari Lahir Pancasila',
    '2025-06-06': 'Hari Raya Idul Adha 1446 Hijriah',
    '2025-06-27': 'Tahun Baru Islam 1447 Hijriah',
    '2025-08-17': 'Hari Kemerdekaan RI',
    '2025-09-05': 'Maulid Nabi Muhammad SAW',
    '2025-12-25': 'Hari Raya Natal',

    // 2026 National Holidays (Estimates)
    '2026-01-01': 'Tahun Baru 2026 Masehi',
    '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW',
    '2026-02-17': 'Tahun Baru Imlek',
    '2026-03-19': 'Hari Suci Nyepi',
    '2026-03-20': 'Hari Raya Idul Fitri 1447 Hijriah',
    '2026-03-21': 'Hari Raya Idul Fitri 1447 Hijriah',
    '2026-04-03': 'Wafat Yesus Kristus',
    '2026-05-01': 'Hari Buruh Internasional',
    '2026-05-14': 'Kenaikan Yesus Kristus',
    '2026-05-27': 'Hari Raya Idul Adha 1447 Hijriah',
    '2026-05-31': 'Hari Raya Waisak',
    '2026-06-01': 'Hari Lahir Pancasila',
    '2026-06-16': 'Tahun Baru Islam 1448 Hijriah',
    '2026-08-17': 'Hari Kemerdekaan RI',
    '2026-08-25': 'Maulid Nabi Muhammad SAW',
    '2026-12-25': 'Hari Raya Natal'
  };

  if (holidays[dateStr]) {
    return { isHoliday: true, name: holidays[dateStr] };
  }

  // Kalender Pendidikan Provinsi Jawa Barat (Prakiraan dan Ketetapan)
  const date = new Date(dateStr);
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  const year = date.getFullYear();

  if (year === 2024) {
    if (month === 11 && day >= 23) return { isHoliday: true, name: 'Libur Semester Ganjil' }; // 23 Des 2024 - Akhir
  }
  
  if (year === 2025) {
    if (month === 0 && day <= 4) return { isHoliday: true, name: 'Libur Semester Ganjil' }; // Awal Jan - 4 Jan 2025
    if (month === 1 && day === 28) return { isHoliday: true, name: 'Libur Awal Ramadhan 1446 H' }; // 28 Feb 2025
    if (month === 2 && day <= 2) return { isHoliday: true, name: 'Libur Awal Ramadhan 1446 H' }; // 1-2 Mar 2025
    if (month === 2 && day >= 24) return { isHoliday: true, name: 'Libur Idul Fitri 1446 H' }; // 24 Mar - 31 Mar 2025
    if (month === 3 && day <= 7) return { isHoliday: true, name: 'Libur Idul Fitri 1446 H' }; // 1 Apr - 7 Apr 2025
    if (month === 5 && day >= 23) return { isHoliday: true, name: 'Libur Akhir Tahun Pelajaran' }; // 23 Juni - Akhir 2025
    if (month === 6 && day <= 12) return { isHoliday: true, name: 'Libur Akhir Tahun Pelajaran' }; // 1 - 12 Juli 2025
    if (month === 11 && day >= 22) return { isHoliday: true, name: 'Libur Semester Ganjil' }; // Akhir Des 2025
  }
  
  if (year === 2026) {
    if (month === 0 && day <= 3) return { isHoliday: true, name: 'Libur Semester Ganjil' }; // Awal Jan 2026
    if (month === 1 && (day >= 16 && day <= 18)) return { isHoliday: true, name: 'Libur Awal Ramadhan 1447 H' }; // Estimasi 16-18 Feb 2026
    if (month === 2 && (day >= 14 && day <= 28)) return { isHoliday: true, name: 'Libur Idul Fitri 1447 H' }; // Estimasi 14-28 Mar 2026
    if (month === 5 && day >= 22) return { isHoliday: true, name: 'Libur Akhir Tahun Pelajaran' }; // Akhir Juni 2026
    if (month === 6 && day <= 11) return { isHoliday: true, name: 'Libur Akhir Tahun Pelajaran' }; // Awal Juli 2026
    if (month === 11 && day >= 21) return { isHoliday: true, name: 'Libur Semester Ganjil' }; // Akhir Des 2026
  }

  // Fallback (Prakiraan umum) untuk tahun lainnya
  if (year > 2026 || year < 2024) {
    if ((month === 11 && day >= 23) || (month === 0 && day <= 5)) {
      return { isHoliday: true, name: 'Libur Semester Ganjil' };
    }
    if ((month === 5 && day >= 23) || (month === 6 && day <= 13)) {
      return { isHoliday: true, name: 'Libur Akhir Tahun Pelajaran' };
    }
  }

  return null;
};

export const generateMonthEntries = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const entries = [];
  
  while (date.getMonth() === month) {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    const holidayInfo = getHolidayInfo(dateStr);
    const isHoliday = isWeekend || holidayInfo !== null;
    let desc = '';
    
    if (holidayInfo) {
      desc = holidayInfo.name;
    } else if (isWeekend) {
      desc = 'Libur Akhir Pekan';
    }
    
    entries.push({
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      date: dateStr,
      dayName: getIndonesianDayName(date.getDay()),
      duration: isHoliday ? '-' : '450 menit',
      description: desc,
      photo: null,
      isHoliday: isHoliday,
    });
    
    date.setDate(date.getDate() + 1);
  }
  
  return entries;
};

export const resizeImage = (file: File, maxWidth: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
