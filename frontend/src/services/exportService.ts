import type jsPDF from 'jspdf';
import { StorybookExport, DiaryEntry, WellnessInsights } from '../types';

export class ExportService {
  static async exportToPDF(storybook: StorybookExport): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    const textToCheck = (storybook.title || '') + ' ' + (storybook.generatedContent || '');
    const hasDevanagari = /[\u0900-\u097F]/.test(textToCheck);

    if (hasDevanagari) {
      await this.exportViaCanvas(pdf, storybook, pageWidth, pageHeight, html2canvas);
    } else {
      await this.exportStandardWithCover(pdf, storybook, pageWidth, pageHeight, html2canvas);
    }

    const safeTitle = storybook.title
      .replace(/[^\p{L}\p{M}\p{N}\s]/gu, '')
      .trim()
      .replace(/\s+/g, '_') || 'Storybook';
    pdf.save(`${safeTitle}_Memoir.pdf`);
  }

  private static async exportViaCanvas(
    pdf: jsPDF,
    storybook: StorybookExport,
    pageWidth: number,
    pageHeight: number,
    html2canvas: (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>
  ): Promise<void> {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '650px';
    container.style.minHeight = '900px';
    container.style.zIndex = '-100';
    document.body.appendChild(container);

    const themeGradients: Record<string, string> = {
      romantic: 'linear-gradient(135deg, #4c0519 0%, #831843 50%, #500724 100%)',
      dramatic: 'linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #0f172a 100%)',
      adventure: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #451a03 100%)',
      mystery: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #0c4a6e 100%)',
      comedy: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #713f12 100%)'
    };

    const gradient = themeGradients[storybook.theme] || themeGradients.dramatic;

    try {
      // 1. Cover Page
      container.innerHTML = `
        <div style="width: 650px; height: 920px; padding: 48px; background: ${gradient}; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; align-items: center; box-sizing: border-box; font-family: 'Georgia', serif; text-align: center; border: 2px solid rgba(255,255,255,0.2);">
          <div style="font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.7); padding-top: 16px;">
            MINDDIARY MEMOIR
          </div>
          <div style="max-width: 520px; margin: auto 0;">
            <h1 style="font-size: 34px; line-height: 1.35; margin: 0 0 16px 0; font-weight: bold; color: #ffffff;">
              ${storybook.title}
            </h1>
            ${storybook.protagonist?.name ? `<p style="font-size: 16px; font-style: italic; color: rgba(255,255,255,0.85); margin: 0;">A journey of ${storybook.protagonist.name}</p>` : ''}
            <div style="width: 60px; height: 2px; background: rgba(255,255,255,0.3); margin: 20px auto;"></div>
          </div>
          <div style="width: 100%; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 16px; font-size: 12px; display: flex; justify-content: space-between; color: rgba(255,255,255,0.6); font-family: sans-serif;">
            <span style="text-transform: capitalize;">${storybook.theme} Theme</span>
            <span>Created with MindDiary AI</span>
          </div>
        </div>
      `;

      const coverCanvas = await html2canvas(container.firstElementChild as HTMLElement, { scale: 2 });
      pdf.addImage(coverCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);

      // 2. Chapters (with shaped Hindi / Devanagari text)
      const chapters = storybook.chapters && storybook.chapters.length > 0
        ? storybook.chapters
        : [{ chapterNumber: 1, title: 'Reflections', content: storybook.generatedContent || '' }];

      for (let i = 0; i < chapters.length; i++) {
        pdf.addPage();
        const ch = chapters[i];
        container.innerHTML = `
          <div style="width: 650px; min-height: 920px; padding: 56px 48px; background: #faf8f5; color: #1c1917; box-sizing: border-box; font-family: 'Georgia', 'Noto Sans Devanagari', serif;">
            <div style="border-bottom: 2px solid #e7e5e4; padding-bottom: 16px; margin-bottom: 28px;">
              <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #78716c; font-family: sans-serif;">
                CHAPTER ${ch.chapterNumber || i + 1}
              </div>
              <h2 style="font-size: 26px; line-height: 1.3; margin: 8px 0 0 0; color: #0c0a09; font-weight: bold;">
                ${ch.title}
              </h2>
            </div>
            <div style="font-size: 17px; line-height: 1.85; color: #292524; white-space: pre-line; text-align: justify;">
              ${ch.content}
            </div>
            <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #e7e5e4; display: flex; justify-content: space-between; font-size: 11px; color: #a8a29e; font-family: sans-serif;">
              <span>${storybook.title}</span>
              <span>Chapter ${i + 1} of ${chapters.length}</span>
            </div>
          </div>
        `;
        const chCanvas = await html2canvas(container.firstElementChild as HTMLElement, { scale: 2 });
        pdf.addImage(chCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);
      }
    } finally {
      document.body.removeChild(container);
    }
  }

  private static async exportStandardWithCover(
    pdf: jsPDF,
    storybook: StorybookExport,
    pageWidth: number,
    pageHeight: number,
    html2canvas: (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>
  ): Promise<void> {
    // Generate themed visual cover for Page 1
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '650px';
    container.style.height = '920px';
    container.style.zIndex = '-100';
    document.body.appendChild(container);

    const themeGradients: Record<string, string> = {
      romantic: 'linear-gradient(135deg, #4c0519 0%, #831843 50%, #500724 100%)',
      dramatic: 'linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #0f172a 100%)',
      adventure: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #451a03 100%)',
      mystery: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #0c4a6e 100%)',
      comedy: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #713f12 100%)'
    };
    const gradient = themeGradients[storybook.theme] || themeGradients.dramatic;

    try {
      container.innerHTML = `
        <div style="width: 650px; height: 920px; padding: 48px; background: ${gradient}; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; align-items: center; box-sizing: border-box; font-family: 'Georgia', serif; text-align: center; border: 2px solid rgba(255,255,255,0.2);">
          <div style="font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.7); padding-top: 16px;">
            MINDDIARY MEMOIR
          </div>
          <div style="max-width: 520px; margin: auto 0;">
            <h1 style="font-size: 34px; line-height: 1.35; margin: 0 0 16px 0; font-weight: bold; color: #ffffff;">
              ${storybook.title}
            </h1>
            ${storybook.protagonist?.name ? `<p style="font-size: 16px; font-style: italic; color: rgba(255,255,255,0.85); margin: 0;">A journey of ${storybook.protagonist.name}</p>` : ''}
            <div style="width: 60px; height: 2px; background: rgba(255,255,255,0.3); margin: 20px auto;"></div>
          </div>
          <div style="width: 100%; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 16px; font-size: 12px; display: flex; justify-content: space-between; color: rgba(255,255,255,0.6); font-family: sans-serif;">
            <span style="text-transform: capitalize;">${storybook.theme} Theme</span>
            <span>Created with MindDiary AI</span>
          </div>
        </div>
      `;
      const coverCanvas = await html2canvas(container.firstElementChild as HTMLElement, { scale: 2 });
      pdf.addImage(coverCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);
    } finally {
      document.body.removeChild(container);
    }

    // Page 2: Dedication & Preface
    pdf.addPage();
    let pageNumber = 2;
    this.createDedicationPage(pdf, storybook, pageWidth, pageHeight);

    // Page 3: Table of contents
    pdf.addPage();
    pageNumber++;
    const chapters = this.extractChapters(storybook.generatedContent);
    this.createProfessionalTableOfContents(pdf, chapters, pageWidth, pageHeight, 30);

    // Page 4+: Chapters
    pdf.addPage();
    pageNumber++;
    const margin = 30;
    const textWidth = pageWidth - margin * 2;
    const lineHeight = 7;
    let yPosition = margin + 30;

    const lines = storybook.generatedContent.split('\n');
    let isFirstChapter = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') {
        yPosition += lineHeight * 0.8;
        continue;
      }

      if (line.startsWith('---')) {
        if (i < lines.length - 1) {
          this.addProfessionalPageFooter(pdf, pageNumber, pageWidth, pageHeight);
          pdf.addPage();
          pageNumber++;
          yPosition = margin + 30;
          this.addProfessionalPageHeader(pdf, storybook.title, pageWidth, margin);
          yPosition += 20;
        }
        continue;
      }

      if (line.startsWith('##')) {
        const result = this.addProfessionalChapterHeading(
          pdf,
          line,
          yPosition,
          margin,
          textWidth,
          pageWidth,
          pageHeight,
          pageNumber,
          storybook.title,
          isFirstChapter
        );

        if (result.newPage) {
          pageNumber++;
          yPosition = result.yPosition;
        } else {
          yPosition = result.yPosition;
        }

        isFirstChapter = false;
        continue;
      }

      const result = this.addProfessionalParagraph(
        pdf,
        line,
        yPosition,
        margin,
        textWidth,
        lineHeight,
        pageWidth,
        pageHeight,
        pageNumber,
        storybook.title
      );

      if (result.newPage) {
        pageNumber++;
        yPosition = result.yPosition;
      } else {
        yPosition = result.yPosition;
      }
    }

    this.addProfessionalPageFooter(pdf, pageNumber, pageWidth, pageHeight);
  }

  private static createDedicationPage(pdf: jsPDF, _storybook: StorybookExport, pageWidth: number, pageHeight: number): void {
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
  
    pdf.setFontSize(14);
    pdf.setFont('times', 'italic');
    pdf.setTextColor(80, 80, 80);
    
    const dedicationLines = [
      'This story is dedicated to the moments',
      'that shape us, the experiences that',
      'transform us, and the courage it takes',
      'to live authentically.',
      '',
      'Every entry in this collection represents',
      'a step in the beautiful journey',
      'of becoming who we are meant to be.'
    ];
    
    let yPos = centerY - (dedicationLines.length * 10);
    
    dedicationLines.forEach(line => {
      if (line.trim() === '') {
        yPos += 15;
        return;
      }
      const lineWidth = pdf.getTextWidth(line);
      pdf.text(line, centerX - (lineWidth / 2), yPos);
      yPos += 20;
    });
 
    yPos += 30;
  }

  private static createProfessionalTableOfContents(pdf: jsPDF, chapters: { title: string; page: number }[], pageWidth: number, pageHeight: number, margin: number): void {
    const centerX = pageWidth / 2;
    let yPosition = margin + 40;
 
    pdf.setFontSize(24);
    pdf.setFont('times', 'bold');
    pdf.setTextColor(40, 40, 40);
    const tocTitle = 'Table of Contents';
    const tocTitleWidth = pdf.getTextWidth(tocTitle);
    pdf.text(tocTitle, centerX - (tocTitleWidth / 2), yPosition);
         pdf.setDrawColor(120, 120, 120);
    pdf.setLineWidth(0.8);
    pdf.line(centerX - 60, yPosition + 10, centerX + 60, yPosition + 10);
    
    yPosition += 50;
     
    pdf.setFontSize(12);
    pdf.setTextColor(60, 60, 60);
    
    chapters.forEach((chapter, index) => {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin + 40;
      }
      
      
      const chapterNum = this.toRomanNumeral(index + 1);
      pdf.setFont('times', 'bold');
      pdf.text(chapterNum, margin, yPosition);
      
      pdf.setFont('times', 'normal');
      const maxTitleWidth = pageWidth - margin * 2 - 80;
      const chapterTitle = chapter.title.length > 60 ? 
        chapter.title.substring(0, 57) + '...' : 
        chapter.title;
      
      const titleLines = pdf.splitTextToSize(chapterTitle, maxTitleWidth);
      let titleY = yPosition;
      
      titleLines.forEach((line: string, lineIndex: number) => {
        const xPos = lineIndex === 0 ? margin + 25 : margin + 25;
        pdf.text(line, xPos, titleY);
        if (lineIndex < titleLines.length - 1) {
          titleY += 14;
        }
      });
      
 
      const pageNum = chapter.page.toString();
      const pageNumWidth = pdf.getTextWidth(pageNum);
      pdf.setFont('times', 'bold');
      pdf.text(pageNum, pageWidth - margin - pageNumWidth, yPosition);
      
 
    const lineStartX = margin + 25 + Math.min(pdf.getTextWidth(titleLines[0] || ''), pageWidth - margin * 2 - 120);
    const lineEndX = pageWidth - margin - pageNumWidth - 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(lineStartX, yPosition - 3, lineEndX, yPosition - 3);
      yPosition += Math.max(20, titleLines.length * 14 + 6);
    });
  }

  private static toRomanNumeral(num: number): string {
    const values = [10, 9, 5, 4, 1];
    const numerals = ['X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    
    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += numerals[i];
        num -= values[i];
      }
    }
    
    return result;
  }

   
  private static extractChapters(content: string): { title: string; page: number }[] {
    const chapters: { title: string; page: number }[] = [];
    const lines = content.split('\n');
    let pageCount = 4; 
    let lineCount = 0;
    const linesPerPage = 40;
    
    for (const line of lines) {
      if (line.trim().startsWith('##')) {
        const title = line.replace('##', '').trim();
        chapters.push({ title, page: Math.ceil(pageCount + (lineCount / linesPerPage)) });
      }
      if (line.trim() !== '') {
        lineCount += Math.ceil(line.length / 85) || 1;
      }
      if (line.trim() === '---') {
        pageCount++;
        lineCount = 0;
      }
    }
    
    return chapters;
  }

  private static addProfessionalPageHeader(pdf: jsPDF, title: string, pageWidth: number, margin: number): void {
    pdf.setFontSize(10);
    pdf.setFont('times', 'italic');
    pdf.setTextColor(120, 120, 120);
    
    const headerTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
    const headerWidth = pdf.getTextWidth(headerTitle);
    pdf.text(headerTitle, (pageWidth / 2) - (headerWidth / 2), margin - 5);
    
     
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 20, margin + 2, pageWidth - margin - 20, margin + 2);
  }

  private static addProfessionalPageFooter(pdf: jsPDF, pageNumber: number, pageWidth: number, pageHeight: number): void {
    const margin = 30;  
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 20, pageHeight - 35, pageWidth - margin - 20, pageHeight - 35);
     
    pdf.setFontSize(11);
    pdf.setFont('times', 'normal');
    pdf.setTextColor(120, 120, 120);
    
    const pageText = `— ${pageNumber} —`;
    const pageWidth_text = pdf.getTextWidth(pageText);
    pdf.text(pageText, (pageWidth / 2) - (pageWidth_text / 2), pageHeight - 20);
  }

  private static addProfessionalChapterHeading(
    pdf: jsPDF, 
    line: string, 
    yPosition: number, 
    margin: number, 
    textWidth: number,
    pageWidth: number,
    pageHeight: number,
    pageNumber: number,
    bookTitle: string,
    isFirstChapter: boolean
  ): { yPosition: number; newPage: boolean } {
    let newPage = false;
     
    if (yPosition > pageHeight - 150 && !isFirstChapter) {
      this.addProfessionalPageFooter(pdf, pageNumber, pageWidth, pageHeight);
      pdf.addPage();
      newPage = true;
      yPosition = margin + 30;
      this.addProfessionalPageHeader(pdf, bookTitle, pageWidth, margin);
      yPosition += 20;
    }
    
    const chapterText = line.replace('##', '').trim();
     
    if (!isFirstChapter) {
      yPosition += 30;
    }
     
    yPosition += 10;
     
    pdf.setFontSize(20);
    pdf.setFont('times', 'bold');
    pdf.setTextColor(40, 40, 40);
    
    const titleLines = pdf.splitTextToSize(chapterText, textWidth - 60);
    titleLines.forEach((titleLine: string) => {
      const titleWidth = pdf.getTextWidth(titleLine);
      pdf.text(titleLine, (pageWidth / 2) - (titleWidth / 2), yPosition);
      yPosition += 25;
    });
     
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(0.8);
    const lineStart = (pageWidth / 2) - 40;
    const lineEnd = (pageWidth / 2) + 40;
    pdf.line(lineStart, yPosition + 5, lineEnd, yPosition + 5);
    
    yPosition += 35;
    
    return { yPosition, newPage };
  }

  private static addProfessionalParagraph(
    pdf: jsPDF, 
    text: string, 
    yPosition: number, 
    margin: number, 
    textWidth: number, 
    lineHeight: number,
    pageWidth: number,
    pageHeight: number,
    pageNumber: number,
    bookTitle: string
  ): { yPosition: number; newPage: boolean } {
    let newPage = false;
    
    if (!text.trim()) {
      return { yPosition: yPosition + lineHeight, newPage };
    }
     
    if (yPosition > pageHeight - 80) {
      this.addProfessionalPageFooter(pdf, pageNumber, pageWidth, pageHeight);
      pdf.addPage();
      newPage = true;
      yPosition = margin + 30;
      this.addProfessionalPageHeader(pdf, bookTitle, pageWidth, margin);
      yPosition += 20;
    }
     
    pdf.setFontSize(12);
    pdf.setFont('times', 'normal');
    pdf.setTextColor(50, 50, 50);
     
    let processedText = text;
    let fontStyle = 'normal';
    
    if (text.startsWith('**') && text.endsWith('**')) {
  
      fontStyle = 'bold';
      processedText = text.replace(/\*\*/g, '');
    } else if (text.startsWith('*') && text.endsWith('*')) {
       
      fontStyle = 'italic';
      processedText = text.replace(/\*/g, '');
    }
    
    pdf.setFont('times', fontStyle);
    
     
    const textLines = pdf.splitTextToSize(processedText, textWidth - 20);
    
     
    const totalHeight = textLines.length * lineHeight + 12;
    if (yPosition + totalHeight > pageHeight - 60) {
      this.addProfessionalPageFooter(pdf, pageNumber, pageWidth, pageHeight);
      pdf.addPage();
      newPage = true;
      yPosition = margin + 30;
      this.addProfessionalPageHeader(pdf, bookTitle, pageWidth, margin);
      yPosition += 20;
    }
    
     
    textLines.forEach((textLine: string, index: number) => { 
      const xPosition = index === 0 ? margin + 15 : margin + 10;
       
      if (index < textLines.length - 1 && textLines.length > 1 && textLine.trim().length > 20) {
        this.addJustifiedLine(pdf, textLine, xPosition, yPosition, textWidth - 20);
      } else {
        pdf.text(textLine, xPosition, yPosition);
      }
      yPosition += lineHeight;
    });
     
    yPosition += 10;
    
    return { yPosition, newPage };
  }

  private static addJustifiedLine(pdf: jsPDF, line: string, x: number, y: number, maxWidth: number): void {
    const words = line.trim().split(' ');
    if (words.length <= 1) {
      pdf.text(line, x, y);
      return;
    }
    
    const lineWidth = pdf.getTextWidth(line);
    const spaceWidth = pdf.getTextWidth(' ');
    const extraSpace = maxWidth - lineWidth;
    const gaps = words.length - 1;
    const additionalSpacePerGap = gaps > 0 ? extraSpace / gaps : 0;
     
    if (additionalSpacePerGap > spaceWidth * 0.5) {
      pdf.text(line, x, y);
      return;
    }
    
    let currentX = x;
    words.forEach((word, index) => {
      pdf.text(word, currentX, y);
      currentX += pdf.getTextWidth(word);
      if (index < words.length - 1) {
        currentX += spaceWidth + additionalSpacePerGap;
      }
    });
  }

  static exportToText(storybook: StorybookExport): void { 
    let content = '';
    
    
    content += '═'.repeat(80) + '\n';
    content += '║' + ' '.repeat(78) + '║\n';
    
    const titleLine = storybook.title.toUpperCase();
    const titlePadding = Math.max(0, Math.floor((76 - titleLine.length) / 2));
    content += '║' + ' '.repeat(titlePadding) + titleLine + ' '.repeat(76 - titlePadding - titleLine.length) + '║\n';
    
    content += '║' + ' '.repeat(78) + '║\n';
    
    const subtitleLine = `A ${storybook.theme.charAt(0).toUpperCase() + storybook.theme.slice(1)} Story`;
    const subtitlePadding = Math.max(0, Math.floor((76 - subtitleLine.length) / 2));
    content += '║' + ' '.repeat(subtitlePadding) + subtitleLine + ' '.repeat(76 - subtitlePadding - subtitleLine.length) + '║\n';
    
    content += '║' + ' '.repeat(78) + '║\n';
    
    const dateRange = `${storybook.timeframe.start.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })} — ${storybook.timeframe.end.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
    const datePadding = Math.max(0, Math.floor((76 - dateRange.length) / 2));
    content += '║' + ' '.repeat(datePadding) + dateRange + ' '.repeat(76 - datePadding - dateRange.length) + '║\n';
    
    content += '║' + ' '.repeat(78) + '║\n';
    content += '═'.repeat(80) + '\n\n\n';
    
     
    const lines = storybook.generatedContent.split('\n');
    let chapterNumber = 0;
    
    for (const line of lines) {
      if (line.trim() === '') {
        content += '\n';
      } else if (line.startsWith('---')) {
        content += '\n\n' + '═'.repeat(80) + '\n\n';
      } else if (line.startsWith('##')) {
        chapterNumber++;
        const chapterTitle = line.replace('##', '').trim();
        content += '\n\n';
        content += '❦'.repeat(5) + '\n\n';
        content += `CHAPTER ${this.toRomanNumeral(chapterNumber)}\n\n`;
        content += chapterTitle.toUpperCase() + '\n\n';
        content += '❦'.repeat(5) + '\n\n';
      } else { 
        const wrappedText = this.wrapTextProfessionally(line, 75);
        content += wrappedText + '\n\n';
      }
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${storybook.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Storybook.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static wrapTextProfessionally(text: string, maxLength: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
     
    return lines.map((line, index) => {
      return index === 0 ? '    ' + line : '  ' + line;
    }).join('\n');
  }

  static exportRawEntries(entries: DiaryEntry[]): void {
    const content = JSON.stringify(entries, null, 2);
    
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diary_entries_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async exportWellnessReport(insights: WellnessInsights, isCounselorSummary: boolean = true): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Header banner
    pdf.setFillColor(243, 246, 244);
    pdf.roundedRect(margin, y, contentWidth, 32, 3, 3, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(45, 55, 72);
    pdf.text(isCounselorSummary ? 'Wellness Summary (Counselor / Clinical Edition)' : 'Personal Wellness Trends Report', margin + 8, y + 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    pdf.text(`Generated: ${dateStr} • Zero diary entry text is included for privacy`, margin + 8, y + 20);
    pdf.text(`Scope: ${insights.dataPointsCount} logged checkpoints analyzed`, margin + 8, y + 26);
    y += 40;

    const printSectionHeading = (title: string) => {
      if (y > pageHeight - 35) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(30, 41, 59);
      pdf.text(title, margin, y);
      y += 2;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y, margin + contentWidth, y);
      y += 6;
    };

    // 1. Overview metrics
    printSectionHeading('1. Overview & Consistency');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85);

    const avgMoodStr = insights.averageMood !== null ? `${insights.averageMood.toFixed(1)} / 10` : 'Not enough data';
    pdf.text(`Average Mood Rating: ${avgMoodStr}`, margin, y);
    y += 6;
    pdf.text(`Recent Activity (Last 7 Days): ${insights.streak.last7DaysRatio} days logged`, margin, y);
    y += 6;
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Reflection: "${insights.streak.kindMessage}"`, margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    y += 10;

    // 2. Highs & Lows
    printSectionHeading('2. Notable Days');
    const bestStr = insights.bestDay
      ? `${new Date(insights.bestDay.date).toLocaleDateString()} (Score: ${insights.bestDay.moodScore}/10) - Emotions: ${insights.bestDay.emotions.join(', ') || 'None noted'}`
      : 'None recorded in this period';
    const hardestStr = insights.hardestDay
      ? `${new Date(insights.hardestDay.date).toLocaleDateString()} (Score: ${insights.hardestDay.moodScore}/10) - Emotions: ${insights.hardestDay.emotions.join(', ') || 'None noted'}`
      : 'None recorded in this period';

    pdf.text(`Best Day: ${bestStr}`, margin, y);
    y += 6;
    pdf.text(`Hardest Day: ${hardestStr}`, margin, y);
    y += 10;

    // 3. Observed Trends & Correlations (>= 7 points)
    printSectionHeading('3. Observed Correlations & Trends');
    if (insights.findings && insights.findings.length > 0) {
      insights.findings.forEach(finding => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(`* ${finding}`, margin + 2, y);
        y += 6;
      });
    } else {
      pdf.setTextColor(148, 163, 184);
      pdf.text('Fewer than 7 days of combined data available. Correlation trends emerge over time.', margin, y);
      pdf.setTextColor(51, 65, 85);
      y += 6;
    }
    y += 6;

    // 4. Frequent Emotions
    printSectionHeading('4. Most Frequent Emotions');
    if (insights.mostFrequentEmotions && insights.mostFrequentEmotions.length > 0) {
      const emoList = insights.mostFrequentEmotions.map(e => `${e.emotion} (${e.count}x)`).join(', ');
      const splitEmo = pdf.splitTextToSize(emoList, contentWidth);
      pdf.text(splitEmo, margin, y);
      y += splitEmo.length * 6 + 4;
    } else {
      pdf.text('No specific emotions logged during this range.', margin, y);
      y += 8;
    }

    // 5. Weekday Averages
    if (y > pageHeight - 35) {
      pdf.addPage();
      y = margin;
    }
    printSectionHeading('5. Weekday Pattern');
    const weekdayStr = insights.weekdayPattern
      .map(w => `${w.day}: ${w.averageMood !== null ? w.averageMood.toFixed(1) + '/10' : '-'}`)
      .join('   |   ');
    pdf.text(weekdayStr, margin, y);
    y += 12;

    // 6. Day-by-Day Metric Table (No diary text)
    if (y > pageHeight - 50) {
      pdf.addPage();
      y = margin;
    }
    printSectionHeading('6. Daily Metrics Breakdown (Numbers Only)');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Date               Mood    Sleep    Energy    Stress    Anxiety    Water    Exercise', margin, y);
    y += 3;
    pdf.line(margin, y, margin + contentWidth, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    insights.moodPerDay.forEach(day => {
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = margin;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Date               Mood    Sleep    Energy    Stress    Anxiety    Water    Exercise', margin, y);
        y += 3;
        pdf.line(margin, y, margin + contentWidth, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(51, 65, 85);
      }
      const d = new Date(day.date).toISOString().slice(0, 10);
      const m = day.moodScore !== null ? `${day.moodScore}/10`.padEnd(6) : '-     ';
      const sl = day.sleepHours != null ? `${day.sleepHours}h`.padEnd(7) : '-      ';
      const en = day.energy != null ? `${day.energy}/5`.padEnd(8) : '-       ';
      const st = day.stress != null ? `${day.stress}/5`.padEnd(8) : '-       ';
      const ax = day.anxiety != null ? `${day.anxiety}/5`.padEnd(9) : '-        ';
      const wt = day.waterGlasses != null ? `${day.waterGlasses}gl`.padEnd(7) : '-      ';
      const ex = day.exerciseMinutes != null ? `${day.exerciseMinutes}m` : '-';

      pdf.text(`${d}     ${m}  ${sl}  ${en}  ${st}  ${ax}  ${wt}  ${ex}`, margin, y);
      y += 5;
    });

    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Confidential Wellness Report * My AI Diary * Page ${p} of ${totalPages}`,
        margin,
        pageHeight - 10
      );
    }

    const filename = isCounselorSummary ? 'wellness_counselor_summary.pdf' : 'wellness_report.pdf';
    pdf.save(filename);
  }
}