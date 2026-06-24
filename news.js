// MarketPulse — Excel / CSV export helpers
window.MpExport = {
  parseDate(iso) {
    if (!iso) return null;
    const s = String(iso).substring(0, 10);
    const d = new Date(s + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  },

  calendarRows(events) {
    const rows = [['Date', 'Day', 'Event', 'Country', 'Importance', 'Estimate', 'Previous', 'Actual']];
    (events || []).forEach(e => {
      const d = this.parseDate(e.date);
      rows.push([
        d || e.date || '',
        d ? d.toLocaleDateString('en-US', { weekday: 'long' }) : '',
        e.event || '',
        e.country || '',
        e.importance || '',
        e.estimate ?? '',
        e.previous ?? '',
        e.actual ?? '',
      ]);
    });
    return rows;
  },

  priceRows(assets) {
    const rows = [['Symbol', 'Name', 'Type', 'Price', '24h %', '7d %', 'Volume', 'Market Cap']];
    (assets || []).forEach(a => {
      rows.push([
        a.symbol,
        a.name,
        a.type || '',
        a.price,
        a.change_24h,
        a.change_7d,
        a.volume,
        a.market_cap || '',
      ]);
    });
    return rows;
  },

  downloadExcel(rows, filename, opts = {}) {
    if (!rows || rows.length <= 1) {
      window.Toast?.show('No data to export', 'warning');
      return false;
    }
    if (!window.XLSX) {
      this.downloadCsv(rows, filename.replace(/\.xlsx$/i, '.csv'));
      return true;
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const dateCols = opts.dateCols || [];
    for (let r = 1; r < rows.length; r++) {
      dateCols.forEach(c => {
        const ref = XLSX.utils.encode_cell({ r, c });
        const val = rows[r][c];
        if (val instanceof Date && !isNaN(val.getTime())) {
          ws[ref] = { t: 'd', v: val, z: 'yyyy-mm-dd' };
        }
      });
    }
    if (opts.colWidths) {
      ws['!cols'] = opts.colWidths.map(w => ({ wch: w }));
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, opts.sheetName || 'Data');
    const name = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, name);
    window.Toast?.show(`Exported ${name}`, 'success');
    return true;
  },

  downloadCsv(rows, filename) {
    if (!rows || rows.length <= 1) {
      window.Toast?.show('No data to export', 'warning');
      return false;
    }
    const csv = rows.map(r => r.map(v => {
      if (v instanceof Date) return `"${v.toISOString().slice(0, 10)}"`;
      return `"${String(v ?? '').replace(/"/g, '""')}"`;
    }).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    window.Toast?.show(`Exported ${a.download}`, 'success');
    return true;
  },
};
