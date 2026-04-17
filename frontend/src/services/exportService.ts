import { StorybookExport } from '../types';
import jsPDF from 'jspdf';

export class ExportService {
  static async exportToPDF(storybook: StorybookExport): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 30;
    const textWidth = pageWidth - margin * 2;
    const lineHeight = 7;

    let yPosition = margin;
    let pageNumber = 1;
 
    this.createProfessionalTitlePage(pdf, storybook, pageWidth, pageHeight);

   
    pdf.addPage();
    pageNumber++;
    this.createDedicationPage(pdf, storybook, pageWidth, pageHeight, margin);

     
    pdf.addPage();
    pageNumber++;
    const chapters = this.extractChapters(storybook.generatedContent);
    this.createProfessionalTableOfContents(pdf, chapters, pageWidth, pageHeight, margin);

   
    pdf.addPage();
    pageNumber++;
    yPosition = margin + 30;

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

    const filename = `${storybook.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')}_Storybook.pdf`;
    pdf.save(filename);
  }

  private static createProfessionalTitlePage(pdf: jsPDF, storybook: StorybookExport, pageWidth: number, pageHeight: number): void {
    const centerX = pageWidth / 2;
     
    pdf.setDrawColor(60, 60, 60);
    pdf.setLineWidth(1);
    pdf.rect(25, 25, pageWidth - 50, pageHeight - 50);
    
    pdf.setLineWidth(0.5);
    pdf.rect(30, 30, pageWidth - 60, pageHeight - 60);
     
    this.addCornerDecorations(pdf, pageWidth, pageHeight);
     
    pdf.setFontSize(32);
    pdf.setFont('times', 'bold');
    pdf.setTextColor(40, 40, 40);
    
    const titleLines = pdf.splitTextToSize(storybook.title, pageWidth - 100);
    let titleY = pageHeight * 0.25;
    
    titleLines.forEach((line: string) => {
      const titleWidth = pdf.getTextWidth(line);
      pdf.text(line, centerX - (titleWidth / 2), titleY);
      titleY += 40;
    });
     
    pdf.setDrawColor(120, 120, 120);
    pdf.setLineWidth(0.8);
    pdf.line(centerX - 50, titleY + 10, centerX + 50, titleY + 10);
     
    pdf.setFontSize(18);
    pdf.setFont('times', 'italic');
    pdf.setTextColor(80, 80, 80);
    const subtitle = `A ${storybook.theme.charAt(0).toUpperCase() + storybook.theme.slice(1)} Story`;
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, centerX - (subtitleWidth / 2), titleY + 55);
     
    pdf.setFontSize(14);
    pdf.setFont('times', 'normal');
    pdf.setTextColor(100, 100, 100);
    const startDate = storybook.timeframe.start.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const endDate = storybook.timeframe.end.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const dateRange = startDate === endDate ? startDate : `${startDate} — ${endDate}`;
    const dateWidth = pdf.getTextWidth(dateRange);
    pdf.text(dateRange, centerX - (dateWidth / 2), titleY + 80);
     
    pdf.setFontSize(12);
    pdf.setFont('times', 'italic');
    pdf.setTextColor(120, 120, 120);
    const bottomText = 'A Personal Journey Transformed into Story';
    const bottomWidth = pdf.getTextWidth(bottomText);
    pdf.text(bottomText, centerX - (bottomWidth / 2), pageHeight - 60);
     
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(140, 140, 140);
    const publisherText = 'Created with MyDiary AI';
    const publisherWidth = pdf.getTextWidth(publisherText);
    pdf.text(publisherText, centerX - (publisherWidth / 2), pageHeight - 40);
  }

  private static addCornerDecorations(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
     
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);

    const cornerSize = 10;
    const offset = 35;

     
    pdf.line(offset, offset, offset + cornerSize, offset);
    pdf.line(offset, offset, offset, offset + cornerSize);

   
    pdf.line(pageWidth - offset, offset, pageWidth - offset - cornerSize, offset);
    pdf.line(pageWidth - offset, offset, pageWidth - offset, offset + cornerSize);
 
    pdf.line(offset, pageHeight - offset, offset + cornerSize, pageHeight - offset);
    pdf.line(offset, pageHeight - offset, offset, pageHeight - offset - cornerSize);
 
    pdf.line(pageWidth - offset, pageHeight - offset, pageWidth - offset - cornerSize, pageHeight - offset);
    pdf.line(pageWidth - offset, pageHeight - offset, pageWidth - offset, pageHeight - offset - cornerSize);
  }

  private static createDedicationPage(pdf: jsPDF, _storybook: StorybookExport, pageWidth: number, pageHeight: number, _margin: number): void {
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

  static exportRawEntries(entries: any[]): void {
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
}