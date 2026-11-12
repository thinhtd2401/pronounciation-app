import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { extractYoutubeId, parseExcelVideos, seedDatabaseFromExcel } from '../../src/lib/excel-importer';
import { prisma } from '../../src/lib/prisma';

describe('Excel Parser & YouTube URL Extractor', () => {
  describe('extractYoutubeId', () => {
    it('extracts youtube ID from different URL formats', () => {
      expect(extractYoutubeId('https://youtu.be/okuNL2IdgZo?si=SY0Ti7pX_gQ0P5KP')).toBe('okuNL2IdgZo');
      expect(extractYoutubeId('https://www.youtube.com/watch?v=bVEwEQRppYU')).toBe('bVEwEQRppYU');
      expect(extractYoutubeId('https://youtube.com/shorts/jExTCwX5CQs')).toBe('jExTCwX5CQs');
      expect(extractYoutubeId('https://youtu.be/7U6socGnzP4')).toBe('7U6socGnzP4');
      expect(extractYoutubeId('https://www.youtube.com/embed/bVEwEQRppYU')).toBe('bVEwEQRppYU');
      expect(extractYoutubeId('https://www.youtube.com/watch?feature=shared&v=bVEwEQRppYU')).toBe('bVEwEQRppYU');
      expect(extractYoutubeId('invalid-url')).toBeNull();
      expect(extractYoutubeId(null)).toBeNull();
      expect(extractYoutubeId(undefined)).toBeNull();
      expect(extractYoutubeId('')).toBeNull();
    });

    it('handles unicode characters and trailing query parameters cleanly', () => {
      // Non-ascii query parameter like in row 3 of Videos_links.xlsx
      expect(extractYoutubeId('https://youtu.be/AwWoeSvZ6xo?si=JFPbjUrLnzqdđ')).toBe('AwWoeSvZ6xo');
      // Leading and trailing whitespace
      expect(extractYoutubeId('   https://youtu.be/okuNL2IdgZo?si=SY0Ti7pX_gQ0P5KP   ')).toBe('okuNL2IdgZo');
    });
  });

  describe('parseExcelVideos', () => {
    const excelPath = path.resolve(process.cwd(), 'Videos_links.xlsx');

    it('correctly reads and structures categories, lessons, and videos from Videos_links.xlsx', () => {
      const categories = parseExcelVideos(excelPath);

      expect(categories.length).toBeGreaterThan(0);

      // Verify categories
      const introCategory = categories.find(c => c.name.includes('Mở đầu'));
      expect(introCategory).toBeDefined();

      const vowelCategory = categories.find(c => c.name.includes('Nguyên âm'));
      expect(vowelCategory).toBeDefined();

      const consonantCategory = categories.find(c => c.name.includes('Phụ âm'));
      expect(consonantCategory).toBeDefined();

      // Verify Bài 1 under Nguyên âm
      const lesson1 = vowelCategory?.lessons.find(l => l.code === 'Bài 1');
      expect(lesson1).toBeDefined();
      expect(lesson1?.title).toBe('Âm /i:/');
      expect(lesson1?.phoneme).toBe('Âm /i:/');
      expect(lesson1?.videos.length).toBeGreaterThanOrEqual(5);

      const firstVideo = lesson1?.videos[0];
      expect(firstVideo?.youtubeId).toBe('okuNL2IdgZo');
      expect(firstVideo?.youtubeUrl).toContain('okuNL2IdgZo');
      expect(firstVideo?.isShort).toBe(false);

      // Verify typo "Bải 22" is normalized to "Bài 22"
      const lesson22 = consonantCategory?.lessons.find(l => l.code === 'Bài 22');
      expect(lesson22).toBeDefined();

      // Verify shorts flag
      const allVideos = categories.flatMap(c => c.lessons.flatMap(l => l.videos));
      const shortVideos = allVideos.filter(v => v.isShort);
      expect(shortVideos.length).toBeGreaterThan(0);

      // Verify total lessons and videos counts
      const totalLessons = categories.reduce((sum, c) => sum + c.lessons.length, 0);
      const totalVideos = allVideos.length;

      expect(totalLessons).toBeGreaterThanOrEqual(45);
      expect(totalVideos).toBeGreaterThanOrEqual(180);
    });
  });

  describe('seedDatabaseFromExcel', () => {
    beforeAll(async () => {
      await prisma.$connect();
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    it('seeds categories, lessons, and videos idempotently into SQLite', async () => {
      const excelPath = path.resolve(process.cwd(), 'Videos_links.xlsx');

      // First run
      const result1 = await seedDatabaseFromExcel(excelPath);
      expect(result1.categoriesCount).toBeGreaterThanOrEqual(3);
      expect(result1.lessonsCount).toBeGreaterThanOrEqual(45);
      expect(result1.videosCount).toBeGreaterThanOrEqual(180);

      const dbLessonsCount1 = await prisma.lesson.count();
      const dbVideosCount1 = await prisma.video.count();
      expect(dbLessonsCount1).toBe(result1.lessonsCount);
      expect(dbVideosCount1).toBe(result1.videosCount);

      // Second run (idempotency check)
      const result2 = await seedDatabaseFromExcel(excelPath);
      expect(result2.lessonsCount).toBe(result1.lessonsCount);
      expect(result2.videosCount).toBe(result1.videosCount);

      const dbLessonsCount2 = await prisma.lesson.count();
      const dbVideosCount2 = await prisma.video.count();
      expect(dbLessonsCount2).toBe(result1.lessonsCount);
      expect(dbVideosCount2).toBe(result1.videosCount);
    });
  });
});
