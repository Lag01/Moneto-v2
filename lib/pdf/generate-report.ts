import type { MonthlyPlan } from '@/store';
import { getPlanSummary } from '@/lib/monthly-plan';

export async function generatePdfReport(plan: MonthlyPlan): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }, { createRoot }, { createElement }] =
    await Promise.all([
      import('jspdf'),
      import('html2canvas-pro'),
      import('react-dom/client'),
      import('react'),
    ]);

  const { default: PdfReportLayout } = await import('@/components/pdf/PdfReportLayout');

  const summary = getPlanSummary(plan);

  // Créer un conteneur hors écran
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  // Rendre le composant
  const root = createRoot(container);
  root.render(createElement(PdfReportLayout, { plan, summary }));

  // Attendre le rendu D3 du Sankey (les <rect> dans le SVG)
  await new Promise<void>((resolve) => {
    let attempts = 0;
    const check = () => {
      const rects = container.querySelectorAll('svg rect');
      if (rects.length > 0 || attempts > 20) {
        resolve();
      } else {
        attempts++;
        setTimeout(check, 100);
      }
    };
    // Premier check après un court délai pour laisser React rendre
    setTimeout(check, 200);
  });

  // Capturer avec html2canvas
  const canvas = await html2canvas(container, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  // Générer le PDF A4
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  // Si l'image dépasse la page, on la redimensionne pour tenir
  const finalHeight = Math.min(imgHeight, pageHeight);
  const finalWidth = imgHeight > pageHeight ? (canvas.width * pageHeight) / canvas.height : imgWidth;

  pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);

  // Nettoyer le nom du fichier
  const safeName = plan.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  pdf.save(`rapport-${safeName}.pdf`);

  // Nettoyer
  root.unmount();
  document.body.removeChild(container);
}
