import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Camera, 
  Sparkles, 
  AlertCircle, 
  Award, 
  CalendarDays,
  Briefcase,
  Building,
  CheckCircle,
  HelpCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { ReportEntry, ReportMetadata } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdminDashboardProps {
  metadata: ReportMetadata;
  entries: ReportEntry[];
}

// Custom Tooltip component for the daily monthly trend chart
const CustomDailyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 max-w-xs">
        <p className="font-bold text-slate-800 text-sm">{data.fullLabel}</p>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${data.isHoliday ? 'bg-slate-400' : data.isFilled ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <span className="text-slate-500 font-medium">Status:</span>
          <span className="font-semibold text-slate-800">
            {data.isHoliday ? 'Hari Libur / Weekend' : data.isFilled ? 'Terisi (Selesai)' : 'Belum Diisi (Pending)'}
          </span>
        </div>
        {!data.isHoliday && data.isFilled && (
          <>
            <div className="flex items-center justify-between gap-4 mt-1 border-t border-slate-100 pt-1.5">
              <span className="text-slate-500">Jam Kerja:</span>
              <strong className="text-slate-850 font-mono text-[13px]">{data.hours} jam</strong>
            </div>
            {data.description && (
              <div className="pt-1.5 border-t border-slate-100">
                <span className="text-slate-500 block mb-0.5">Uraian Kegiatan:</span>
                <p className="text-slate-700 italic line-clamp-2 leading-relaxed bg-slate-50 p-1.5 rounded">{data.description}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 pt-1">
              <span className="text-slate-500">Kategori:</span>
              <strong className="text-slate-800">{data.category}</strong>
            </div>
          </>
        )}
      </div>
    );
  }
  return null;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ metadata, entries }) => {
  const [activeMetric, setActiveMetric] = useState<'hours' | 'entries'>('hours');
  
  const workingDays = entries.filter(e => !e.isHoliday);
  const holidayDays = entries.filter(e => e.isHoliday);
  const completedDays = workingDays.filter(e => e.description && e.description.trim() !== '');
  const pendingDays = workingDays.length - completedDays.length;
  
  const completionRate = workingDays.length > 0 ? Math.round((completedDays.length / workingDays.length) * 100) : 0;
  
  const entriesWithPhoto = workingDays.filter(e => e.photo && e.photo.trim() !== '');
  const photoRate = workingDays.length > 0 ? Math.round((entriesWithPhoto.length / workingDays.length) * 100) : 0;

  const totalMinutes = workingDays.reduce((acc, curr) => {
    const match = curr.duration.match(/\d+/);
    const mins = match ? parseInt(match[0], 10) : 0;
    return acc + (isNaN(mins) ? 0 : mins);
  }, 0);
  
  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const avgMinutesPerDay = completedDays.length > 0 ? Math.round(totalMinutes / completedDays.length) : 0;
  const avgHoursPerDay = (avgMinutesPerDay / 60).toFixed(1);

  // Calculate category counts
  let mengajarCount = 0;
  let adminCount = 0;
  let pelatihanCount = 0;
  let lainnyaCount = 0;

  workingDays.forEach(entry => {
    if (!entry.description || entry.description.trim() === '') return;
    if (entry.taskCategory === 'Mengajar/Pendidikan') mengajarCount++;
    else if (entry.taskCategory === 'Administrasi/Manajerial') adminCount++;
    else if (entry.taskCategory === 'Pelatihan/Pengembangan') pelatihanCount++;
    else lainnyaCount++;
  });

  // Calculate weekly category stats for BarChart
  const weeklyData = [];
  let currentWeek = { name: 'Minggu 1', Mengajar: 0, Administrasi: 0, Pelatihan: 0, Lainnya: 0 };
  let dayCount = 0;
  
  workingDays.forEach(entry => {
    if (dayCount > 0 && dayCount % 5 === 0) {
      weeklyData.push(currentWeek);
      currentWeek = { name: `Minggu ${weeklyData.length + 1}`, Mengajar: 0, Administrasi: 0, Pelatihan: 0, Lainnya: 0 };
    }
    
    if (entry.taskCategory === 'Mengajar/Pendidikan') currentWeek.Mengajar++;
    else if (entry.taskCategory === 'Administrasi/Manajerial') currentWeek.Administrasi++;
    else if (entry.taskCategory === 'Pelatihan/Pengembangan') currentWeek.Pelatihan++;
    else if (entry.taskCategory && entry.taskCategory.trim() !== '') currentWeek.Lainnya++;
    
    dayCount++;
  });
  if (dayCount % 5 !== 0 || weeklyData.length === 0) {
    weeklyData.push(currentWeek);
  }

  // Calculate daily data sorted chronologically for the monthly trend chart
  const dailyData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(entry => {
      const dateParts = entry.date.split('-');
      const dayNum = dateParts.length === 3 ? parseInt(dateParts[2], 10) : '';
      
      const isFilled = entry.description && entry.description.trim() !== '';
      const entryCount = isFilled ? 1 : 0;
      
      const minsMatch = entry.duration ? entry.duration.match(/\d+/) : null;
      const mins = minsMatch ? parseInt(minsMatch[0], 10) : 0;
      const hoursVal = isFilled && !entry.isHoliday ? parseFloat((mins / 60).toFixed(1)) : 0;
      
      return {
        date: entry.date,
        dayNum: dayNum,
        dayLabel: dayNum ? `${dayNum}` : entry.date,
        fullLabel: `${entry.dayName}, ${dayNum} ${metadata.reportMonth || ''}`,
        hours: hoursVal,
        entryCount: entryCount,
        isHoliday: entry.isHoliday,
        isFilled: isFilled,
        description: entry.description,
        category: entry.taskCategory || 'Lainnya'
      };
    });

  return (
    <div className="w-full h-full bg-[#f8f9fa] p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Context */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Admin & Insight Laporan</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                completionRate === 100 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}>
                {completionRate === 100 ? 'Laporan Lengkap' : 'Progres Aktif'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span>{metadata.school || 'Instansi/Sekolah'}</span>
              <span className="text-slate-300">•</span>
              <Users className="w-4 h-4 text-slate-400" />
              <span>{metadata.employeeName || 'Pegawai'} ({metadata.reporterNip || 'NIP -'})</span>
            </p>
          </div>
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="bg-purple-50 border border-purple-100 px-4 py-2 rounded-xl text-right">
              <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Periode Laporan</p>
              <p className="text-sm font-bold text-purple-900 flex items-center justify-end gap-1.5 mt-0.5">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                {metadata.reportMonth}
              </p>
            </div>
          </div>
        </div>

        {/* Highlight Summary Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Stat Card 1: Total Jam Kerja */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Jam Kerja</span>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-slate-800">{hours}j {remainingMins > 0 ? `${remainingMins}m` : ''}</p>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ~{avgHoursPerDay}j / hari
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Target standar: 150+ Jam/Bulan</span>
            </p>
          </div>

          {/* Stat Card 2: Jumlah Entri Terisi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entri Terisi</span>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-slate-800">{completedDays.length} / {workingDays.length}</p>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                Hari Kerja
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              {pendingDays === 0 ? (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Semua hari terisi
                </span>
              ) : (
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {pendingDays} hari belum terisi
                </span>
              )}
            </p>
          </div>

          {/* Stat Card 3: Persentase Penyelesaian */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Persentase Selesai</span>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-slate-800">{completionRate}%</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                completionRate === 100 ? 'bg-emerald-100 text-emerald-800' : completionRate >= 75 ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {completionRate === 100 ? 'Siap Cetak' : completionRate >= 75 ? 'Hampir Selesai' : 'Perlu Diisi'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  completionRate === 100 ? 'bg-emerald-500' : completionRate >= 75 ? 'bg-indigo-600' : 'bg-amber-500'
                }`} 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
          </div>

          {/* Stat Card 4: Dokumentasi / Foto */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dokumentasi Foto</span>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-slate-800">{entriesWithPhoto.length} Foto</p>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                {photoRate}% Terlampir
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Bukti fisik kegiatan harian</span>
            </p>
          </div>

        </div>

        {/* Visual Progress Breakdown & Smart Insight Component */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600" /> Breakdown Keterisian & Rekomendasi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Analisis keterisian entri harian bulan {metadata.reportMonth}</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Terisi: {completedDays.length} Hari
              </span>
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Belum Terisi: {pendingDays} Hari
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Libur: {holidayDays.length} Hari
              </span>
            </div>
          </div>

          {/* Segmented Visual Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
              {workingDays.length > 0 && (
                <>
                  <div 
                    style={{ width: `${(completedDays.length / (workingDays.length + holidayDays.length)) * 100}%` }} 
                    className="bg-emerald-500 h-full rounded-l-full transition-all"
                    title={`Terisi: ${completedDays.length} hari`}
                  />
                  <div 
                    style={{ width: `${(pendingDays / (workingDays.length + holidayDays.length)) * 100}%` }} 
                    className="bg-amber-400 h-full transition-all"
                    title={`Belum Terisi: ${pendingDays} hari`}
                  />
                </>
              )}
              {holidayDays.length > 0 && (
                <div 
                  style={{ width: `${(holidayDays.length / (workingDays.length + holidayDays.length)) * 100}%` }} 
                  className="bg-slate-300 h-full rounded-r-full transition-all"
                  title={`Hari Libur: ${holidayDays.length} hari`}
                />
              )}
            </div>
          </div>

          {/* Insight Recommendation Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            completionRate === 100 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
              : pendingDays > 0 
                ? 'bg-purple-50/80 border-purple-200 text-purple-900' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="p-2 bg-white/80 rounded-lg shadow-2xs shrink-0 mt-0.5">
              {completionRate === 100 ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
              )}
            </div>
            <div className="text-xs leading-relaxed flex-1">
              {completionRate === 100 ? (
                <div>
                  <p className="font-bold text-sm text-emerald-950">Laporan Kinerja Siap Diexport & Dicetak!</p>
                  <p className="mt-0.5 text-emerald-800">
                    Semua {workingDays.length} hari kerja telah terisi dengan uraian pekerjaan dan durasi. Anda dapat mengunduh dokumen versi <strong>Word (.docx)</strong>, <strong>PDF</strong>, atau <strong>Excel</strong> langsung dari menu atas.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-sm text-purple-950">
                    Progres Laporan: {completionRate}% ({completedDays.length} dari {workingDays.length} Hari Kerja Terisi)
                  </p>
                  <p className="mt-0.5 text-purple-800">
                    Masih terdapat <strong>{pendingDays} hari kerja</strong> yang belum memiliki uraian kegiatan. Buka menu <strong>Editor Laporan Kinerja</strong> lalu klik tombol <strong>"Auto-Generate AI"</strong> untuk mengisi uraian kegiatan harian secara otomatis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Monthly Daily Trend Chart Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Tren Aktivitas & Jam Kerja Harian Sebulan
              </h3>
              <p className="text-xs text-slate-500 mt-1">Grafik progres harian untuk mendeteksi konsistensi pelaporan dan beban kerja harian</p>
            </div>
            
            {/* Metric Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveMetric('hours')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  activeMetric === 'hours'
                    ? 'bg-white text-purple-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jam Kerja (Jam)
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('entries')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  activeMetric === 'entries'
                    ? 'bg-white text-purple-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Keterisian Entri (Status)
              </button>
            </div>
          </div>

          {/* Chart Display */}
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="dayLabel" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                  allowDecimals={activeMetric === 'hours'}
                  domain={activeMetric === 'hours' ? [0, 'auto'] : [0, 1]}
                  ticks={activeMetric === 'entries' ? [0, 1] : undefined}
                  tickFormatter={(val) => {
                    if (activeMetric === 'entries') {
                      return val === 1 ? 'Terisi' : 'Kosong';
                    }
                    return `${val}j`;
                  }}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Bar 
                  dataKey={activeMetric === 'hours' ? 'hours' : 'entryCount'} 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                >
                  {dailyData.map((entry, index) => {
                    // Let's color-code each bar beautifully
                    let barColor = '#8b5cf6'; // default purple
                    
                    if (entry.isHoliday) {
                      barColor = '#cbd5e1'; // light slate for holiday
                    } else if (!entry.isFilled) {
                      barColor = '#f59e0b'; // amber for missing/empty
                    } else {
                      // Filled work day
                      if (activeMetric === 'hours') {
                        barColor = '#10b981'; // emerald for hours
                      } else {
                        barColor = '#6366f1'; // indigo for filled status
                      }
                    }
                    
                    return <rect key={`bar-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Color Legend & Insights */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-3 rounded bg-[#10b981]" /> Hari Kerja Terisi (Jam Kerja)
              </span>
              {activeMetric === 'entries' && (
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="w-3 h-3 rounded bg-[#6366f1]" /> Hari Kerja Terisi (Status)
                </span>
              )}
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-3 rounded bg-[#f59e0b]" /> Hari Kerja Kosong / Belum Diisi
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-3 h-3 rounded bg-[#cbd5e1]" /> Hari Libur (Weekend / Cuti)
              </span>
            </div>
            
            <div className="font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded">
              * Arahkan kursor pada batang grafik untuk melihat ulasan detail harian
            </div>
          </div>
        </div>

        {/* Charts & Category Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Produktivitas Mingguan Berdasarkan Kategori</h2>
                <p className="text-xs text-slate-500 mt-0.5">Distribusi tugas kerja pegawai setiap minggu</p>
              </div>
            </div>
            <div className="p-4 h-[300px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Mengajar" stackId="a" fill="#6f42c1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Administrasi" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Pelatihan" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Lainnya" stackId="a" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Employee Overview & Category Counts */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col space-y-4 p-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800">Rincian Pegawai & Kategori</h2>
              <p className="text-xs text-slate-500 mt-0.5">Profil pelapor dan ringkasan jenis tugas</p>
            </div>

            {/* Employee Info Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                  {metadata.employeeName ? metadata.employeeName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-slate-900 truncate">{metadata.employeeName || 'Pegawai SIPERJA'}</p>
                  <p className="text-xs text-slate-500 truncate">{metadata.jobTitle || 'Guru / Tenaga Pendidik'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">NIP Pelapor:</span>
                  <span className="font-mono font-semibold text-slate-800">{metadata.reporterNip || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Atasan Langsung:</span>
                  <span className="font-semibold text-slate-800 truncate block">{metadata.principalName || '-'}</span>
                </div>
              </div>
            </div>

            {/* Category Summary List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Distribusi Kategori Kegiatan</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-purple-50 text-purple-900 rounded-lg border border-purple-100 flex items-center justify-between">
                  <span className="font-medium">Mengajar</span>
                  <span className="font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-[11px]">{mengajarCount}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span className="font-medium">Administrasi</span>
                  <span className="font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full text-[11px]">{adminCount}</span>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-100 flex items-center justify-between">
                  <span className="font-medium">Pelatihan</span>
                  <span className="font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-[11px]">{pelatihanCount}</span>
                </div>
                <div className="p-2.5 bg-cyan-50 text-cyan-900 rounded-lg border border-cyan-100 flex items-center justify-between">
                  <span className="font-medium">Lainnya</span>
                  <span className="font-bold bg-cyan-200 text-cyan-800 px-2 py-0.5 rounded-full text-[11px]">{lainnyaCount}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

