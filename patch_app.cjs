const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/bg-\[\#343a40\] text-\[\#c2c7d0\]/g, 'bg-white border-r border-[#dee2e6] text-[#333]');
code = code.replace(/text-\[\#c2c7d0\]/g, 'text-slate-500');
code = code.replace(/hover:bg-\[\#494e53\] hover:text-white/g, 'hover:bg-purple-50 hover:text-[#6f42c1] text-slate-600');

fs.writeFileSync('src/App.tsx', code);
