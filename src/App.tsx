import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Printer, FileSpreadsheet, FileText, LayoutDashboard, Edit, Camera, Menu, X, Calendar as CalendarIcon, LogOut, Database, Settings, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ReportMetadata, ReportEntry } from './types';
import { generateMonthEntries, formatDateIndonesian } from './utils';
import { ReportPreview } from './components/ReportPreview';
import { EditorPanel } from './components/EditorPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { DailyAttendance } from './components/DailyAttendance';
import { exportToWord } from './wordExport';
import { initAuth, googleSignIn, getAccessToken, logout } from './firebase';
import { User } from 'firebase/auth';

import { SettingsPanel } from './components/SettingsPanel';
import { ReportRecap } from './components/ReportRecap';
import { LandingPage } from './components/LandingPage';

const DEFAULT_METADATA: ReportMetadata = {
  title: 'LAPORAN KINERJA HARIAN NON ASN TENAGA KEPENDIDIKAN',
  school: 'SMA NEGERI 1 LUMBUNG',
  branch: 'CABANG DINAS PENDIDIKAN WILAYAH XIII',
  employeeName: 'Virga Mahardhika Koswara, S.T',
  jobTitle: 'Tenaga Kependidikan / IT Sekolah',
  reportMonth: 'Januari 2026',
  principalName: 'Dedeh Komariah, S.Pd',
  principalNip: '',
  reporterName: 'Virga Mahardhika K., S.T., Gr.',
  reporterNip: '-',
  reportDate: '30 JANUARI 2026'
};

export default function App() {
  const [metadata, setMetadata] = useState<ReportMetadata>(() => {
    try {
      const saved = localStorage.getItem('report_metadata');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_METADATA, ...parsed };
        }
      }
      return DEFAULT_METADATA;
    } catch (e) {
      return DEFAULT_METADATA;
    }
  });

  const [entries, setEntries] = useState<ReportEntry[]>(() => {
    try {
      const saved = localStorage.getItem('report_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse entries', e);
    }
    const now = new Date();
    return generateMonthEntries(now.getFullYear(), now.getMonth());
  });

  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setToken(token);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        toast.success('Berhasil login dengan Google!');
      }
    } catch (err) {
      console.error('Login failed:', err);
      toast.error('Gagal login dengan Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Berhasil logout.');
  };

  const syncGoogleCalendar = async () => {
    if (!token) {
      toast.error("Harap login dengan Google terlebih dahulu.");
      return;
    }
    
    const toastId = toast.loading("Menyinkronkan kalender hari libur nasional...");
    try {
      if (entries.length === 0) {
        toast.error("Belum ada data entri laporan.", { id: toastId });
        return;
      }
      const startDate = new Date(entries[0].date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(entries[entries.length - 1].date);
      endDate.setHours(23, 59, 59, 999);

      const calendarId = encodeURIComponent('en.indonesian#holiday@group.v.calendar.google.com');
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch holiday calendar");
      }
      
      const data = await res.json();
      const events = data.items || [];
      
      const holidayDates = new Map();
      events.forEach((evt: any) => {
        if (evt.start && evt.start.date) {
           holidayDates.set(evt.start.date, evt.summary);
        }
      });
      
      if (holidayDates.size > 0) {
        setEntries(prev => prev.map(entry => {
           if (holidayDates.has(entry.date)) {
             return { ...entry, isHoliday: true, name: holidayDates.get(entry.date) };
           }
           return entry;
        }));
        toast.success(`Berhasil menyinkronkan ${holidayDates.size} hari libur nasional!`, { id: toastId });
      } else {
        toast("Tidak ada hari libur nasional yang ditemukan pada bulan ini.", { id: toastId, icon: 'ℹ️' });
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil data dari Google Calendar.", { id: toastId });
    }
  };

  useEffect(() => {
    localStorage.setItem('report_metadata', JSON.stringify(metadata));
  }, [metadata]);

  useEffect(() => {
    localStorage.setItem('report_entries', JSON.stringify(entries));
  }, [entries]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'laporan' | 'absensi' | 'rekap' | 'pengaturan'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [exportOrientation, setExportOrientation] = useState<'portrait' | 'landscape'>(() => {
    return (localStorage.getItem('export_orientation') as 'portrait' | 'landscape') || 'landscape';
  });

  useEffect(() => {
    localStorage.setItem('export_orientation', exportOrientation);
  }, [exportOrientation]);

  const handleGenerateMonth = (year: number, month: number) => {
    const newEntries = generateMonthEntries(year, month);
    setEntries(newEntries);
    const monthName = new Date(year, month).toLocaleString('id-ID', { month: 'long' });
    setMetadata(prev => ({ ...prev, reportMonth: `${monthName} ${year}` }));
    toast.success(`Daftar entri laporan bulan ${monthName} ${year} berhasil digenerate.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const toastId = toast.loading('Memproses dokumen PDF...');
    try {
      const element = document.getElementById('report-preview-container');
      if (!element) {
        toast.error('Elemen pratinjau laporan tidak ditemukan.', { id: toastId });
        return;
      }
      
      const html2pdf = (await import('@digivorefr/html2pdf.js')).default;
      const opt: any = {
        margin:       [10, 10, 10, 10],
        filename:     `Laporan_${metadata.employeeName.replace(/\s+/g, '_')}_${metadata.reportMonth.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: exportOrientation }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success('Dokumen PDF berhasil diunduh!', { id: toastId });
    } catch (e) {
      console.error('Failed to generate PDF:', e);
      toast.error('Gagal membuat PDF. Pastikan koneksi internet stabil.', { id: toastId });
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDatabase = async () => {
    const toastId = toast.loading('Menyimpan laporan ke database...');
    try {
      setIsSaving(true);
      const { db, collection, addDoc, serverTimestamp } = await import('./firebase');
      await addDoc(collection(db, 'reports'), {
        metadata,
        entries,
        createdAt: serverTimestamp()
      });
      toast.success('Laporan berhasil disimpan ke database!', { id: toastId });
    } catch (error: any) {
      console.error('Error saving document: ', error);
      toast.error(`Gagal menyimpan laporan ke database: ${error.message}`, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    const headerStyle = "background-color: #e6f0fa; border: 1px solid black; font-weight: bold; text-align: center;";
    const borderStyle = "border: 1px solid black;";
    
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Laporan Kinerja</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          td, th { border: 0.5pt solid black; font-family: 'Times New Roman', serif; font-size: 11pt; padding: 5px; }
          .header { font-weight: bold; text-align: center; font-size: 12pt; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="7" class="header" style="border:none; text-align:center; font-weight:bold;">${metadata.title}</td></tr>
          <tr><td colspan="7" class="header" style="border:none; text-align:center; font-weight:bold;">${metadata.school}</td></tr>
          <tr><td colspan="7" class="header" style="border:none; text-align:center; font-weight:bold;">${metadata.branch}</td></tr>
          <tr><td colspan="7" style="border:none;">&nbsp;</td></tr>
          <tr>
            <td style="border:none; font-weight:bold;">NAMA</td>
            <td style="border:none; font-weight:bold;" colspan="6">: ${metadata.employeeName}</td>
          </tr>
          <tr>
            <td style="border:none; font-weight:bold;">BULAN</td>
            <td style="border:none; font-weight:bold;" colspan="6">: ${metadata.reportMonth}</td>
          </tr>
          <tr><td colspan="7" style="border:none;">&nbsp;</td></tr>
          <tr style="background-color: #e6f0fa;">
            <th style="${headerStyle}">NO</th>
            <th style="${headerStyle}">HARI</th>
            <th style="${headerStyle}">TANGGAL</th>
            <th style="${headerStyle}">WAKTU MULAI</th>
            <th style="${headerStyle}">URAIAN PEKERJAAN</th>
            <th style="${headerStyle}">FOTO</th>
            <th style="${headerStyle}">PARAF</th>
          </tr>
    `;

    entries.forEach((entry, index) => {
      const isHolidayColor = entry.isHoliday ? "background-color: #d1d5db;" : "";
      html += `
        <tr style="${isHolidayColor}">
          <td style="${borderStyle} text-align: center;">${index + 1}</td>
          <td style="${borderStyle}">${entry.dayName}</td>
          <td style="${borderStyle}">${formatDateIndonesian(entry.date)}</td>
          <td style="${borderStyle} text-align: center;">${entry.duration}</td>
          <td style="${borderStyle}">${entry.description || ''}</td>
          <td style="${borderStyle} text-align: center;">${entry.photo ? '[Ada Foto]' : (entry.isHoliday ? '-' : '')}</td>
          <td style="${borderStyle} text-align: center;">-</td>
        </tr>
      `;
    });

    html += `
          <tr><td colspan="7" style="border:none;">&nbsp;</td></tr>
          <tr>
            <td colspan="3" style="border:none; vertical-align: top;">KEPALA SEKOLAH</td>
            <td style="border:none;">&nbsp;</td>
            <td colspan="3" style="border:none; vertical-align: top;">
              ${metadata.reportDate}<br>
              PELAPOR
            </td>
          </tr>
          <tr><td colspan="7" style="border:none; height: 40px;">&nbsp;</td></tr>
          <tr>
            <td colspan="3" style="border:none; font-weight:bold; text-decoration: underline;">${metadata.principalName}</td>
            <td style="border:none;">&nbsp;</td>
            <td colspan="3" style="border:none; font-weight:bold; text-decoration: underline;">${metadata.reporterName}</td>
          </tr>
          <tr>
            <td colspan="3" style="border:none;">NIP. ${metadata.principalNip || '-'}</td>
            <td style="border:none;">&nbsp;</td>
            <td colspan="3" style="border:none;">NIP. ${metadata.reporterNip || '-'}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Kinerja_${metadata.employeeName.replace(/\s+/g, '_')}_${metadata.reportMonth.replace(/\s+/g, '_')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('File Excel berhasil diunduh!');
  };

  const handleExportWord = async () => {
    try {
      await exportToWord(metadata, entries, exportOrientation);
      toast.success('Dokumen Word berhasil diunduh!');
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengespor ke Word");
    }
  };

  const Sidebar = () => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard Admin', icon: LayoutDashboard },
      { id: 'absensi', label: 'Absensi Harian', icon: Camera },
      { id: 'laporan', label: 'Data Laporan', icon: Edit },
      { id: 'rekap', label: 'Rekap Laporan', icon: Database },
      { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
    ];

    return (
      <aside 
        className={`bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-full shrink-0 print:hidden transition-all duration-300 ease-in-out z-40 fixed md:relative shadow-2xl ${
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } w-72 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6f42c1] to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate transition-opacity duration-200">
                <span className="font-extrabold text-white tracking-tight text-base leading-tight">SIPERJA</span>
                <span className="text-[10px] text-purple-300/80 font-medium tracking-wider uppercase">Laporan & Absensi</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse/Expand Toggle */}
          <button 
            onClick={toggleSidebarCollapsed}
            className="hidden md:flex p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            title={isSidebarCollapsed ? "Peluas Sidebar" : "Kecilkan Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* User Profile Card */}
        {user && (
          <div className={`p-3 border-b border-slate-800/80 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow"></span>
            </div>

            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-white text-xs font-semibold truncate leading-tight">{user.displayName || user.email}</p>
                <p className="text-emerald-400 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                  <span>Aktif / Online</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {!isSidebarCollapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2">
              MENU UTAMA
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsSidebarOpen(false);
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-300'}`} />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-700 z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Toggle */}
        <div className="p-3 border-t border-slate-800/80 hidden md:block">
          <button
            onClick={toggleSidebarCollapsed}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-purple-400" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-purple-400" />
                <span>Kecilkan Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    );
  };

  const toasterConfig = (
    <Toaster 
      position="top-right" 
      toastOptions={{ 
        duration: 3500,
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '12px',
          fontSize: '13px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontWeight: 500,
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#0f172a',
          },
          style: {
            borderLeft: '4px solid #10b981',
          }
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#0f172a',
          },
          style: {
            borderLeft: '4px solid #ef4444',
          }
        }
      }} 
    />
  );

  if (needsAuth || !user) {
    return (
      <div className="min-h-screen bg-slate-900 font-sans">
        {toasterConfig}
        <LandingPage onLogin={handleLogin} isLoading={isLoggingIn} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-[#333] overflow-hidden">
      {toasterConfig}
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full max-w-full">
        {/* Header - Hidden when printing */}
        <header className="h-16 bg-white border-b border-[#dee2e6] flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm print:hidden z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(!isSidebarOpen);
                } else {
                  toggleSidebarCollapsed();
                }
              }} 
              className="p-2 -ml-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              title="Toggle Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' ? 'Dashboard Admin' : activeTab === 'absensi' ? 'Absensi Kehadiran' : activeTab === 'rekap' ? 'Rekap Laporan' : activeTab === 'pengaturan' ? 'Pengaturan' : 'Editor Laporan Kinerja'}
            </h2>
          </div>
          
          <div className="flex gap-2 md:gap-2">
            {needsAuth ? (
               <button onClick={handleLogin} className="flex items-center justify-center bg-white border border-gray-300 rounded shadow-sm px-3 py-1.5 hover:bg-gray-50">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                  <span className="text-sm text-gray-700 font-medium">Login</span>
                </button>
            ) : (
               <button onClick={handleLogout} className="flex items-center justify-center bg-white border border-gray-300 rounded shadow-sm px-3 py-1.5 hover:bg-gray-50 text-gray-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium hidden md:inline">Logout</span>
               </button>
            )}

            {activeTab === 'laporan' && (
              <>
                <button 
                  onClick={syncGoogleCalendar}
                  className="px-2 md:px-3 py-1.5 border border-[#17a2b8] text-[#17a2b8] hover:bg-[#17a2b8] hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Sinkronisasi Libur Google Calendar"
                >
                  <CalendarIcon className="w-3.5 h-3.5" /> <span className="hidden md:inline">Sync Kalender</span>
                </button>
                <button 
                  onClick={handleExportWord}
                  className="px-2 md:px-3 py-1.5 border border-[#6f42c1] text-[#6f42c1] hover:bg-[#6f42c1] hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" /> <span className="hidden md:inline">Word</span>
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="px-2 md:px-3 py-1.5 border border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> <span className="hidden md:inline">Excel</span>
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="px-2 md:px-3 py-1.5 border border-[#dc3545] text-[#dc3545] hover:bg-[#dc3545] hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> <span className="hidden md:inline">PDF</span>
                </button>
                <button 
                  onClick={handleSaveDatabase}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-[#6f42c1] text-white rounded text-xs font-medium shadow-sm hover:bg-[#59339d] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  <span className="hidden md:inline">{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <div key={activeTab} className="w-full h-full flex animate-fade-in">
            {activeTab === 'dashboard' && (
              <AdminDashboard metadata={metadata} entries={entries} />
            )}
              
            {activeTab === 'absensi' && (
              <DailyAttendance metadata={metadata} entries={entries} setEntries={setEntries} />
            )}

            {activeTab === 'rekap' && (
              <ReportRecap exportOrientation={exportOrientation} />
            )}

            {activeTab === 'pengaturan' && (
              <SettingsPanel 
                metadata={metadata} 
                entries={entries} 
                exportOrientation={exportOrientation}
                setExportOrientation={setExportOrientation}
              />
            )}

            {activeTab === 'laporan' && (
              <>
                {/* Editor Panel - Hidden when printing */}
                <div className="w-full md:w-[450px] lg:w-[500px] bg-white border-r border-[#dee2e6] flex flex-col shrink-0 overflow-y-auto print:hidden shadow-sm z-10">
                   <EditorPanel 
                    metadata={metadata} 
                    setMetadata={setMetadata} 
                    entries={entries} 
                    setEntries={setEntries}
                    onGenerateMonth={handleGenerateMonth}
                  />
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-y-auto bg-[#f8f9fa] p-4 md:p-6 flex flex-col items-center print:bg-white print:p-0 hidden md:flex">
                  <div id="report-preview-container" className="w-full max-w-[1000px] bg-white shadow min-h-[640px] p-10 flex flex-col border border-[#dee2e6] border-t-[3px] border-t-[#6f42c1] relative print:shadow-none print:border-none print:p-0 print:max-w-none">
                    <ReportPreview metadata={metadata} entries={entries} />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
