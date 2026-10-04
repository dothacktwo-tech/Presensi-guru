const fs = require('fs');
let code = fs.readFileSync('src/components/DailyAttendance.tsx', 'utf-8');

code = code.replace(/workingDays\.length === 0/g, 'entries.length === 0');
code = code.replace(/Tidak ada data hari kerja di bulan ini\./g, 'Tidak ada data di bulan ini.');

// Now replace the mapping logic
code = code.replace(
  /workingDays\.map\(entry => \(/,
  `entries.map(entry => (
                    <tr 
                      key={entry.id} 
                      className={\`hover:bg-slate-50 transition-colors \${entry.isHoliday ? 'bg-gray-100 opacity-60' : 'cursor-pointer'} \${selectedEntryId === entry.id ? 'bg-indigo-50' : ''}\`}
                      onClick={() => !entry.isHoliday && setSelectedEntryId(entry.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{entry.dayName}</div>
                        <div className="text-xs text-slate-500">{formatFullDateIndonesian(entry.date)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {entry.isHoliday ? (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                             Libur
                           </span>
                        ) : (
                          <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${
                            entry.taskCategory === 'Mengajar/Pendidikan' ? 'bg-blue-100 text-blue-800' :
                            entry.taskCategory === 'Administrasi/Manajerial' ? 'bg-green-100 text-green-800' :
                            entry.taskCategory === 'Pelatihan/Pengembangan' ? 'bg-yellow-100 text-yellow-800' :
                            entry.taskCategory ? 'bg-gray-100 text-gray-800' : 'bg-slate-100 text-slate-400'
                          }\`}>
                            {entry.taskCategory || 'Belum dipilih'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {entry.isHoliday ? (
                          <p className="text-xs text-slate-500 font-medium">{entry.description}</p>
                        ) : (
                          <p className="line-clamp-2 text-xs" title={entry.description}>{entry.description || <span className="text-slate-400 italic">Belum ada uraian</span>}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.isHoliday ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : entry.photo ? (
                          <div className="w-10 h-10 rounded overflow-hidden mx-auto border border-slate-200">
                            <img src={entry.photo} alt="Bukti" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))`
);

// We need to carefully remove the old mapping logic.
// The old code was:
// workingDays.map(entry => (
//   <tr key={entry.id} className={...} onClick={...}> ... </tr>
// ))
// The regex above just replaced `workingDays.map(entry => (` with the new block. But the rest of the old block is still there! So we need a better replace.
