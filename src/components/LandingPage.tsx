import React from 'react';
import { Camera, FileText, Database, Calendar, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  isLoading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, isLoading }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white flex flex-col font-sans selection:bg-[#6f42c1] selection:text-white">
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6f42c1] to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">SIPERJA</h1>
            <p className="text-xs text-purple-200/70 font-medium">Sistem Laporan & Absensi Kehadiran</p>
          </div>
        </div>

        <button
          onClick={onLogin}
          disabled={isLoading}
          className="flex items-center gap-2.5 bg-white text-gray-900 hover:bg-purple-50 px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-70"
        >
          <svg className="w-4 h-4" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          <span>Masuk dengan Google</span>
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-12 pb-20 flex flex-col justify-center items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Platform Kinerja & Kehadiran Digital</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] text-white">
          Kelola Absensi Harian & <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">Laporan Kinerja</span> Secara Modern
        </h2>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          Solusi terpadu pencatatan kehadiran pegawai, otomatisasi pembuatan laporan bulanan, penyelarasan kalender nasional, hingga cetak dokumen PDF, Word, dan Excel.
        </p>

        {/* Call To Action Card */}
        <div className="mt-10 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-md w-full shadow-2xl">
          <div className="p-6 rounded-xl bg-gradient-to-b from-white/10 to-transparent text-left flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Akses Dashboard Anda</h3>
            <p className="text-xs text-slate-300 mb-6">Silakan login menggunakan akun Google Anda untuk mengakses fitur lengkap.</p>
            
            <button
              onClick={onLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#6f42c1] to-purple-600 hover:from-purple-600 hover:to-[#6f42c1] text-white font-bold text-sm transition-all shadow-lg shadow-purple-900/50 flex items-center justify-center gap-3 group border border-purple-400/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5 bg-white p-0.5 rounded-full" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isLoading ? 'Menghubungkan...' : 'Login Sekarang dengan Google'}</span>
              <ArrowRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-1.5">Absensi Foto & Lokasi</h4>
            <p className="text-xs text-slate-300 leading-relaxed">Pencatatan jam masuk & pulang dilengkapi bukti foto kamera langsung dan penanda tempat.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-1.5">Editor Laporan Kinerja</h4>
            <p className="text-xs text-slate-300 leading-relaxed">Pengisian kegiatan harian otomatis terintegrasi dengan tanda tangan digital dan pratinjau instan.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-1.5">Sync Google Calendar</h4>
            <p className="text-xs text-slate-300 leading-relaxed">Sinkronisasi otomatis hari libur nasional untuk ketepatan perhitungan jam kerja bulanan.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base mb-1.5">Rekap Cloud & Ekspor</h4>
            <p className="text-xs text-slate-300 leading-relaxed">Penyimpanan aman di Firestore dan dukungan ekspor sekali klik ke format Word, Excel, atau PDF.</p>
          </div>
        </div>

        {/* Benefits checklist */}
        <div className="mt-16 flex flex-wrap justify-center gap-6 text-xs text-slate-300 font-medium border-t border-white/10 pt-8 w-full">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Otentikasi Aman Google</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Database Cloud Realtime</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Format Ekspor Resmi</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Responsif & Cepat</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} SIPERJA. Hak Cipta Dilindungi Undang-Undang.</p>
      </footer>
    </div>
  );
};
