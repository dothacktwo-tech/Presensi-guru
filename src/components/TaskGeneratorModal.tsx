import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Wand2, X, Sparkles, Loader2, Check, RefreshCw, Briefcase, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ReportEntry } from '../types';

interface TaskGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ReportEntry[];
  jobTitle: string;
  onApplyTasks: (updatedEntries: ReportEntry[]) => void;
}

const PRESET_JABATAN = [
  { label: '🎓 Guru / Pendidik', job: 'Guru Mata Pelajaran', focus: 'Mengajar di kelas, membuat RPP, menilai tugas siswa, jurnal kelas' },
  { label: '🏫 Wali Kelas', job: 'Guru & Wali Kelas', focus: 'Mengajar kelas, pembinaan siswa, komunikasi dengan orang tua, rekap absensi' },
  { label: '📂 Tata Usaha (TU)', job: 'Tenaga Administrasi / TU', focus: 'Pengarsipan surat masuk/keluar, legalisir ijazah, layanan persuratan' },
  { label: '💻 Operator Sekolah / IT', job: 'Operator Dapodik & IT Support', focus: 'Penginputan data Dapodik, pemeliharaan lab komputer, sinkronisasi data' },
  { label: '📚 Petugas Perpustakaan', job: 'Pustakawan Sekolah', focus: 'Pelayanan sirkulasi buku, penataan katalog, pemeliharaan koleksi perpustakaan' },
  { label: '💰 Bendahara Sekolah', job: 'Bendahara BOS / Keuangan', focus: 'Pencatatan kas harian, verifikasi kuitansi belanja, pembukuan LPD BOS' },
  { label: '🧹 Keamanan & Kebersihan', job: 'Petugas Kebersihan / Keamanan', focus: 'Monitoring area lingkungan, sterilisasi ruang kelas, ketertiban gerbang' },
  { label: '✏️ Custom / Bebas', job: '', focus: '' },
];

export const TaskGeneratorModal: React.FC<TaskGeneratorModalProps> = ({
  isOpen,
  onClose,
  entries,
  jobTitle,
  onApplyTasks,
}) => {
  const [targetJob, setTargetJob] = useState(jobTitle || 'Guru Mata Pelajaran');
  const [focusArea, setFocusArea] = useState('Mengajar di kelas, evaluasi siswa, tugas administratif');
  const [customNotes, setCustomNotes] = useState('');
  const [duration, setDuration] = useState('450 menit');
  const [fillMode, setFillMode] = useState<'empty' | 'all'>('empty');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewTasks, setPreviewTasks] = useState<{ id: string; date: string; dayName: string; duration: string; description: string; isHoliday: boolean }[] | null>(null);

  if (!isOpen) return null;

  const targetDays = entries.filter(e => !e.isHoliday && (fillMode === 'all' || !e.description));

  const handlePresetSelect = (preset: typeof PRESET_JABATAN[0]) => {
    if (preset.job) setTargetJob(preset.job);
    if (preset.focus) setFocusArea(preset.focus);
  };

  const handleGenerate = async () => {
    if (targetDays.length === 0) {
      toast.error('Tidak ada hari kerja yang memenuhi kriteria pengisian.');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading(`Menggenerasi ${targetDays.length} kegiatan AI...`);

    try {
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: targetJob,
          daysCount: targetDays.length,
          focus: focusArea,
          customPrompt: customNotes,
          duration: duration,
          tone: 'Formal dan Profesional PNS'
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal generate AI');
      }

      const data = await response.json();
      const generated: { waktu: string; uraian: string }[] = data.tasks || [];

      if (generated.length === 0) {
        toast.error('AI tidak mengembalikan hasil. Coba sesuaikan instruksi.', { id: toastId });
        return;
      }

      // Map generated items to preview target days
      let genIndex = 0;
      const previewList = entries.map(entry => {
        const isTarget = !entry.isHoliday && (fillMode === 'all' || !entry.description);
        if (isTarget && genIndex < generated.length) {
          const item = generated[genIndex++];
          return {
            id: entry.id,
            date: entry.date,
            dayName: entry.dayName,
            duration: item.waktu || duration,
            description: item.uraian,
            isHoliday: entry.isHoliday
          };
        } else {
          return {
            id: entry.id,
            date: entry.date,
            dayName: entry.dayName,
            duration: entry.duration || duration,
            description: entry.description,
            isHoliday: entry.isHoliday
          };
        }
      });

      setPreviewTasks(previewList);
      toast.success(`Berhasil membuat pratinjau ${generated.length} uraian kegiatan!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal terhubung dengan layanan AI.', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!previewTasks) return;

    const updatedEntries = entries.map(entry => {
      const found = previewTasks.find(p => p.id === entry.id);
      if (found) {
        return {
          ...entry,
          duration: found.duration,
          description: found.description
        };
      }
      return entry;
    });

    onApplyTasks(updatedEntries);
    toast.success('Uraian pekerjaan AI berhasil diterapkan ke laporan!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-snug">Auto-Generate Kegiatan AI</h3>
              <p className="text-xs text-purple-200">Buat uraian pekerjaan harian otomatis yang realistis & profesional</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Preset Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-purple-600" /> Pilih Preset Jabatan / Posisi
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_JABATAN.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    targetJob === preset.job 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Job Title & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Nama Jabatan / Posisi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                placeholder="Contoh: Guru Matematika / Staff TU"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" /> Durasi Standar Harian
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="450 menit">450 menit (7.5 Jam Kerja PNS)</option>
                <option value="420 menit">420 menit (7 Jam Kerja)</option>
                <option value="400 menit">400 menit (6.5 Jam Kerja)</option>
                <option value="360 menit">360 menit (6 Jam Kerja)</option>
              </select>
            </div>
          </div>

          {/* Focus Area */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-purple-600" /> Fokus Utama Kegiatan
            </label>
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder="Contoh: Mengajar, penilaian, piket, RPP, rapat"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Custom Notes / Prompt */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Instruksi / Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={2}
              placeholder="Contoh: Sertakan persiapan Ujian Tengah Semester di pertengahan bulan dan piket kebersihan di hari Jumat..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            />
          </div>

          {/* Target Mode */}
          <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-4 space-y-2">
            <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">
              Target Pengisian Hari Kerja
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                fillMode === 'empty' ? 'bg-white border-purple-600 shadow-sm text-purple-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <input
                  type="radio"
                  name="fillMode"
                  checked={fillMode === 'empty'}
                  onChange={() => setFillMode('empty')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="text-xs">
                  <p className="font-bold">Hanya Hari Kosong</p>
                  <p className="text-[11px] text-slate-500 font-normal">Isi uraian yang belum terisi</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                fillMode === 'all' ? 'bg-white border-purple-600 shadow-sm text-purple-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <input
                  type="radio"
                  name="fillMode"
                  checked={fillMode === 'all'}
                  onChange={() => setFillMode('all')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="text-xs">
                  <p className="font-bold">Semua Hari Kerja (Overwrite)</p>
                  <p className="text-[11px] text-slate-500 font-normal">Timpa seluruh hari kerja di bulan ini</p>
                </div>
              </label>
            </div>
            <p className="text-[11px] text-purple-700 font-medium pt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-purple-600" />
              Target: <span className="font-bold">{targetDays.length} hari kerja</span> akan digenerate secara otomatis.
            </p>
          </div>

          {/* Preview Section */}
          {previewTasks && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pratinjau Hasil Generasi AI
                </h4>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Re-generate
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50 p-2 space-y-1.5">
                {previewTasks.filter(p => !p.isHoliday).map((item, i) => (
                  <div key={item.id} className="p-2.5 bg-white rounded-lg border border-slate-100 text-xs flex gap-3 items-start shadow-2xs">
                    <span className="font-bold text-purple-700 w-24 shrink-0">{item.dayName}, {item.date.split('-').reverse().join('/')}</span>
                    <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono text-[10px] shrink-0">{item.duration}</span>
                    <span className="text-slate-700 flex-1 leading-relaxed">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
          >
            Batal
          </button>

          <div className="flex gap-2">
            {!previewTasks ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || targetDays.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generasi Uraian ({targetDays.length} Hari)
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Check className="w-4 h-4" />
                Terapkan Hasil ke Laporan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
