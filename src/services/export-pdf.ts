'use client';

export async function downloadPdfDirectly(title: string, subject: string, topic: string, markdownContent: string) {
  try {
    const html2pdf = (await import('html2pdf.js')).default;

    const element = document.createElement('div');
    element.className = 'pdf-export-container';
    element.style.padding = '30px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#0f172a';
    element.style.backgroundColor = '#ffffff';

    element.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
        <span style="background-color: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold;">
          CONCURSOS AI - MATERIAL DE ESTUDO
        </span>
        <h1 style="font-size: 20px; color: #1e1b4b; margin-top: 10px; margin-bottom: 5px;">${title}</h1>
        <p style="font-size: 12px; color: #64748b; margin: 0;">
          <b>Matéria:</b> ${subject} &nbsp;|&nbsp; <b>Tópico:</b> ${topic}
        </p>
      </div>
      <div style="font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word;">
        ${markdownContent
          .replace(/# (.*)/g, '<h2 style="color:#3730a3; border-bottom:1px solid #e2e8f0; padding-bottom:5px; margin-top:20px;">$1</h2>')
          .replace(/## (.*)/g, '<h3 style="color:#1e1b4b; margin-top:15px;">$1</h3>')
          .replace(/### (.*)/g, '<h4 style="color:#4338ca; margin-top:10px;">$1</h4>')}
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    };

    await html2pdf().set(opt).from(element).save();
    return true;
  } catch (err) {
    console.warn('Fallback para download HTML/PDF nativo:', err);
    
    const blob = new Blob(
      [
        `==================================================\n` +
        `CONCURSOS AI - MATERIAL DE ESTUDO\n` +
        `Título: ${title}\n` +
        `Matéria: ${subject} | Tópico: ${topic}\n` +
        `==================================================\n\n` +
        markdownContent
      ],
      { type: 'text/markdown;charset=utf-8' }
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    link.click();
    return true;
  }
}
