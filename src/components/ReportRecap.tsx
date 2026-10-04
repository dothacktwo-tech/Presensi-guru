import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ReportMetadata, ReportEntry } from '../types';
import { ReportPreview } from './ReportPreview';
import { X, FileText, Printer, FileSpreadsheet, Trash2, Calendar, User, Building, Clock, Image as ImageIcon, CheckCircle, Info, Eye } from 'lucide-react';
import { exportToWord } from '../wordExport';

interface ReportRecapProps {
  exportOrientation: 'portrait' | 'landscape';
}

export const ReportRecap: React.FC<ReportRecapProps> = ({ exportOrientation }) => {
  const [reports, setReports] = useState<{id: string, metadata: ReportMetadata, entries: ReportEntry[], createdAt: any}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<{id?: string, metadata: ReportMetadata, entries: ReportEntry[]} | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedReports: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedReports.push({ id: doc.id, ...doc.data() });
        });
        setReports(fetchedReports);
      } catch (err: any) {
        console.error(err);
        setError('Gagal memuat rekap laporan dari database.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; month: string } | null>(null);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    try {
      await deleteDoc(doc(db, 'reports', id));
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport && (selectedReport as any).id === id) {
        setSelectedReport(null);
      }
      toast.success('Laporan berhasil dihapus dari database.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus laporan.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedReport) return;
    try {
      const element = document.getElementById('recap-report-preview-container');
      if (!element) return;
      
      const html2pdf = (await import('@digivorefr/html2pdf.js')).default;
      const opt: any = {
        margin:       [10, 10, 10, 10],
        filename:     `Laporan_${selectedReport.metadata.employeeName.replace(/\s+/g, '_')}_${selectedReport.metadata.reportMonth.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: exportOrientation }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success('Dokumen PDF berhasil diunduh!');
    } catch (e) {
      console.error('Failed to generate PDF:', e);
      toast.error('Gagal membuat PDF. Pastikan koneksi internet stabil.');
    }
  };

  const handleExportWord = async () => {
    if (!selectedReport) return;
    try {
      await exportToWord(selectedReport.metadata, selectedReport.entries, exportOrientation);
      toast.success('Dokumen Word berhasil diunduh!');
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengespor ke Word");
    }
  };

  const handleExportExcel = () => {
    if (!selectedReport) return;
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
        <meta charset="utf-8">
      </head>
      <body>
        <table>
          <tr><td colspan="7" style="text-align: center; font-size: 14pt; font-weight: bold;">${selectedReport.metadata.title}</td></tr>
          <tr><td colspan="7" style="text-align: center; font-size: 14pt; font-weight: bold;">${selectedReport.metadata.school}</td></tr>
          <tr><td colspan="7" style="text-align: center; font-size: 14pt; font-weight: bold;">${selectedReport.metadata.branch}</td></tr>
          <tr><td colspan="7"></td></tr>
          <tr>
            <td colspan="2" style="font-weight: bold;">NAMA</td>
            <td colspan="5">: ${selectedReport.metadata.employeeName}</td>
          </tr>
          <tr>
            <td colspan="2" style="font-weight: bold;">BULAN</td>
            <td colspan="5">: ${selectedReport.metadata.reportMonth}</td>
          </tr>
          <tr><td colspan="7"></td></tr>
          <tr>
            <td style="${headerStyle} width: 40px;">NO</td>
            <td style="${headerStyle} width: 100px;">HARI</td>
            <td style="${headerStyle} width: 120px;">TANGGAL</td>
            <td style="${headerStyle} width: 150px;">WAKTU MULAI<br>S.D SELESAI</td>
            <td style="${headerStyle} width: 300px;">URAIAN PEKERJAAN</td>
            <td style="${headerStyle} width: 100px;">FOTO<br>KEHADIRAN</td>
            <td style="${headerStyle} width: 100px;">PARAF</td>
          </tr>
    `;

    selectedReport.entries.forEach((entry, idx) => {
      const dateObj = new Date(entry.date);
      const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      
      if (entry.isHoliday) {
        html += `
          <tr>
            <td style="${borderStyle} text-align: center;">${idx + 1}</td>
            <td style="${borderStyle} text-align: center;">${entry.dayName}</td>
            <td style="${borderStyle} text-align: center;">${formattedDate}</td>
            <td colspan="4" style="${borderStyle} text-align: center; color: red;"><b>HARI LIBUR</b></td>
          </tr>
        `;
      } else {
        html += `
          <tr>
            <td style="${borderStyle} text-align: center;">${idx + 1}</td>
            <td style="${borderStyle} text-align: center;">${entry.dayName}</td>
            <td style="${borderStyle} text-align: center;">${formattedDate}</td>
            <td style="${borderStyle} text-align: center;">${entry.duration}</td>
            <td style="${borderStyle}">${(entry.description || '').replace(/\n/g, '<br>')}</td>
            <td style="${borderStyle} text-align: center;">${entry.photo ? 'Ada Foto' : ''}</td>
            <td style="${borderStyle}"></td>
          </tr>
        `;
      }
    });

    html += `
        </table>
        <br>
        <table>
          <tr>
            <td colspan="4"></td>
            <td colspan="3" style="text-align: center;">${selectedReport.metadata.reportDate}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: center;">Mengesahkan,</td>
            <td></td>
            <td colspan="3" style="text-align: center;"></td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: center;">Kepala Sekolah</td>
            <td></td>
            <td colspan="3" style="text-align: center;">Pelapor</td>
          </tr>
          <tr><td colspan="7"></td></tr>
          <tr><td colspan="7"></td></tr>
          <tr><td colspan="7"></td></tr>
          <tr>
            <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">${selectedReport.metadata.principalName}</td>
            <td></td>
            <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">${selectedReport.metadata.reporterName}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: center;">NIP. ${selectedReport.metadata.principalNip || '-'}</td>
            <td></td>
            <td colspan="3" style="text-align: center;">NIP. ${selectedReport.metadata.reporterNip || '-'}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Kinerja_${selectedReport.metadata.employeeName.replace(/\s+/g, '_')}_${selectedReport.metadata.reportMonth.replace(/\s+/g, '_')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('File Excel berhasil diunduh!');
  };

  // Helper stats for selected report
  const totalEntries = selectedReport?.entries.length || 0;
  const workDaysCount = selectedReport?.entries.filter(e => !e.isHoliday).length || 0;
  const holidaysCount = selectedReport?.entries.filter(e => e.isHoliday).length || 0;
  const photoEntriesCount = selectedReport?.entries.filter(e => e.photo).length || 0;

  return (
    <div className="w-full h-full bg-[#f8f9fa] p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#212529]">Rekap Laporan</h1>
          <p className="text-sm text-[#6c757d] mt-1">Daftar semua laporan yang tersimpan. Klik pada baris laporan untuk membuka detail entri harian lengkap.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        ) : reports.length === 0 ? (
           <div className="bg-white border border-[#dee2e6] rounded-xl p-12 text-center shadow-sm">
             <div className="w-16 h-16 bg-[#e9ecef] rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <FileText className="w-8 h-8" />
             </div>
             <p className="text-[#495057] font-medium">Belum ada laporan yang disimpan.</p>
             <p className="text-sm text-[#6c757d] mt-1">Simpan laporan dari menu Data Laporan.</p>
           </div>
        ) : (
          <div className="bg-white border border-[#dee2e6] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#495057]">
                <thead className="bg-[#f8f9fa] text-xs uppercase font-semibold text-[#6c757d] border-b border-[#dee2e6]">
                  <tr>
                    <th className="px-6 py-4">Bulan Laporan</th>
                    <th className="px-6 py-4">Pegawai</th>
                    <th className="px-6 py-4">Instansi</th>
                    <th className="px-6 py-4">Disimpan Pada</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6]">
                  {reports.map((report) => (
                    <tr 
                      key={report.id} 
                      onClick={() => {
                        setSelectedReport({ id: report.id, metadata: report.metadata, entries: report.entries });
                        setActiveTab('details');
                      }}
                      className="hover:bg-purple-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-semibold text-[#212529] group-hover:text-[#6f42c1] transition-colors">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#6f42c1]" />
                          <span>{report.metadata?.reportMonth}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{report.metadata?.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400" />
                          <span>{report.metadata?.school}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setSelectedReport({ id: report.id, metadata: report.metadata, entries: report.entries });
                              setActiveTab('details');
                            }}
                            className="px-3 py-1.5 bg-[#6f42c1] text-white rounded-md text-xs font-medium hover:bg-[#59339d] transition-colors shadow-sm flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Detail</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: report.id, month: report.metadata?.reportMonth || 'ini' })}
                            className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors border border-red-200 text-xs font-medium flex items-center gap-1 shadow-sm"
                            title="Hapus Laporan dari Database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Entri Harian & Preview Document */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-hidden animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#6f42c1] text-xs font-bold uppercase tracking-wide">
                    Detail Rekap
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">
                    Laporan Kinerja - {selectedReport.metadata.reportMonth}
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                  <span><strong>Pegawai:</strong> {selectedReport.metadata.employeeName}</span>
                  <span>•</span>
                  <span><strong>Instansi:</strong> {selectedReport.metadata.school}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={handleExportWord}
                  className="px-3 py-1.5 border border-[#6f42c1] text-[#6f42c1] hover:bg-[#6f42c1] hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" /> Word
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 border border-[#28a745] text-[#28a745] hover:bg-[#28a745] hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="px-3 py-1.5 border border-[#dc3545] text-[#dc3545] hover:bg-[#dc3545] hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> PDF
                </button>
                {selectedReport.id && (
                  <button
                    onClick={() => setDeleteConfirm({ id: selectedReport.id!, month: selectedReport.metadata?.reportMonth || 'ini' })}
                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                )}
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'details'
                      ? 'bg-white text-[#6f42c1] shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  <span>Detail Entri Harian ({totalEntries} Hari)</span>
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'preview'
                      ? 'bg-white text-[#6f42c1] shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Pratinjau Dokumen Resmi</span>
                </button>
              </div>

              {/* KPI Summary Pills */}
              <div className="hidden lg:flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Hari Kerja: {workDaysCount}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  Libur: {holidaysCount}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                  Bukti Foto: {photoEntriesCount}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
              {activeTab === 'details' ? (
                <div className="space-y-6">
                  {/* Summary KPI Cards for Mobile/Tablet */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:hidden">
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 font-medium">Total Entri</p>
                      <p className="text-lg font-bold text-gray-900">{totalEntries} Hari</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 font-medium">Hari Kerja</p>
                      <p className="text-lg font-bold text-emerald-600">{workDaysCount} Hari</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 font-medium">Hari Libur</p>
                      <p className="text-lg font-bold text-amber-600">{holidaysCount} Hari</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 font-medium">Foto Kehadiran</p>
                      <p className="text-lg font-bold text-purple-600">{photoEntriesCount} Entri</p>
                    </div>
                  </div>

                  {/* Detailed Entries List / Table */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#6f42c1]" />
                        <span>Rincian Aktivitas & Absensi Per Hari</span>
                      </h3>
                      <span className="text-xs text-gray-500">Urut berdasarkan tanggal</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {selectedReport.entries.map((entry, index) => {
                        const dateObj = new Date(entry.date);
                        const formattedDateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

                        return (
                          <div 
                            key={entry.id || index} 
                            className={`p-4 sm:p-5 transition-colors ${
                              entry.isHoliday ? 'bg-amber-50/40' : 'hover:bg-gray-50/80'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              {/* Left column: Day & Date */}
                              <div className="sm:w-48 shrink-0">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-purple-100 text-[#6f42c1] font-bold text-xs flex items-center justify-center shrink-0">
                                    {index + 1}
                                  </span>
                                  <span className="font-bold text-gray-900 text-sm">{entry.dayName}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 pl-8">{formattedDateStr}</p>
                                
                                <div className="mt-2.5 pl-8 flex flex-wrap gap-1.5">
                                  {entry.isHoliday ? (
                                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[11px] inline-flex items-center gap-1">
                                      <Info className="w-3 h-3" /> Hari Libur
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px] inline-flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" /> Hari Kerja
                                    </span>
                                  )}

                                  {entry.duration && !entry.isHoliday && (
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-500" /> {entry.duration}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Middle column: Detailed Work Description */}
                              <div className="flex-1 bg-gray-50/70 p-3.5 rounded-lg border border-gray-200/80">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                  Uraian Kegiatan / Pekerjaan:
                                </p>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-normal">
                                  {entry.isHoliday 
                                    ? ((entry as any).name ? `Hari Libur: ${(entry as any).name}` : (entry.description || 'Libur / Tidak Ada Kegiatan Kinerja.'))
                                    : (entry.description || 'Tidak ada deskripsi kegiatan.')}
                                </p>
                              </div>

                              {/* Right column: Attendance Photo */}
                              <div className="sm:w-36 shrink-0 flex flex-col items-center justify-center">
                                {entry.photo ? (
                                  <div 
                                    onClick={() => setZoomedImage(entry.photo || null)}
                                    className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-gray-100"
                                  >
                                    <img 
                                      src={entry.photo} 
                                      alt={`Foto ${entry.date}`}
                                      className="w-28 h-20 object-cover group-hover:scale-105 transition-transform" 
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Perbesar</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-28 h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                    <ImageIcon className="w-4 h-4 mb-1 opacity-50" />
                                    <span className="text-[10px]">Tanpa Foto</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Official Document Preview Tab */
                <div className="flex justify-center p-2 sm:p-4">
                  <div id="recap-report-preview-container" className="w-full max-w-[1000px] bg-white shadow-lg min-h-[640px] p-8 sm:p-10 flex flex-col border border-[#dee2e6] border-t-[4px] border-t-[#6f42c1] rounded-b-xl">
                    <ReportPreview metadata={selectedReport.metadata} entries={selectedReport.entries} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Foto */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="relative max-w-3xl w-full bg-white rounded-xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedImage} alt="Foto Kehadiran" className="w-full max-h-[80vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
            </div>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus laporan bulan <span className="font-semibold text-gray-800">{deleteConfirm.month}</span>? Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

