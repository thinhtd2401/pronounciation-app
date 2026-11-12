import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

export interface ParsedVideo {
  title: string;
  groupName?: string;
  youtubeUrl: string;
  youtubeId: string;
  isShort: boolean;
  order: number;
  updatedNotes?: string;
  teacherNotes?: string;
}

export interface ParsedLesson {
  code: string;
  title: string;
  phoneme?: string | null;
  order: number;
  videos: ParsedVideo[];
}

export interface ParsedCategory {
  name: string;
  order: number;
  lessons: ParsedLesson[];
}

export interface ImportResult {
  categoriesCount: number;
  lessonsCount: number;
  videosCount: number;
}

export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+?&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export function parseExcelVideos(filePath: string): ParsedCategory[] {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets['Sách đánh vần offical'] || wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const categories: ParsedCategory[] = [];
  let currentCategory: ParsedCategory = { name: 'Mở đầu & Căn bản', order: 1, lessons: [] };
  categories.push(currentCategory);

  let currentLesson: ParsedLesson | null = null;
  let categoryOrder = 2;
  let lessonOrder = 1;
  let videoOrder = 1;

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const colA = row[0] ? String(row[0]).trim() : null;
    const colB = row[1] ? String(row[1]).trim() : null;
    const colC = row[2] ? String(row[2]).trim() : null;
    const colD = row[3] ? String(row[3]).trim() : null;
    const colE = row[4] ? String(row[4]).trim() : null;
    const colG = row[6] ? String(row[6]).trim() : null;

    // Detect Category header (e.g. [ 'Bài', 'Nguyên âm' ] or [ null, 'Phụ âm' ])
    if ((colA === 'Bài' && colB) || (colB === 'Phụ âm' && !colA)) {
      const categoryName = colB || colA || 'Khác';
      currentCategory = { name: categoryName, order: categoryOrder++, lessons: [] };
      categories.push(currentCategory);
      currentLesson = null;
      continue;
    }

    // Detect Lesson header (e.g. 'Bài 1', 'Bài 2', 'Bải 22' or Intro rows without colA)
    const isExplicitLesson = colA ? /^b[àảa]i\s*\d+/i.test(colA) : false;
    const isIntroLesson = !colA && !currentLesson && colC && colD && (colD.includes('youtu.be') || colD.includes('youtube.com'));

    if (isExplicitLesson && colA) {
      // Normalize 'Bải 22' typo to 'Bài 22'
      const normalizedCode = colA.replace(/^b[àảa]i/i, 'Bài');
      currentLesson = {
        code: normalizedCode,
        title: colB || colC || normalizedCode,
        phoneme: colB || null,
        order: lessonOrder++,
        videos: []
      };
      currentCategory.lessons.push(currentLesson);
      videoOrder = 1;
    } else if (isIntroLesson && colC) {
      currentLesson = {
        code: `Intro ${lessonOrder}`,
        title: colC,
        phoneme: null,
        order: lessonOrder++,
        videos: []
      };
      currentCategory.lessons.push(currentLesson);
      videoOrder = 1;
    }

    // Detect Video link in colD
    if (colD && (colD.includes('youtu.be') || colD.includes('youtube.com'))) {
      const ytId = extractYoutubeId(colD);
      if (ytId && currentLesson) {
        currentLesson.videos.push({
          title: colC || currentLesson.title,
          groupName: colC && colC !== currentLesson.title ? colC : undefined,
          youtubeUrl: colD.trim(),
          youtubeId: ytId,
          isShort: colD.includes('/shorts/'),
          order: videoOrder++,
          updatedNotes: colE || undefined,
          teacherNotes: colG || undefined,
        });
      }
    }
  }

  return categories.filter(c => c.lessons.length > 0);
}

export async function seedDatabaseFromExcel(filePath?: string): Promise<ImportResult> {
  const resolvedPath = filePath || path.resolve(process.cwd(), 'Videos_links.xlsx');
  const categories = parseExcelVideos(resolvedPath);

  // Clear existing data cleanly to ensure idempotency
  await prisma.$transaction([
    prisma.dailyLog.deleteMany(),
    prisma.studyProgress.deleteMany(),
    prisma.planItem.deleteMany(),
    prisma.userNote.deleteMany(),
    prisma.video.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.category.deleteMany(),
  ]);

  let totalCategories = 0;
  let totalLessons = 0;
  let totalVideos = 0;

  for (const cat of categories) {
    totalCategories++;
    const dbCat = await prisma.category.create({
      data: {
        name: cat.name,
        order: cat.order,
      }
    });

    for (const les of cat.lessons) {
      totalLessons++;
      const dbLes = await prisma.lesson.create({
        data: {
          code: les.code,
          title: les.title,
          phoneme: les.phoneme,
          order: les.order,
          categoryId: dbCat.id,
        }
      });

      for (const vid of les.videos) {
        totalVideos++;
        await prisma.video.create({
          data: {
            lessonId: dbLes.id,
            title: vid.title,
            groupName: vid.groupName,
            youtubeUrl: vid.youtubeUrl,
            youtubeId: vid.youtubeId,
            isShort: vid.isShort,
            order: vid.order,
            updatedNotes: vid.updatedNotes,
            teacherNotes: vid.teacherNotes,
          }
        });
      }
    }
  }

  return {
    categoriesCount: totalCategories,
    lessonsCount: totalLessons,
    videosCount: totalVideos,
  };
}
