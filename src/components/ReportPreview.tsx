import React, { useEffect, useState } from 'react';
import { ReportEntry, ReportMetadata } from '../types';
import { formatDateIndonesian } from '../utils';

interface ReportPreviewProps {
  metadata: ReportMetadata;
  entries: ReportEntry[];
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ metadata, entries }) => {
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    const savedSig = localStorage.getItem('user_signature');
    if (savedSig) {
      setSignature(savedSig);
    }
  }, []);

  return (
    <div className="w-full bg-white print:p-0 p-8 min-h-screen text-black">
      {/* Header */}
      <div className="text-center font-bold text-[15px] mb-6 leading-tight font-serif">
        <p>{metadata.title}</p>
        <p>{metadata.school}</p>
        <p>{metadata.branch}</p>
      </div>

      <div className="mb-2 font-bold text-sm grid grid-cols-[80px_10px_1fr]">
        <div>NAMA</div>
        <div>:</div>
        <div>{metadata.employeeName}</div>
        
        <div>BULAN</div>
        <div>:</div>
        <div>{metadata.reportMonth}</div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-black text-[13px] mb-8 table-fixed">
        <thead className="bg-[#e6f0fa]">
          <tr>
            <th className="border border-black py-2 px-2 w-[40px]">NO</th>
            <th className="border border-black py-2 px-2 w-[70px]">HARI</th>
            <th className="border border-black py-2 px-2 w-[90px]">TANGGAL</th>
            <th className="border border-black py-2 px-2 w-[80px]">WAKTU MULAI</th>
            <th className="border border-black py-2 px-2 text-left">URAIAN PEKERJAAN</th>
            <th className="border border-black py-2 px-2 w-[120px]">FOTO</th>
            <th className="border border-black py-2 px-2 w-[60px]">PARAF</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.id} className={entry.isHoliday ? 'bg-gray-300' : 'bg-white'}>
              <td className="border border-black py-1 px-2 text-center align-top">{index + 1}</td>
              <td className="border border-black py-1 px-2 align-top">{entry.dayName}</td>
              <td className="border border-black py-1 px-2 align-top">{formatDateIndonesian(entry.date)}</td>
              <td className="border border-black py-1 px-2 text-center align-top">{entry.duration}</td>
              <td className="border border-black py-1 px-2 align-top break-words whitespace-pre-wrap">{entry.description}</td>
              <td className="border border-black p-1 text-center align-middle h-[70px]">
                {entry.photo && (
                  <img src={entry.photo} alt="Foto kegiatan" className="max-w-[100px] max-h-[70px] mx-auto object-contain" />
                )}
                {!entry.photo && entry.isHoliday && <span className="text-center w-full block">-</span>}
              </td>
              <td className="border border-black py-1 px-2 text-center align-top">
                 - 
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer / Signatures */}
      <table className="w-full text-[13px] border-collapse border border-dashed border-gray-400 print:border-none">
         <tbody>
            <tr>
              <td className="w-1/2 align-top pt-2 pb-16 relative">
                 <div>KEPALA SEKOLAH</div>
              </td>
              <td className="w-1/2 align-top pt-2 pb-16 pl-10 relative">
                 <div>{metadata.reportDate}</div>
                 <div>PELAPOR</div>
                 {signature && (
                   <div className="absolute top-10 left-10 w-24 h-24">
                     <img src={signature} alt="Tanda Tangan" className="w-full h-full object-contain" />
                   </div>
                 )}
              </td>
            </tr>
            <tr>
              <td className="font-bold border-b border-dashed border-gray-400 print:border-none">
                {metadata.principalName}
              </td>
              <td className="font-bold border-b border-dashed border-gray-400 print:border-none pl-10">
                {metadata.reporterName}
              </td>
            </tr>
            <tr>
              <td className="">
                NIP. {metadata.principalNip || '-'}
              </td>
              <td className="pl-10">
                NIP. {metadata.reporterNip || '-'}
              </td>
            </tr>
         </tbody>
      </table>
    </div>
  );
};
