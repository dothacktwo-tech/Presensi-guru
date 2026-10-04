import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Camera, Calendar, Wand2, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ReportEntry, ReportMetadata } from '../types';
import { CameraCapture } from './CameraCapture';
import { formatFullDateIndonesian } from '../utils';

interface DailyAttendanceProps {
  metadata: ReportMetadata;
  entries: ReportEntry[];
  setEntries: (entries: ReportEntry[]) => void;
}

export const DailyAttendance: React.FC<DailyAttendanceProps> = ({ metadata, entries, setEntries }) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const workingDays = entries.filter(e => !e.isHoliday);

  useEffect(() => {
    if (!selectedEntryId && workingDays.length > 0) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const todayStr = `${yyyy}-${mm}-${dd}`;
      const found = workingDays.find(e => e.date === todayStr);
      if (found) {
        setSelectedEntryId(found.id);
      } else {
        setSelectedEntryId(workingDays[0].id);
      }
    }
  }, [workingDays, selectedEntryId]);

  const selectedEntry = entries.find(e => e.id === selectedEntryId);

  const handleCapture = (dataUrl: string) => {
    if (selectedEntryId) {
      setEntries(entries.map(e => e.id === selectedEntryId ? { ...e, photo: dataUrl } : e));
      toast.success('Foto absensi kehadiran berhasil diambil!');
    }
    setIsCameraOpen(false);
  };

  const handleGenerateAI = async () => {
    if (!selectedEntryId) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsGenerating(true);
    const toastId = toast.loading('Generasi uraian pekerjaan AI...');

    try {
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: metadata.jobTitle,
          daysCount: 1
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate tasks');
      }
      const data = await response.json();
      const generatedTasks: {waktu: string, uraian: string}[] = data.tasks || [];

      if (generatedTasks.length > 0) {
        const task = generatedTasks[0];
        setEntries(entries.map(e => e.id === selectedEntryId ? { ...e, description: task.uraian, duration: task.waktu } : e));
        setSuccessMsg('Uraian berhasil di-generate secara otomatis.');
        toast.success('Uraian kegiatan berhasil dibuat dengan AI!', { id: toastId });
      } else {
        setErrorMsg('AI tidak mengembalikan hasil. Silakan coba lagi.');
        toast.error('AI tidak mengembalikan hasil. Silakan coba lagi.', { id: toastId });
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Gagal menghasilkan uraian menggunakan AI.';
      setErrorMsg(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedEntryId) {
      setEntries(entries.map(entry => entry.id === selectedEntryId ? { ...entry, description: e.target.value } : entry));
    }
  };

  const handleSaveAbsensi = () => {
    setSuccessMsg('Data absensi berhasil disimpan!');
    toast.success('Data absensi harian berhasil diperbarui.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="w-full h-full bg-[#f8f9fa] p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#212529]">Absensi Harian</h1>
          <p className="text-sm text-[#6c757d] mt-1">Isi laporan kinerja dan foto bukti kehadiran untuk hari kerja ini.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded flex items-start gap-3 border border-emerald-100">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{successMsg}</p>
          </div>
        )}

        <div className="bg-white border border-[#dee2e6] rounded shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Tanggal Absensi</label>
            <div className="relative">
              <select 
                value={selectedEntryId} 
                onChange={e => {
                  setSelectedEntryId(e.target.value);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-[#f8f9fa] border border-[#dee2e6] rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
              >
                {workingDays.length === 0 && <option value="">Tidak ada hari kerja di bulan ini</option>}
                {workingDays.map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {entry.dayName}, {formatFullDateIndonesian(entry.date)}
                  </option>
                ))}
              </select>
              <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {selectedEntry && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e9ecef]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#343a40] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-600" /> Foto Kehadiran
                  </h3>
                </div>
                
                <div className="aspect-[4/3] bg-[#e9ecef] rounded border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden relative group">
                  {selectedEntry.photo ? (
                    <>
                      <img src={selectedEntry.photo} alt="Bukti Hadir" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => setIsCameraOpen(true)}
                          className="bg-white text-[#212529] px-4 py-2 rounded-full font-medium text-sm shadow-lg hover:scale-105 transition-transform"
                        >
                          Ubah Foto
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-[#dee2e6] text-slate-400">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-[#6c757d] mb-4">Belum ada foto kehadiran</p>
                      <button 
                        onClick={() => setIsCameraOpen(true)}
                        className="bg-purple-600 text-white px-5 py-2 rounded-full font-medium text-sm shadow-sm hover:bg-purple-700 transition-colors"
                      >
                        Ambil Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#343a40] flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-600" /> Uraian Kinerja
                  </h3>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    Isi Otomatis
                  </button>
                </div>
                
                <select
                  value={selectedEntry.taskCategory || ''}
                  onChange={e => {
                    if (selectedEntryId) {
                      setEntries(entries.map(entry => entry.id === selectedEntryId ? { ...entry, taskCategory: e.target.value } : entry));
                    }
                  }}
                  className="w-full px-4 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Pilih Kategori Tugas</option>
                  <option value="Mengajar/Pendidikan">Mengajar/Pendidikan</option>
                  <option value="Administrasi/Manajerial">Administrasi/Manajerial</option>
                  <option value="Pelatihan/Pengembangan">Pelatihan/Pengembangan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>

                <textarea
                  value={selectedEntry.description}
                  onChange={handleDescriptionChange}
                  placeholder="Ketik uraian pekerjaan atau gunakan tombol Isi Otomatis..."
                  className="w-full flex-1 min-h-[160px] p-4 bg-[#f8f9fa] border border-[#dee2e6] rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-shadow"
                />
                <button
                  onClick={handleSaveAbsensi}
                  className="mt-4 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Simpan Absensi
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#dee2e6] rounded shadow-sm overflow-hidden mt-8">
          <div className="p-5 border-b border-[#dee2e6] bg-[#f8f9fa]/50">
            <h2 className="text-base font-bold text-[#343a40]">Daftar Absensi & Uraian Kinerja</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#495057]">
              <thead className="bg-[#f8f9fa] text-xs uppercase font-semibold text-[#6c757d] border-b border-[#dee2e6]">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Uraian</th>
                  <th className="px-4 py-3 text-center">Foto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#6c757d]">
                      Tidak ada data di bulan ini.
                    </td>
                  </tr>
                ) : (
                  entries.map(entry => (
                    <tr 
                      key={entry.id} 
                      className={`transition-colors ${entry.isHoliday ? 'bg-[#e9ecef] opacity-75' : 'hover:bg-[#f8f9fa] cursor-pointer'} ${selectedEntryId === entry.id && !entry.isHoliday ? 'bg-purple-50' : ''}`}
                      onClick={() => !entry.isHoliday && setSelectedEntryId(entry.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-[#212529]">{entry.dayName}</div>
                        <div className="text-xs text-[#6c757d]">{formatFullDateIndonesian(entry.date)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {entry.isHoliday ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Libur
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            entry.taskCategory === 'Mengajar/Pendidikan' ? 'bg-blue-100 text-blue-800' :
                            entry.taskCategory === 'Administrasi/Manajerial' ? 'bg-green-100 text-green-800' :
                            entry.taskCategory === 'Pelatihan/Pengembangan' ? 'bg-yellow-100 text-yellow-800' :
                            entry.taskCategory ? 'bg-gray-100 text-gray-800' : 'bg-[#e9ecef] text-slate-400'
                          }`}>
                            {entry.taskCategory || 'Belum dipilih'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {entry.isHoliday ? (
                          <p className="text-xs text-[#6c757d] font-medium">{entry.description}</p>
                        ) : (
                          <p className="line-clamp-2 text-xs" title={entry.description}>{entry.description || <span className="text-slate-400 italic">Belum ada uraian</span>}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.isHoliday ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : entry.photo ? (
                          <div className="w-10 h-10 rounded overflow-hidden mx-auto border border-[#dee2e6]">
                            <img src={entry.photo} alt="Bukti" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCameraOpen && (
        <CameraCapture 
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCapture}
        />
      )}
    </div>
  );
};
