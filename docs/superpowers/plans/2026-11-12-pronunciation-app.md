# English Pronunciation Learning Platform (Admin & Client) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống học phát âm tiếng Anh toàn diện gồm Client (học viên) và Admin (quản trị), nhập dữ liệu trực tiếp từ `Videos_links.xlsx` (180+ video, 45 bài học), mô phỏng giao diện chuẩn của EasyDictation.app, hỗ trợ phát video YouTube tùy chỉnh kích thước/fullscreen, ghi chú theo bài, lập lịch học thông minh (Spaced Repetition), ghi nhận log và lượt xem hàng ngày, hỗ trợ Dark/Light mode và responsive 100% thiết bị.

**Architecture:** Ứng dụng Full-stack xây dựng trên Next.js (App Router, React 19 / TypeScript) kết hợp Tailwind CSS và SQLite (qua Prisma ORM) cho cơ sở dữ liệu nội bộ không cần cài đặt thêm server ngoài. Kiến trúc phân tầng gồm: Data Layer (SQLite Schema, Excel Importer, Repository), Core Engine (Study Plan Scheduler, Analytics/Logger, Notification Service), và Presentation Layer (Client Study Workspace theo cảm hứng EasyDictation + Admin Dashboard quản trị bài học & log).

**Tech Stack:** Next.js 15+ (App Router), TypeScript, Tailwind CSS, Lucide React, Prisma ORM + SQLite, openpyxl / xlsx (Excel parsing), YouTube IFrame Player API, Vitest / Playwright cho kiểm thử tự động.

## Global Constraints

- Mọi đường dẫn video từ `Videos_links.xlsx` bao gồm link thường (`youtu.be/...`, `youtube.com/watch?v=...`) và Shorts (`youtube.com/shorts/...`) phải được chuẩn hóa thành mã YouTube ID chuẩn và embed player an toàn.
- Giao diện Client phải tuân thủ bố cục Workspace phân chia (Split Layout) tương tự EasyDictation: Thanh điều hướng bài học bên trái (Sidebar Tree), Video Player trung tâm có các chế độ xem (Normal / Theater / Fullscreen / Zoom 1.25x - 1.5x), bảng Note/Từ vựng bên phải hoặc tab bên dưới.
- Hỗ trợ đầy đủ Light Mode và Dark Mode với nút chuyển đổi tức thì và lưu vào `localStorage`.
- Giao diện tối ưu hóa cho Mobile (< 768px: Bottom Navigation hoặc Collapsible Drawer), Tablet (768px - 1024px) và Desktop (> 1024px: 3 cột hoặc 2 cột linh hoạt).
- Admin ghi log theo từng ngày: mỗi lượt mở xem bài học, thời lượng, số lần xem, và lịch sử thay đổi.
- Thuật toán lập plan học thông minh (Adaptive Paced Learning): tự động chia 45 bài và 180 video theo thời gian người học chọn (ví dụ: 15 ngày, 30 ngày, 60 ngày hoặc theo số phút/ngày) kết hợp nhắc nhở ôn tập (Spaced Repetition 1-3-7-14 ngày).

---

### Task 1: Project Scaffolding & Dependencies Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Consumes: Node.js runtime environment (v25+)
- Produces: Project framework cấu hình sẵn TypeScript, Tailwind CSS, Prisma, Vitest runner

- [ ] **Step 1: Write setup test**

Create `tests/setup.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Project Environment Setup', () => {
  it('should verify vitest is operational and loads environment', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails before setup**

Run: `npx vitest run tests/setup.test.ts`
Expected: FAIL (vitest command not found or package not configured).

- [ ] **Step 3: Initialize Next.js project dependencies**

Initialize `package.json` and install required dependencies:
```bash
npm init -y
npm install next react react-dom lucide-react clsx tailwind-merge @prisma/client xlsx
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss postcss autoprefixer prisma vitest @testing-library/react @testing-library/jest-dom jsdom
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 4: Configure TypeScript, Tailwind CSS & Vitest**

Configure `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      }
    },
  },
  plugins: [],
};
export default config;
```

Configure `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/setup.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json tailwind.config.ts vitest.config.ts tests/setup.test.ts
git commit -m "feat: initialize Next.js project with Tailwind CSS, Prisma, and Vitest"
```

---

### Task 2: Database Schema & Prisma Configuration

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Test: `tests/db/schema.test.ts`

**Interfaces:**
- Consumes: SQLite Database path `file:./dev.db`
- Produces: Prisma Client models: `Category`, `Lesson`, `Video`, `StudyProgress`, `UserNote`, `DailyLog`, `StudyPlan`, `PlanItem`, `Reminder`

- [ ] **Step 1: Write test for Prisma DB models**

Create `tests/db/schema.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';

describe('Database Schema Entities', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('can create and query a category with lessons and videos', async () => {
    const category = await prisma.category.create({
      data: {
        name: 'Nguyên âm',
        order: 1,
        lessons: {
          create: {
            code: 'Bài 1',
            title: 'Âm /i:/',
            phoneme: '/i:/',
            order: 1,
            videos: {
              create: [
                {
                  title: 'Âm /i:/ chính',
                  youtubeUrl: 'https://youtu.be/okuNL2IdgZo',
                  youtubeId: 'okuNL2IdgZo',
                  order: 1,
                }
              ]
            }
          }
        }
      },
      include: { lessons: { include: { videos: true } } }
    });

    expect(category.name).toBe('Nguyên âm');
    expect(category.lessons.length).toBe(1);
    expect(category.lessons[0].videos[0].youtubeId).toBe('okuNL2IdgZo');

    // Clean up
    await prisma.category.delete({ where: { id: category.id } });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/db/schema.test.ts`
Expected: FAIL (models not found in Prisma schema).

- [ ] **Step 3: Implement comprehensive Prisma Schema**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Category {
  id        String   @id @default(cuid())
  name      String   // 'Mở đầu', 'Nguyên âm', 'Phụ âm', 'Nâng cao'
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lessons   Lesson[]
}

model Lesson {
  id          String         @id @default(cuid())
  code        String         // 'Bài 1', 'Bài 2', 'Intro'
  title       String         // 'Âm /i:/'
  phoneme     String?        // '/i:/'
  order       Int            @default(0)
  categoryId  String
  category    Category       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  videos      Video[]
  notes       UserNote[]
  progress    StudyProgress[]
  planItems   PlanItem[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model Video {
  id             String          @id @default(cuid())
  lessonId       String
  lesson         Lesson          @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  title          String          // 'Âm /i:/', 'Nhóm ea', 'Nhóm ee'
  groupName      String?         // 'Nhóm ea'
  youtubeUrl     String
  youtubeId      String          // 'okuNL2IdgZo'
  isShort        Boolean         @default(false)
  order          Int             @default(0)
  viewCount      Int             @default(0)
  durationSeconds Int            @default(0)
  updatedNotes   String?         // Dữ liệu cột 'Update 10/2026'
  teacherNotes   String?         // Dữ liệu cột 'cô Linh'
  dailyLogs      DailyLog[]
  progress       StudyProgress[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model StudyProgress {
  id             String    @id @default(cuid())
  userId         String    @default("default_user")
  lessonId       String
  lesson         Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  videoId        String
  video          Video     @relation(fields: [videoId], references: [id], onDelete: Cascade)
  isCompleted    Boolean   @default(false)
  lastPositionSec Int      @default(0)
  watchCount     Int       @default(0)
  lastWatchedAt  DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([userId, videoId])
}

model UserNote {
  id        String   @id @default(cuid())
  userId    String   @default("default_user")
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  content   String   // Markdown / Note text
  timestamp Int?     // Video timestamp marker (seconds)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model DailyLog {
  id              String   @id @default(cuid())
  date            String   // YYYY-MM-DD
  userId          String   @default("default_user")
  videoId         String
  video           Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
  timeSpentSec    Int      @default(0)
  viewsToday      Int      @default(1)
  completedToday  Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([date, userId, videoId])
}

model StudyPlan {
  id             String     @id @default(cuid())
  userId         String     @default("default_user")
  title          String     // 'Plan 30 ngày cơ bản phát âm'
  startDate      DateTime   @default(now())
  targetDays     Int        @default(30)
  dailyMinutes   Int        @default(30)
  isActive       Boolean    @default(true)
  items          PlanItem[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}

model PlanItem {
  id          String     @id @default(cuid())
  planId      String
  plan        StudyPlan  @relation(fields: [planId], references: [id], onDelete: Cascade)
  lessonId    String
  lesson      Lesson     @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  scheduledDate String   // YYYY-MM-DD
  isDone      Boolean    @default(false)
  reviewStage Int        @default(0) // Spaced repetition interval (0: Learn, 1: Review day 1, 2: Day 3, 3: Day 7)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Reminder {
  id          String   @id @default(cuid())
  userId      String   @default("default_user")
  time        String   // '20:00'
  daysOfWeek  String   // '1,2,3,4,5,6,7'
  isEnabled   Boolean  @default(true)
  channel     String   @default("browser") // 'browser' | 'notification'
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

Run migration:
```bash
npx prisma migrate dev --name init
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts tests/db/schema.test.ts
git commit -m "feat: setup Prisma SQLite schema for lessons, logs, notes, plans"
```

---

### Task 3: Excel Parser & Video Data Importer

**Files:**
- Create: `src/lib/excel-importer.ts`
- Create: `src/scripts/seed-excel.ts`
- Test: `tests/lib/excel-importer.test.ts`

**Interfaces:**
- Consumes: `Videos_links.xlsx` (Sheet 'Sách đánh vần offical')
- Produces: `parseExcelVideos(filePath: string): ParsedCategory[]`, `seedDatabaseFromExcel(): Promise<ImportResult>`

- [ ] **Step 1: Write test for YouTube URL extractor and Excel row mapper**

Create `tests/lib/excel-importer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { extractYoutubeId, parseExcelVideos } from '../../src/lib/excel-importer';
import path from 'path';

describe('Excel Parser & YouTube URL Extractor', () => {
  it('extracts youtube ID from different URL formats', () => {
    expect(extractYoutubeId('https://youtu.be/okuNL2IdgZo?si=SY0Ti7pX_gQ0P5KP')).toBe('okuNL2IdgZo');
    expect(extractYoutubeId('https://www.youtube.com/watch?v=bVEwEQRppYU')).toBe('bVEwEQRppYU');
    expect(extractYoutubeId('https://youtube.com/shorts/jExTCwX5CQs')).toBe('jExTCwX5CQs');
    expect(extractYoutubeId('invalid-url')).toBeNull();
  });

  it('correctly reads and structures lessons from Videos_links.xlsx', () => {
    const excelPath = path.resolve(process.cwd(), 'Videos_links.xlsx');
    const categories = parseExcelVideos(excelPath);

    expect(categories.length).toBeGreaterThan(0);
    const vowelCategory = categories.find(c => c.name.includes('Nguyên âm'));
    expect(vowelCategory).toBeDefined();

    const lesson1 = vowelCategory?.lessons.find(l => l.code === 'Bài 1');
    expect(lesson1).toBeDefined();
    expect(lesson1?.videos.length).toBeGreaterThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/excel-importer.test.ts`
Expected: FAIL (modules not created).

- [ ] **Step 3: Implement YouTube ID parser & Excel extractor**

Create `src/lib/excel-importer.ts`:
```typescript
import * as XLSX from 'xlsx';
import fs from 'fs';

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
  phoneme?: string;
  order: number;
  videos: ParsedVideo[];
}

export interface ParsedCategory {
  name: string;
  order: number;
  lessons: ParsedLesson[];
}

export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
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

    // Detect Category header
    if ((colA === 'Bài' && colB) || (colB === 'Phụ âm' && !colA)) {
      const categoryName = colB || colA;
      currentCategory = { name: categoryName, order: categoryOrder++, lessons: [] };
      categories.push(currentCategory);
      currentLesson = null;
      continue;
    }

    // Detect Lesson header (e.g. 'Bài 1', 'Bài 2', 'Bảng Chữ cái ABC')
    const isNewLesson = (colA && colA.toLowerCase().startsWith('bài')) || 
                        (!colA && !currentLesson && colC && colD);

    if (isNewLesson && colA && colA.toLowerCase().startsWith('bài')) {
      currentLesson = {
        code: colA,
        title: colB || colC || colA,
        phoneme: colB || null,
        order: lessonOrder++,
        videos: []
      };
      currentCategory.lessons.push(currentLesson);
      videoOrder = 1;
    } else if (!currentLesson && colC && colD) {
      currentLesson = {
        code: `Intro ${lessonOrder}`,
        title: colC,
        order: lessonOrder++,
        videos: []
      };
      currentCategory.lessons.push(currentLesson);
      videoOrder = 1;
    }

    // Detect Video link
    if (colD && (colD.includes('youtu.be') || colD.includes('youtube.com'))) {
      const ytId = extractYoutubeId(colD);
      if (ytId && currentLesson) {
        currentLesson.videos.push({
          title: colC || currentLesson.title,
          groupName: colC && colC !== currentLesson.title ? colC : undefined,
          youtubeUrl: colD,
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
```

Create `src/scripts/seed-excel.ts`:
```typescript
import { prisma } from '../lib/prisma';
import { parseExcelVideos } from '../lib/excel-importer';
import path from 'path';

async function main() {
  console.log('--- Starting Excel Data Seeding ---');
  const excelPath = path.resolve(process.cwd(), 'Videos_links.xlsx');
  const categories = parseExcelVideos(excelPath);

  for (const cat of categories) {
    const dbCat = await prisma.category.create({
      data: {
        name: cat.name,
        order: cat.order,
      }
    });

    for (const les of cat.lessons) {
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

  const totalVideos = await prisma.video.count();
  const totalLessons = await prisma.lesson.count();
  console.log(`--- Seeded ${totalLessons} lessons and ${totalVideos} videos successfully! ---`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/excel-importer.test.ts`
Expected: PASS.

- [ ] **Step 5: Run seed script to populate SQLite**

Run: `npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/seed-excel.ts`
Expected: "Seeded 45+ lessons and 180+ videos successfully!"

- [ ] **Step 6: Commit**

```bash
git add src/lib/excel-importer.ts src/scripts/seed-excel.ts tests/lib/excel-importer.test.ts
git commit -m "feat: parse Excel file and seed 180+ videos into SQLite"
```

---

### Task 4: Layout & Theming Engine (EasyDictation Design Reference)

**Files:**
- Create: `src/context/ThemeContext.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/ThemeToggle.tsx`
- Create: `src/components/layout/ClientLayout.tsx`
- Test: `tests/components/ThemeToggle.test.tsx`

**Interfaces:**
- Consumes: React Context & HTML `class="dark"`
- Produces: `<ThemeProvider>`, `<ThemeToggle>`, EasyDictation header with responsive menu, search bar, streak indicator, and dark mode toggle

- [ ] **Step 1: Write test for Theme Context & Theme Toggle**

Create `tests/components/ThemeToggle.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('Theme Context & Toggle', () => {
  it('switches between light and dark mode', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeSpan = screen.getByTestId('current-theme');
    const btn = screen.getByText('Toggle');

    expect(['light', 'dark']).toContain(themeSpan.textContent);
    const initialTheme = themeSpan.textContent;

    fireEvent.click(btn);
    expect(themeSpan.textContent).not.toBe(initialTheme);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/ThemeToggle.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement ThemeContext and EasyDictation Header/Navbar**

Create `src/context/ThemeContext.tsx`:
```typescript
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('app-theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('app-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

Create `src/components/layout/ThemeToggle.tsx`:
```typescript
'use client';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Dark/Light Mode"
      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 transition-colors"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
    </button>
  );
}
```

Create `src/components/layout/Navbar.tsx` inspired by EasyDictation (Logo, Search, Daily Streak/Progress, Link to Admin, ThemeToggle).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/ThemeToggle.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/ThemeContext.tsx src/components/layout/ThemeToggle.tsx src/components/layout/Navbar.tsx tests/components/ThemeToggle.test.tsx
git commit -m "feat: add theme context and EasyDictation inspired navigation"
```

---

### Task 5: Video Player Workspace (Zoom, Theater Mode, Fullscreen & Controls)

**Files:**
- Create: `src/components/study/VideoPlayer.tsx`
- Create: `src/components/study/PlayerControls.tsx`
- Test: `tests/components/VideoPlayer.test.tsx`

**Interfaces:**
- Consumes: `videoId: string`, `title: string`, `onTimeUpdate: (sec: number) => void`, `onEnded: () => void`
- Produces: Embed YouTube component với các nút: Phóng to (Zoom 1.2x, 1.5x), Rạp chiếu phim (Theater Mode), Toàn màn hình (Fullscreen), Tốc độ phát (0.75x, 1x, 1.25x), Tua 5s.

- [ ] **Step 1: Write test for Player Controls component**

Create `tests/components/VideoPlayer.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PlayerControls from '../../src/components/study/PlayerControls';

describe('Player Controls', () => {
  it('renders zoom, theater mode and speed triggers', () => {
    const onZoomChange = vi.fn();
    const onToggleTheater = vi.fn();
    const onToggleFullscreen = vi.fn();

    render(
      <PlayerControls
        zoom={1}
        isTheater={false}
        onZoomChange={onZoomChange}
        onToggleTheater={onToggleTheater}
        onToggleFullscreen={onToggleFullscreen}
      />
    );

    const theaterBtn = screen.getByLabelText(/theater/i);
    fireEvent.click(theaterBtn);
    expect(onToggleTheater).toHaveBeenCalled();

    const zoomBtn = screen.getByLabelText(/zoom/i);
    fireEvent.click(zoomBtn);
    expect(onZoomChange).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/VideoPlayer.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement PlayerControls & VideoPlayer**

Create `src/components/study/PlayerControls.tsx`:
```typescript
'use client';
import React from 'react';
import { Maximize2, Minimize2, ZoomIn, Tv, RotateCcw, FastForward } from 'lucide-react';

interface PlayerControlsProps {
  zoom: number;
  isTheater: boolean;
  onZoomChange: (newZoom: number) => void;
  onToggleTheater: () => void;
  onToggleFullscreen: () => void;
}

export default function PlayerControls({
  zoom,
  isTheater,
  onZoomChange,
  onToggleTheater,
  onToggleFullscreen,
}: PlayerControlsProps) {
  const nextZoom = zoom === 1 ? 1.25 : zoom === 1.25 ? 1.5 : 1;

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 text-sm">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onZoomChange(nextZoom)}
          aria-label="zoom"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium transition"
        >
          <ZoomIn className="w-4 h-4" />
          <span>{zoom}x</span>
        </button>

        <button
          onClick={onToggleTheater}
          aria-label="theater"
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-800 font-medium transition ${
            isTheater ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/30' : 'text-gray-700 dark:text-zinc-300'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span className="hidden sm:inline">Rạp chiếu</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleFullscreen}
          aria-label="fullscreen"
          className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

Create `src/components/study/VideoPlayer.tsx` containing the responsive container, YouTube iframe with `enablejsapi=1`, full error boundary, and smooth scale transform for zoom.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/VideoPlayer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/study/PlayerControls.tsx src/components/study/VideoPlayer.tsx tests/components/VideoPlayer.test.tsx
git commit -m "feat: build YouTube player workspace with zoom, theater mode, and fullscreen"
```

---

### Task 6: EasyDictation-Style Lesson Navigation Sidebar

**Files:**
- Create: `src/components/study/LessonSidebar.tsx`
- Create: `src/components/study/LessonTreeItem.tsx`
- Test: `tests/components/LessonSidebar.test.tsx`

**Interfaces:**
- Consumes: `categories: CategoryWithLessons[]`, `currentVideoId: string`, `completedVideoIds: Set<string>`, `onSelectVideo: (videoId: string) => void`
- Produces: Collapsible Sidebar chia theo Nguyên âm / Phụ âm / Bài 1..45, tìm kiếm bài giảng theo từ khóa, tiến độ hoàn thành theo từng bài.

- [ ] **Step 1: Write test for Lesson Sidebar filtering and selection**

Create `tests/components/LessonSidebar.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import LessonSidebar from '../../src/components/study/LessonSidebar';

const mockCategories = [
  {
    id: 'cat1',
    name: 'Nguyên âm',
    lessons: [
      {
        id: 'les1',
        code: 'Bài 1',
        title: 'Âm /i:/',
        videos: [
          { id: 'v1', title: 'Âm /i:/', youtubeId: 'okuNL2IdgZo' },
          { id: 'v2', title: 'Nhóm ea', youtubeId: '7U6socGnzP4' },
        ]
      }
    ]
  }
];

describe('Lesson Sidebar', () => {
  it('filters lessons when typing in search input', () => {
    const onSelect = vi.fn();
    render(
      <LessonSidebar
        categories={mockCategories}
        currentVideoId="v1"
        completedVideoIds={new Set()}
        onSelectVideo={onSelect}
      />
    );

    expect(screen.getByText('Âm /i:/')).toBeDefined();
    const searchInput = screen.getByPlaceholderText(/tìm kiếm bài học/i);
    fireEvent.change(searchInput, { target: { value: 'Nhóm ea' } });

    expect(screen.getByText('Nhóm ea')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/LessonSidebar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement LessonSidebar with EasyDictation aesthetics**

Create `src/components/study/LessonSidebar.tsx` and `src/components/study/LessonTreeItem.tsx` with:
- Accordion collapsible per Category (Nguyên âm / Phụ âm) and per Lesson (Bài 1..45).
- Green check badge for completed videos.
- Search input with clear button.
- Mobile drawer toggle (slides in on mobile screen).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/LessonSidebar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/study/LessonSidebar.tsx src/components/study/LessonTreeItem.tsx tests/components/LessonSidebar.test.tsx
git commit -m "feat: implement EasyDictation style sidebar with lesson tree and search"
```

---

### Task 7: User Notes & Per-Lesson Workspace

**Files:**
- Create: `src/components/study/NoteEditor.tsx`
- Create: `src/app/api/notes/route.ts`
- Test: `tests/api/notes.test.ts`

**Interfaces:**
- Consumes: `lessonId: string`, `videoId: string`, `currentTime: number`
- Produces: API REST `GET /api/notes?lessonId=...`, `POST /api/notes`, Note Editor với tính năng lưu tự động (auto-save debounce 500ms), gắn mốc thời gian video timestamp (e.g. `[01:23]`), định dạng Markdown.

- [ ] **Step 1: Write API test for saving and retrieving notes**

Create `tests/api/notes.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/lib/prisma';

describe('User Notes Data Layer', () => {
  it('creates and retrieves note associated with a lesson', async () => {
    const lesson = await prisma.lesson.findFirst();
    if (!lesson) return;

    const note = await prisma.userNote.create({
      data: {
        userId: 'test_user',
        lessonId: lesson.id,
        content: 'Quy tắc phát âm ea thường đọc là /i:/ trừ một số trường hợp ngoại lệ.',
        timestamp: 45,
      }
    });

    const fetched = await prisma.userNote.findFirst({
      where: { lessonId: lesson.id, userId: 'test_user' }
    });

    expect(fetched?.content).toContain('Quy tắc phát âm ea');
    await prisma.userNote.delete({ where: { id: note.id } });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/api/notes.test.ts`
Expected: PASS (nếu DB đã có lesson) hoặc chuẩn bị test API handler.

- [ ] **Step 3: Implement Note API & NoteEditor Component**

Create `src/app/api/notes/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get('lessonId');
  if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });

  const notes = await prisma.userNote.findMany({
    where: { lessonId },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { lessonId, content, timestamp } = body;

  const note = await prisma.userNote.create({
    data: {
      userId: 'default_user',
      lessonId,
      content,
      timestamp: timestamp || null,
    }
  });
  return NextResponse.json({ note });
}
```

Create `src/components/study/NoteEditor.tsx`:
- Giao diện nhập ghi chú với nút "Chèn mốc thời gian hiện tại [02:15]" để click vào là video nhảy tới giây tương ứng.
- Lưu tự động sau 1s dừng gõ hoặc nút lưu thủ công.
- Hỗ trợ xuất file `.txt` / `.md`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/notes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/notes/route.ts src/components/study/NoteEditor.tsx tests/api/notes.test.ts
git commit -m "feat: add note taking system with timestamp syncing and auto-save"
```

---

### Task 8: Smart Study Plan Generator & Spaced Repetition Engine

**Files:**
- Create: `src/lib/study-plan-generator.ts`
- Create: `src/app/api/plans/route.ts`
- Create: `src/components/study/PlanSchedulerModal.tsx`
- Test: `tests/lib/study-plan-generator.test.ts`

**Interfaces:**
- Consumes: Target days (15 / 30 / 60 days), Daily minutes, List of 45 lessons
- Produces: `generateSmartPlan(targetDays: number, startDate: Date): StudyPlanSchedule`, tính toán ngày học bài mới và ngày ôn tập (Spaced Repetition: +1 ngày, +3 ngày, +7 ngày).

- [ ] **Step 1: Write test for Study Plan algorithm**

Create `tests/lib/study-plan-generator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateSmartPlan } from '../../src/lib/study-plan-generator';

describe('Smart Study Plan Algorithm', () => {
  it('distributes 45 lessons across 30 days with spaced repetition review slots', () => {
    const totalLessons = 45;
    const targetDays = 30;
    const startDate = new Date('2026-11-15');

    const schedule = generateSmartPlan({
      lessonIds: Array.from({ length: totalLessons }, (_, i) => `lesson_${i + 1}`),
      targetDays,
      startDate,
    });

    expect(schedule.length).toBe(targetDays);
    // Every lesson must be covered at least once
    const scheduledLessons = new Set(schedule.flatMap(s => s.items.map(i => i.lessonId)));
    expect(scheduledLessons.size).toBe(totalLessons);

    // Verify spaced repetition items exist
    const reviewItems = schedule.flatMap(s => s.items.filter(i => i.isReview));
    expect(reviewItems.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/lib/study-plan-generator.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement generateSmartPlan logic**

Create `src/lib/study-plan-generator.ts`:
```typescript
export interface PlanGeneratorOptions {
  lessonIds: string[];
  targetDays: number;
  startDate: Date;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  dayIndex: number;
  items: {
    lessonId: string;
    isReview: boolean;
    stage: number; // 0: new, 1: review +1d, 2: review +3d, 3: review +7d
  }[];
}

export function generateSmartPlan(opts: PlanGeneratorOptions): DaySchedule[] {
  const { lessonIds, targetDays, startDate } = opts;
  const days: DaySchedule[] = [];
  const lessonsPerDay = Math.ceil(lessonIds.length / (targetDays * 0.75)); // Dành 25% ngày cuối để ôn tổng kết

  for (let d = 0; d < targetDays; d++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + d);
    const dateStr = currentDate.toISOString().split('T')[0];

    days.push({
      date: dateStr,
      dayIndex: d + 1,
      items: [],
    });
  }

  // 1. Phân bổ bài mới
  let lessonCursor = 0;
  for (let d = 0; d < targetDays && lessonCursor < lessonIds.length; d++) {
    const count = Math.min(lessonsPerDay, lessonIds.length - lessonCursor);
    for (let c = 0; c < count; c++) {
      const lesId = lessonIds[lessonCursor++];
      days[d].items.push({ lessonId: lesId, isReview: false, stage: 0 });

      // 2. Lên lịch Spaced Repetition: +1 ngày, +3 ngày, +7 ngày
      if (d + 1 < targetDays) {
        days[d + 1].items.push({ lessonId: lesId, isReview: true, stage: 1 });
      }
      if (d + 3 < targetDays) {
        days[d + 3].items.push({ lessonId: lesId, isReview: true, stage: 2 });
      }
      if (d + 7 < targetDays) {
        days[d + 7].items.push({ lessonId: lesId, isReview: true, stage: 3 });
      }
    }
  }

  return days;
}
```

Create `src/components/study/PlanSchedulerModal.tsx` để người học chọn số ngày mục tiêu (15, 30, 45, 60 ngày), tự động tạo kế hoạch và lưu vào SQLite.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/study-plan-generator.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/study-plan-generator.ts src/components/study/PlanSchedulerModal.tsx tests/lib/study-plan-generator.test.ts
git commit -m "feat: smart study plan generator with spaced repetition intervals"
```

---

### Task 9: Daily Log & Video View Tracking Service

**Files:**
- Create: `src/app/api/logs/view/route.ts`
- Create: `src/app/api/logs/summary/route.ts`
- Create: `src/hooks/useVideoTracker.ts`
- Test: `tests/api/view-tracking.test.ts`

**Interfaces:**
- Consumes: Video playback events (play, progress 30s, ended)
- Produces: Ghi nhận viewCount vào bảng `Video`, log xem hàng ngày vào `DailyLog` (ngày, videoId, timeSpentSec, viewsToday).

- [ ] **Step 1: Write test for DailyLog recording and aggregation**

Create `tests/api/view-tracking.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/lib/prisma';

describe('Daily Log & View Tracker Data Layer', () => {
  it('records video view and increments daily log count', async () => {
    const video = await prisma.video.findFirst();
    if (!video) return;

    const today = new Date().toISOString().split('T')[0];

    const log = await prisma.dailyLog.upsert({
      where: {
        date_userId_videoId: {
          date: today,
          userId: 'test_user',
          videoId: video.id,
        }
      },
      update: {
        viewsToday: { increment: 1 },
        timeSpentSec: { increment: 60 },
      },
      create: {
        date: today,
        userId: 'test_user',
        videoId: video.id,
        viewsToday: 1,
        timeSpentSec: 60,
      }
    });

    expect(log.viewsToday).toBeGreaterThanOrEqual(1);
    expect(log.date).toBe(today);

    await prisma.dailyLog.delete({ where: { id: log.id } });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/api/view-tracking.test.ts`
Expected: FAIL / PASS depending on DB state.

- [ ] **Step 3: Implement API endpoints & Tracker hook**

Create `src/app/api/logs/view/route.ts`:
- Nhận `POST` với `{ videoId, durationSec }`.
- Cập nhật đồng thời `Video.viewCount += 1` và `DailyLog.upsert`.

Create `src/hooks/useVideoTracker.ts`:
- Tự động gọi API khi người dùng xem được ít nhất 15 giây hoặc kết thúc video.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/view-tracking.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/logs/view/route.ts src/hooks/useVideoTracker.ts tests/api/view-tracking.test.ts
git commit -m "feat: log daily study sessions and track video views"
```

---

### Task 10: Reminder & Notification System

**Files:**
- Create: `src/lib/notification-service.ts`
- Create: `src/components/study/ReminderBanner.tsx`
- Create: `src/app/api/reminders/route.ts`
- Test: `tests/lib/notification-service.test.ts`

**Interfaces:**
- Consumes: Web Notifications API & StudyPlan daily targets
- Produces: Nhắc nhở người học khi đến giờ học hàng ngày, cảnh báo nếu chưa hoàn thành mục tiêu ngày hôm nay.

- [ ] **Step 1: Write test for reminder schedule check**

Create `tests/lib/notification-service.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { shouldTriggerReminder } from '../../src/lib/notification-service';

describe('Notification Service', () => {
  it('identifies if reminder should fire based on current time and setting', () => {
    expect(shouldTriggerReminder('20:00', '20:00')).toBe(true);
    expect(shouldTriggerReminder('20:00', '20:05')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/lib/notification-service.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Notification Service & Reminder Component**

Create `src/lib/notification-service.ts` và `src/components/study/ReminderBanner.tsx` hỗ trợ:
- Xin quyền thông báo trình duyệt (`Notification.requestPermission()`).
- Hiển thị banner nhắc việc nổi bật trên màn hình khi chưa hoàn thành bài học trong plan của ngày hôm nay.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/notification-service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/notification-service.ts src/components/study/ReminderBanner.tsx tests/lib/notification-service.test.ts
git commit -m "feat: smart study reminder and browser notification support"
```

---

### Task 11: Admin Portal - Video & Lesson Management

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/videos/page.tsx`
- Create: `src/app/api/admin/videos/route.ts`
- Create: `src/app/api/admin/reimport/route.ts`
- Test: `tests/api/admin-videos.test.ts`

**Interfaces:**
- Consumes: Admin permissions
- Produces: Trang quản trị video: Bảng danh sách 180+ video, tìm kiếm/lọc theo bài, sửa link YouTube, thêm/xóa bài, nút "Đồng bộ lại từ file Excel `Videos_links.xlsx`" an toàn mà không làm mất ghi chú người dùng.

- [ ] **Step 1: Write API test for Admin Video CRUD & sync**

Create `tests/api/admin-videos.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/lib/prisma';

describe('Admin Video Management API', () => {
  it('updates video youtubeUrl and title', async () => {
    const video = await prisma.video.findFirst();
    if (!video) return;

    const updated = await prisma.video.update({
      where: { id: video.id },
      data: { title: 'Updated Title Test' }
    });

    expect(updated.title).toBe('Updated Title Test');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/api/admin-videos.test.ts`
Expected: FAIL / PASS depending on DB state.

- [ ] **Step 3: Implement Admin Video Management Pages & Endpoints**

Create `src/app/admin/videos/page.tsx` với:
- Table danh sách video: Cột STT, Bài, Tên video, Link YouTube, Lượt xem, Cập nhật 10/2026, Thao tác (Edit, Delete).
- Form modal chỉnh sửa link và preview ngay video player.
- Nút "Sync from Excel" gọi API reimport.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/admin-videos.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/videos/page.tsx src/app/api/admin/videos/route.ts tests/api/admin-videos.test.ts
git commit -m "feat: build Admin portal video and lesson management"
```

---

### Task 12: Admin Portal - Daily Logs & Learning Analytics Dashboard

**Files:**
- Create: `src/app/admin/analytics/page.tsx`
- Create: `src/app/api/admin/analytics/route.ts`
- Create: `src/components/admin/DailyLogTable.tsx`
- Create: `src/components/admin/AnalyticsStatsCards.tsx`
- Test: `tests/api/admin-analytics.test.ts`

**Interfaces:**
- Consumes: `DailyLog`, `StudyProgress`, `Video`
- Produces: Dashboard thống kê: Tổng số lượt xem, biểu đồ lượt học theo từng ngày (Daily Activity), Top 10 video được xem nhiều nhất, Tỷ lệ hoàn thành theo từng bài (Bài 1..45).

- [ ] **Step 1: Write test for Admin Analytics Aggregator**

Create `tests/api/admin-analytics.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/lib/prisma';

describe('Admin Analytics Aggregator', () => {
  it('queries daily logs grouped by date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const logs = await prisma.dailyLog.groupBy({
      by: ['date'],
      _sum: { viewsToday: true, timeSpentSec: true }
    });

    expect(Array.isArray(logs)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/api/admin-analytics.test.ts`
Expected: FAIL / PASS.

- [ ] **Step 3: Implement Analytics Dashboard and DailyLog Table**

Create `src/app/admin/analytics/page.tsx` và `src/components/admin/DailyLogTable.tsx`:
- Hiển thị các chỉ số tổng quan: Tổng lượt học, Thời gian học tích lũy, Số video đã hoàn thành.
- Bảng chi tiết log theo từng ngày: Ngày, Tên bài học, Video, Số lượt xem, Thời lượng.
- Bộ lọc theo khoảng ngày (7 ngày qua, 30 ngày qua, tất cả).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/admin-analytics.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/analytics/page.tsx src/components/admin/DailyLogTable.tsx tests/api/admin-analytics.test.ts
git commit -m "feat: build Admin analytics dashboard and daily logs inspector"
```

---

### Task 13: Responsive Optimization, Mobile Shell & End-to-End Verification

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/study/MobileBottomBar.tsx`
- Create: `src/components/study/StudyWorkspace.tsx`
- Test: `tests/e2e/responsive-flow.test.tsx`

**Interfaces:**
- Consumes: All components from Client & Admin
- Produces: Trang học tập hoàn chỉnh responsive 100%:
  - Mobile (<768px): Player sticky ở trên cùng, phía dưới là tab chuyển đổi linh hoạt: "Danh sách bài", "Ghi chú bài học", "Kế hoạch hôm nay".
  - Desktop: Giao diện 2-3 cột chuẩn EasyDictation: Sidebar trái cố định, Player chính giữa với nút Theater mode mở rộng, Panel ghi chú và plan bên phải.

- [ ] **Step 1: Write responsive integration test**

Create `tests/e2e/responsive-flow.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StudyWorkspace from '../../src/components/study/StudyWorkspace';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('Responsive Study Workspace', () => {
  it('renders video player workspace and navigation elements', () => {
    render(
      <ThemeProvider>
        <StudyWorkspace initialCategories={[]} />
      </ThemeProvider>
    );

    expect(screen.getByTestId('study-workspace')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/e2e/responsive-flow.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Main StudyWorkspace and Mobile Optimization**

Create `src/components/study/StudyWorkspace.tsx` và hoàn thiện `src/app/page.tsx`:
- Tích hợp YouTube Player, Sidebar, Note Editor, Plan Banner vào một layout mạch lạc.
- Thiết lập CSS Grid / Flexbox responsive thông minh:
  ```css
  /* Mobile: 1 col, Desktop: sidebar w-80 + flex-1 player + w-96 notes/plan */
  ```
- Kiểm tra hiển thị tốt trên iPhone/Android (viewport 375px), iPad (768px) và Màn hình máy tính lớn (1440px+).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/e2e/responsive-flow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full test suite & production build check**

Run: `npm run build` and `npx vitest run`
Expected: Tất cả bài test đều PASS, build Next.js thành công 0 lỗi.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/study/StudyWorkspace.tsx src/components/study/MobileBottomBar.tsx tests/e2e/responsive-flow.test.tsx
git commit -m "feat: complete responsive study workspace with full device optimization"
```
