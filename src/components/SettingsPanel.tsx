import React, { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Download, Save, FileText, PenTool } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { ReportMetadata, ReportEntry } from '../types';

interface SettingsPanelProps {
  metadata: ReportMetadata;
  entries: ReportEntry[];
  exportOrientation: 'portrait' | 'landscape';
  setExportOrientation: (orientation: 'portrait' | 'landscape') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ metadata, entries, exportOrientation, setExportOrientation }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  useEffect(() => {
    const savedSig = localStorage.getItem('user_signature');
    if (savedSig) {
      setSignatureData(savedSig);
    }
  }, []);

  const handleExportBackup = () => {
    const backupData = {
      metadata,
      entries,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_laporan_${metadata.reportMonth.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Backup data JSON berhasil diunduh!');
  };

  return (
    <div className="w-full h-full bg-[#f8f9fa] p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#212529]">Pengaturan</h1>
          <p className="text-sm text-[#6c757d] mt-1">Kelola data dan preferensi aplikasi Anda.</p>
        </div>
        
        <div className="bg-white border border-[#dee2e6] rounded shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#dee2e6] bg-[#f8f9fa]/50">
            <h2 className="text-base font-bold text-[#343a40] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#6c757d]" />
              Preferensi Unduhan Dokumen
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#495057] mb-4">
              Pilih orientasi halaman yang diinginkan saat mengunduh laporan dalam format PDF atau Word.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className={`flex-1 flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${exportOrientation === 'portrait' ? 'border-[#6f42c1] bg-purple-50' : 'border-[#dee2e6] hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="orientation" 
                  value="portrait"
                  checked={exportOrientation === 'portrait'}
                  onChange={() => setExportOrientation('portrait')}
                  className="w-4 h-4 text-[#6f42c1] focus:ring-[#6f42c1]"
                />
                <div>
                  <div className="font-semibold text-[#212529]">Portrait</div>
                  <div className="text-xs text-[#6c757d] mt-0.5">Orientasi vertikal, cocok untuk kolom lebih sedikit.</div>
                </div>
              </label>
              <label className={`flex-1 flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${exportOrientation === 'landscape' ? 'border-[#6f42c1] bg-purple-50' : 'border-[#dee2e6] hover:bg-slate-50'}`}>
                <input 
                  type="radio" 
                  name="orientation" 
                  value="landscape"
                  checked={exportOrientation === 'landscape'}
                  onChange={() => setExportOrientation('landscape')}
                  className="w-4 h-4 text-[#6f42c1] focus:ring-[#6f42c1]"
                />
                <div>
                  <div className="font-semibold text-[#212529]">Landscape</div>
                  <div className="text-xs text-[#6c757d] mt-0.5">Orientasi horizontal, optimal untuk tabel laporan yang lebar.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#dee2e6] rounded shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#dee2e6] bg-[#f8f9fa]/50">
            <h2 className="text-base font-bold text-[#343a40] flex items-center gap-2">
              <Save className="w-5 h-5 text-[#6c757d]" />
              Backup & Restore Data
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#495057] mb-4">
              Anda dapat mencadangkan seluruh data laporan Anda (termasuk foto absensi dan uraian kerja) ke dalam file JSON lokal. File ini dapat digunakan sebagai cadangan jika data di browser terhapus.
            </p>
            <button 
              onClick={handleExportBackup}
              className="px-4 py-2 bg-[#343a40] text-white rounded text-sm font-semibold shadow hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Data ke JSON
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#dee2e6] rounded shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#dee2e6] bg-[#f8f9fa]/50">
            <h2 className="text-base font-bold text-[#343a40] flex items-center gap-2">
              <PenTool className="w-5 h-5 text-[#6c757d]" />
              Tanda Tangan Digital
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#495057] mb-4">
              Buat tanda tangan Anda di bawah ini. Tanda tangan ini akan disimpan dan secara otomatis ditampilkan di bagian bawah dokumen laporan saat diunduh.
            </p>
            
            <div className="border border-[#dee2e6] rounded bg-[#f8f9fa] overflow-hidden mb-4 relative" style={{ width: '100%', maxWidth: '500px', height: '200px' }}>
              <SignatureCanvas 
                ref={sigCanvas} 
                penColor="black"
                canvasProps={{ className: 'w-full h-full cursor-crosshair' }} 
              />
              {signatureData && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded shadow-sm">Tersimpan</div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  sigCanvas.current?.clear();
                  setSignatureData(null);
                  localStorage.removeItem('user_signature');
                  toast.success('Tanda tangan digital berhasil dihapus.');
                }}
                className="px-4 py-2 border border-[#dee2e6] text-[#495057] rounded text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Hapus
              </button>
              <button 
                onClick={() => {
                  if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
                    const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
                    setSignatureData(dataUrl);
                    localStorage.setItem('user_signature', dataUrl);
                    toast.success('Tanda tangan digital berhasil disimpan!');
                  } else {
                    toast.error('Harap buat tanda tangan terlebih dahulu sebelum menyimpan.');
                  }
                }}
                className="px-4 py-2 bg-[#6f42c1] text-white rounded text-sm font-semibold shadow-sm hover:bg-[#59339d] transition-colors"
              >
                Simpan Tanda Tangan
              </button>
            </div>
            
            {signatureData && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[#343a40] mb-2">Preview Tanda Tangan Tersimpan:</h3>
                <div className="border border-[#dee2e6] rounded p-4 bg-white inline-block">
                  <img src={signatureData} alt="Tanda Tangan" className="max-h-24" />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
