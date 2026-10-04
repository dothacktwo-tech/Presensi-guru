import React, { useRef, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { ReportEntry, ReportMetadata } from '../types';
import { Plus, Trash, Image as ImageIcon, Settings, Save, CalendarDays, Edit3, Wand2, Loader2, BarChart2, Camera, Sparkles } from 'lucide-react';
import { resizeImage, formatFullDateIndonesian } from '../utils';
import { CameraCapture } from './CameraCapture';
import { TaskGeneratorModal } from './TaskGeneratorModal';

interface EditorPanelProps {
  metadata: ReportMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<ReportMetadata>>;
  entries: ReportEntry[];
  setEntries: React.Dispatch<React.SetStateAction<ReportEntry[]>>;
  onGenerateMonth: (year: number, month: number) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  metadata,
  setMetadata,
  entries,
  setEntries,
  onGenerateMonth
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [genYear, setGenYear] = React.useState<number>(new Date().getFullYear());
  const [genMonth, setGenMonth] = React.useState<number>(new Date().getMonth());
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isTaskGeneratorOpen, setIsTaskGeneratorOpen] = useState(false);
  const [loadingSingleId, setLoadingSingleId] = useState<string | null>(null);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
  } | null>(null);

  const handleGenerateSingleRowAI = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    setLoadingSingleId(entryId);
    const toastId = toast.loading(`Generasi AI untuk ${entry.dayName}, ${entry.date}...`);

    try {
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: metadata.jobTitle || 'Guru / Tenaga Pendidik',
          daysCount: 1,
          customPrompt: `Khusus hari ${entry.dayName}, tanggal ${entry.date}`
        })
      });

      if (!response.ok) {
        throw new Error('Gagal dari server AI');
      }

      const data = await response.json();
      const generated = data.tasks || [];
      if (generated.length > 0) {
        const item = generated[0];
        handleEntryChange(entryId, 'description', item.uraian);
        if (item.waktu) {
          handleEntryChange(entryId, 'duration', item.waktu);
        }
        toast.success(`Uraian kegiatan ${entry.dayName} berhasil dibuat!`, { id: toastId });
      } else {
        toast.error('AI tidak mengembalikan hasil.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal generate AI.', { id: toastId });
    } finally {
      setLoadingSingleId(null);
    }
  };

  const stats = useMemo(() => {
    const workingDays = entries.filter(e => !e.isHoliday);
    const totalMinutes = workingDays.reduce((acc, curr) => {
      const match = curr.duration.match(/\d+/);
      const mins = match ? parseInt(match[0], 10) : 0;
      return acc + (isNaN(mins) ? 0 : mins);
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      workingDays: workingDays.length,
      totalHours: hours,
      totalMinutes: minutes
    };
  }, [entries]);

  const showAlertDialog = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: 'alert'
    });
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 18) {
      setMetadata({ ...metadata, [e.target.name]: val });
    }
  };

  const handleEntryChange = (id: string, field: keyof ReportEntry, value: any) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleImageUpload = async (id: string, file: File) => {
    try {
      const base64 = await resizeImage(file, 800); // Resize to max 800px width
      handleEntryChange(id, 'photo', base64);
      toast.success('Foto kegiatan berhasil diunggah!');
    } catch (error) {
      console.error('Error processing image', error);
      toast.error('Gagal memproses gambar');
      showAlertDialog('Kesalahan', 'Gagal memproses gambar');
    }
  };

  const handleAutoFillAI = async () => {
    const emptyDays = entries.filter(e => !e.isHoliday && !e.description);
    if (emptyDays.length === 0) {
      toast.error('Semua hari kerja sudah memiliki uraian pekerjaan.');
      showAlertDialog('Pemberitahuan', 'Semua hari kerja sudah memiliki uraian pekerjaan.');
      return;
    }

    showConfirmDialog(
      'Konfirmasi AI',
      `Auto-generate ${emptyDays.length} uraian pekerjaan kosong menggunakan AI?`,
      async () => {
        setIsGeneratingAI(true);
        const toastId = toast.loading(`Generasi AI untuk ${emptyDays.length} hari...`);
        try {
          const response = await fetch('/api/generate-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobTitle: metadata.jobTitle,
              daysCount: emptyDays.length
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to generate tasks');
          }
          const data = await response.json();
          const generatedTasks: {waktu: string, uraian: string}[] = data.tasks || [];

          if (generatedTasks.length > 0) {
            let taskIndex = 0;
            setEntries(entries.map(entry => {
              if (!entry.isHoliday && !entry.description && taskIndex < generatedTasks.length) {
                const task = generatedTasks[taskIndex++];
                return { ...entry, description: task.uraian, duration: task.waktu };
              }
              return entry;
            }));
            toast.success(`Berhasil generate ${generatedTasks.length} uraian kegiatan dengan AI!`, { id: toastId });
          } else {
            toast.error('AI tidak mengembalikan hasil. Silakan coba lagi.', { id: toastId });
            showAlertDialog('Pemberitahuan', 'AI tidak mengembalikan hasil. Silakan coba lagi.');
          }
        } catch (error: any) {
          console.error(error);
          const msg = error.message || 'Gagal menghasilkan uraian menggunakan AI. Pastikan API Key sudah disetup.';
          toast.error(msg, { id: toastId });
          showAlertDialog('Kesalahan', msg);
        } finally {
          setIsGeneratingAI(false);
        }
      }
    );
  };

  const getInputClass = (val: string | undefined, isRequired: boolean = false) => 
    `w-full px-3 py-2 bg-[#f8f9fa] border ${isRequired && !val ? 'border-red-400 focus:ring-red-500' : 'border-[#dee2e6] focus:ring-purple-500'} rounded text-sm focus:ring-2 outline-none transition-shadow`;

  const labelClass = "block text-xs font-semibold text-[#6c757d] mb-1.5 uppercase tracking-wide";

  return (
    <div className="w-full h-full overflow-y-auto p-8 flex flex-col gap-8">
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#212529] mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-purple-600" /> Pengaturan Laporan
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nama Pegawai <span className="text-red-500">*</span></label>
              <input type="text" name="employeeName" value={metadata.employeeName} onChange={handleMetadataChange} className={getInputClass(metadata.employeeName, true)} placeholder="Wajib diisi" />
            </div>
            <div>
              <label className={labelClass}>Jabatan / Posisi <span className="text-red-500">*</span></label>
              <input type="text" name="jobTitle" value={metadata.jobTitle || ''} onChange={handleMetadataChange} className={getInputClass(metadata.jobTitle, true)} placeholder="Wajib diisi" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Bulan Laporan (Label) <span className="text-red-500">*</span></label>
            <input type="text" name="reportMonth" value={metadata.reportMonth} onChange={handleMetadataChange} className={getInputClass(metadata.reportMonth, true)} placeholder="Wajib diisi" />
          </div>
          <div>
            <label className={labelClass}>Nama Sekolah <span className="text-red-500">*</span></label>
            <input type="text" name="school" value={metadata.school} onChange={handleMetadataChange} className={getInputClass(metadata.school, true)} placeholder="Wajib diisi" />
          </div>
          <div>
            <label className={labelClass}>Cabang Dinas <span className="text-red-500">*</span></label>
            <input type="text" name="branch" value={metadata.branch} onChange={handleMetadataChange} className={getInputClass(metadata.branch, true)} placeholder="Wajib diisi" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nama Kepsek <span className="text-red-500">*</span></label>
              <input type="text" name="principalName" value={metadata.principalName} onChange={handleMetadataChange} className={getInputClass(metadata.principalName, true)} placeholder="Wajib diisi" />
            </div>
            <div>
              <label className={labelClass}>NIP Kepsek <span className="text-red-500">*</span></label>
              <input type="text" name="principalNip" value={metadata.principalNip} onChange={handleNipChange} maxLength={18} className={getInputClass(metadata.principalNip, true)} placeholder="18 Digit Angka" />
              {metadata.principalNip && metadata.principalNip.length > 0 && metadata.principalNip.length < 18 && (
                <p className="text-red-500 text-[10px] mt-1">NIP harus 18 digit angka</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nama Pelapor <span className="text-red-500">*</span></label>
              <input type="text" name="reporterName" value={metadata.reporterName} onChange={handleMetadataChange} className={getInputClass(metadata.reporterName, true)} placeholder="Wajib diisi" />
            </div>
            <div>
              <label className={labelClass}>NIP Pelapor <span className="text-slate-400 font-normal">(Opsional)</span></label>
              <input type="text" name="reporterNip" value={metadata.reporterNip || ''} onChange={handleNipChange} maxLength={18} className={getInputClass(metadata.reporterNip, false)} placeholder="18 Digit Angka (Kosongkan jika tidak ada)" />
              {metadata.reporterNip && metadata.reporterNip.length > 0 && metadata.reporterNip.length < 18 && metadata.reporterNip !== '-' && (
                <p className="text-red-500 text-[10px] mt-1">NIP harus 18 digit angka</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClass}>Tanggal TTD <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input type="text" name="reportDate" value={metadata.reportDate} onChange={handleMetadataChange} className={`${getInputClass(metadata.reportDate, true)} flex-1`} placeholder="Wajib diisi" />
                <div className="relative">
                  <input 
                    type="date" 
                    onChange={(e) => {
                      if(e.target.value) {
                        const formatted = formatFullDateIndonesian(e.target.value);
                        if (formatted) {
                          setMetadata({ ...metadata, reportDate: formatted });
                        }
                      }
                    }}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" 
                  />
                  <div className="px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded text-[#6c757d] hover:bg-[#e9ecef] flex items-center justify-center pointer-events-none h-full">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 bg-white border border-[#dee2e6] rounded shadow-sm">
        <h3 className="font-semibold text-[#343a40] mb-3 flex items-center gap-2 text-sm">
          <BarChart2 className="w-4 h-4 text-purple-600" /> Ringkasan Statistik
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#f8f9fa] p-3 rounded border border-[#e9ecef]">
            <p className="text-xs text-[#6c757d] font-medium mb-1">Hari Kerja Efektif</p>
            <p className="text-xl font-bold text-[#343a40]">{stats.workingDays} <span className="text-sm font-medium text-[#6c757d]">hari</span></p>
          </div>
          <div className="bg-[#f8f9fa] p-3 rounded border border-[#e9ecef]">
            <p className="text-xs text-[#6c757d] font-medium mb-1">Total Jam Kerja</p>
            <p className="text-xl font-bold text-[#343a40]">{stats.totalHours}<span className="text-sm font-medium text-[#6c757d]">j</span> {stats.totalMinutes > 0 ? `${stats.totalMinutes}m` : ''}</p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-purple-50 border border-purple-100 rounded">
        <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4" /> Generate Bulan Otomatis
        </h3>
        <div className="flex gap-2">
          <select value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))} className="px-3 py-2 bg-white border border-purple-200 rounded text-sm outline-none focus:ring-2 focus:ring-purple-500 flex-1">
            {Array.from({length: 12}).map((_, i) => (
              <option key={i} value={i}>{new Date(2000, i).toLocaleString('id-ID', { month: 'long' })}</option>
            ))}
          </select>
          <input type="number" value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} className="px-3 py-2 bg-white border border-purple-200 rounded text-sm outline-none focus:ring-2 focus:ring-purple-500 w-24" />
          <button 
            onClick={() => {
              showConfirmDialog(
                'Generate Ulang Bulan',
                'Generate ulang akan menghapus data yang sudah ada di bulan saat ini. Apakah Anda yakin ingin melanjutkan?',
                () => onGenerateMonth(genYear, genMonth)
              );
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
          >
            Generate
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-[#212529] flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-purple-600" /> Data Harian Laporan
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsTaskGeneratorOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Auto-Generate AI (Modal)
            </button>
            <button 
              onClick={handleAutoFillAI}
              disabled={isGeneratingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              Auto-fill Cepat
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={entry.id} className={`p-5 border rounded-xl ${entry.isHoliday ? 'bg-[#f8f9fa] border-[#dee2e6]' : 'bg-white border-[#dee2e6] shadow-sm'} relative group transition-all`}>
               <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="flex items-center gap-2 text-[11px] font-semibold cursor-pointer bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-[#dee2e6] text-[#495057] hover:text-purple-600 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={entry.isHoliday}
                      onChange={(e) => handleEntryChange(entry.id, 'isHoliday', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    LIBUR
                  </label>
               </div>
               
               <div className="flex flex-col gap-4">
                 <div className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-16">{entry.dayName}</span>
                    <input 
                      type="date" 
                      value={entry.date} 
                      onChange={(e) => handleEntryChange(entry.id, 'date', e.target.value)}
                      className="px-2.5 py-1.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                 </div>
                 
                 <div className="grid grid-cols-[100px_1fr_auto] gap-3">
                    <div>
                      <input 
                        type="text" 
                        value={entry.duration} 
                        onChange={(e) => handleEntryChange(entry.id, 'duration', e.target.value)}
                        placeholder="Waktu"
                        className={getInputClass(entry.duration, false)}
                      />
                    </div>
                    <div className="relative flex items-center">
                      <textarea 
                        value={entry.description} 
                        onChange={(e) => handleEntryChange(entry.id, 'description', e.target.value)}
                        placeholder="Uraian Pekerjaan / Kegiatan"
                        className={`${getInputClass(entry.description, false)} min-h-[40px] resize-y pr-10`}
                        rows={1}
                      />
                      <button
                        onClick={() => handleGenerateSingleRowAI(entry.id)}
                        disabled={loadingSingleId === entry.id || entry.isHoliday}
                        className="absolute right-2 top-2 p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-md transition-colors disabled:opacity-40"
                        title="Generate Uraian AI untuk hari ini"
                      >
                        {loadingSingleId === entry.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center">
                       {entry.photo ? (
                         <div className="relative group/img">
                           <img src={entry.photo} className="h-10 w-10 object-cover rounded-lg border border-slate-300" alt="Preview" />
                           <button onClick={() => handleEntryChange(entry.id, 'photo', null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 shadow-sm transition-opacity">
                             <Trash className="w-3 h-3" />
                           </button>
                         </div>
                       ) : (
                         <div className="flex gap-1">
                           <button 
                             onClick={() => setActiveCameraId(entry.id)}
                             className="h-10 w-10 flex items-center justify-center bg-[#f8f9fa] hover:bg-[#e9ecef] border border-[#dee2e6] rounded-lg transition-colors"
                             title="Ambil Foto"
                           >
                             <Camera className="w-4 h-4 text-slate-400" />
                           </button>
                           <button 
                             onClick={() => fileInputRefs.current[entry.id]?.click()}
                             className="h-10 w-10 flex items-center justify-center bg-[#f8f9fa] hover:bg-[#e9ecef] border border-[#dee2e6] rounded-lg transition-colors"
                             title="Upload Foto"
                           >
                             <ImageIcon className="w-4 h-4 text-slate-400" />
                           </button>
                         </div>
                       )}
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         ref={(el) => { fileInputRefs.current[entry.id] = el; }}
                         onChange={(e) => {
                           if (e.target.files && e.target.files[0]) {
                             handleImageUpload(entry.id, e.target.files[0]);
                           }
                         }}
                       />
                    </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
      
      {activeCameraId && (
        <CameraCapture 
          onClose={() => setActiveCameraId(null)}
          onCapture={(dataUrl) => {
            handleEntryChange(activeCameraId, 'photo', dataUrl);
            setActiveCameraId(null);
          }}
        />
      )}

      {/* Task Generator Modal AI */}
      <TaskGeneratorModal
        isOpen={isTaskGeneratorOpen}
        onClose={() => setIsTaskGeneratorOpen(false)}
        entries={entries}
        jobTitle={metadata.jobTitle || ''}
        onApplyTasks={(updatedEntries) => setEntries(updatedEntries)}
      />

      {/* Custom Dialog Modal */}
      {dialog && dialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded shadow-xl max-w-md w-full border border-[#e9ecef] p-6 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-bold text-[#212529] mb-2">{dialog.title}</h3>
            <p className="text-sm text-[#495057] mb-6">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              {dialog.type === 'confirm' && (
                <button
                  onClick={() => setDialog(null)}
                  className="px-4 py-2 border border-[#dee2e6] text-slate-700 hover:bg-[#f8f9fa] rounded text-sm font-medium transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => {
                  if (dialog.onConfirm) {
                    dialog.onConfirm();
                  }
                  setDialog(null);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors shadow-sm"
              >
                {dialog.type === 'confirm' ? 'Ya, Lanjutkan' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
