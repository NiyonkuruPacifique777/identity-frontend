function safeFilename(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 100) || 'resume';
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function captureResume(element) {
  if (!element) throw new Error('The resume preview is not available.');
  await document.fonts.ready;
  await Promise.all([...element.querySelectorAll('img')].map(image => image.decode()));

  const { default: html2canvas } = await import('html2canvas');
  const width = element.scrollWidth;
  const height = element.scrollHeight;
  if (!width || !height) throw new Error('The resume preview has no content to export.');

  return html2canvas(element, {
    allowTaint: false,
    backgroundColor: '#ffffff',
    height,
    logging: false,
    scale: Math.min(3, 12000 / Math.max(width, height)),
    useCORS: true,
    width
  });
}

function resumePages(canvas, pageWidth, pageHeight) {
  const sliceHeight = Math.floor(canvas.width * pageHeight / pageWidth);
  const pages = [];

  for (let top = 0; top < canvas.height; top += sliceHeight) {
    const height = Math.min(sliceHeight, canvas.height - top);
    const page = document.createElement('canvas');
    page.width = canvas.width;
    page.height = height;
    const context = page.getContext('2d');
    if (!context) throw new Error('Unable to prepare resume pages for download.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, page.width, page.height);
    context.drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height);
    pages.push(page);
  }
  return pages;
}

export async function downloadResumePdf({ element, filename }) {
  const { jsPDF } = await import('jspdf');
  const canvas = await captureResume(element);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 30;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const pages = resumePages(canvas, contentWidth, contentHeight);

  pdf.setProperties({ title: filename, subject: 'Resume' });
  pages.forEach((page, index) => {
    if (index) pdf.addPage();
    const imageHeight = page.height / page.width * contentWidth;
    pdf.addImage(page.toDataURL('image/jpeg', 0.96), 'JPEG', margin, margin, contentWidth, imageHeight);
  });
  download(pdf.output('blob'), `${safeFilename(filename)}.pdf`);
}

export async function downloadResumeWord({ element, filename }) {
  const { Document, ImageRun, Packer, Paragraph } = await import('docx');
  const canvas = await captureResume(element);
  const pageWidthTwips = 11906;
  const pageHeightTwips = 16838;
  const margins = { top: 865, right: 720, bottom: 865, left: 720 };
  const contentWidthPx = Math.floor((pageWidthTwips - margins.left - margins.right) / 1440 * 96);
  const contentHeightPx = (pageHeightTwips - margins.top - margins.bottom) / 1440 * 96;
  const pages = resumePages(canvas, contentWidthPx, contentHeightPx);
  const children = [];

  for (const [index, page] of pages.entries()) {
    const image = new Uint8Array(await new Promise((resolve, reject) => {
      page.toBlob(blob => {
        if (!blob) {
          reject(new Error('Unable to prepare a resume page for Word.'));
          return;
        }
        blob.arrayBuffer().then(resolve, reject);
      }, 'image/png');
    }));
    children.push(new Paragraph({
      pageBreakBefore: index > 0,
      spacing: { after: 0, before: 0 },
      children: [new ImageRun({
        data: image,
        type: 'png',
        transformation: {
          width: contentWidthPx,
          height: page.height / page.width * contentWidthPx
        }
      })]
    }));
  }

  const document = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: pageWidthTwips, height: pageHeightTwips },
          margin: margins
        }
      },
      children
    }]
  });
  download(await Packer.toBlob(document), `${safeFilename(filename)}.docx`);
}
