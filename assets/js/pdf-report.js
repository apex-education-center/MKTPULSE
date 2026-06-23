// MarketPulse — daily PDF market summary
window.MpReport = {
  async download() {
    if (!window.jspdf?.jsPDF) {
      Toast.show('PDF library loading — try again', 'warning');
      return;
    }
    Toast.show('Building PDF report…', 'info');
    try {
      const [wl, news, cal, analysis] = await Promise.all([
        window.apiClient.get('/api/watchlist', 0),
        window.apiClient.get('/api/news?period=today', 5 * 60 * 1000),
        window.apiClient.get('/api/calendar', 30 * 60 * 1000),
        window.apiClient.get('/api/analysis', 30 * 60 * 1000).catch(() => ({})),
      ]);
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = margin;
      const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(240, 165, 0);
      doc.text('MarketPulse Daily Report', margin, y);
      y += 18;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(date, margin, y);
      y += 24;

      const section = (title) => {
        if (y > 720) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text(title, margin, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      };

      section('MARKET PRICES');
      const rows = [
        ...(wl.crypto || []).slice(0, 4).map(a => [a.symbol, a.name, `$${Number(a.price).toLocaleString()}`, `${a.change_24h}%`]),
        ...(wl.stocks || []).slice(0, 4).map(a => [a.symbol, a.name, `$${Number(a.price).toLocaleString()}`, `${a.change_24h}%`]),
        ...(wl.commodities || []).slice(0, 3).map(a => [a.symbol, a.name, `$${Number(a.price).toLocaleString()}`, `${a.change_24h}%`]),
      ];
      rows.forEach(r => {
        doc.text(`${r[0]}  ${r[2]}  (${r[3]} 24h)`, margin, y);
        y += 12;
      });
      y += 10;

      section('TOP NEWS');
      (news || []).slice(0, 6).forEach(a => {
        const lines = doc.splitTextToSize(`• ${a.title}`, W - margin * 2);
        lines.forEach(line => { if (y > 750) { doc.addPage(); y = margin; } doc.text(line, margin, y); y += 11; });
      });
      y += 8;

      section('UPCOMING CALENDAR (7 DAYS)');
      const soon = (cal || []).filter(e => e.date).slice(0, 8);
      soon.forEach(e => {
        if (y > 750) { doc.addPage(); y = margin; }
        doc.text(`${e.date}  ${e.event}  [${(e.importance || '').toUpperCase()}]`, margin, y);
        y += 12;
      });
      y += 8;

      if (analysis?.summary || analysis?.insights || analysis?.analysis) {
        section('MARKET SUMMARY');
        const text = (analysis.summary || analysis.analysis || (analysis.insights || []).join(' ') || '').slice(0, 500);
        doc.splitTextToSize(text, W - margin * 2).forEach(line => {
          if (y > 750) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 11;
        });
      }

      doc.save(`marketpulse_report_${new Date().toISOString().split('T')[0]}.pdf`);
      Toast.show('PDF downloaded', 'success');
    } catch (e) {
      Toast.show('PDF failed — is backend running?', 'error');
    }
  },
};
