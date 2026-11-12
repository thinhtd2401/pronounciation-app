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
    expect(category.lessons[0].videos.length).toBe(1);
    expect(category.lessons[0].videos[0].youtubeId).toBe('okuNL2IdgZo');

    // Clean up
    await prisma.category.delete({ where: { id: category.id } });
  });

  it('can create and query StudyProgress and UserNote', async () => {
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        lessons: {
          create: {
            code: 'Test 1',
            title: 'Test Lesson',
            videos: {
              create: {
                title: 'Test Video',
                youtubeUrl: 'https://youtu.be/test1234',
                youtubeId: 'test1234',
              }
            }
          }
        }
      },
      include: {
        lessons: {
          include: { videos: true }
        }
      }
    });

    const lesson = category.lessons[0];
    const video = lesson.videos[0];

    // Create StudyProgress
    const progress = await prisma.studyProgress.create({
      data: {
        userId: 'user_1',
        lessonId: lesson.id,
        videoId: video.id,
        isCompleted: true,
        lastPositionSec: 120,
        watchCount: 2,
      }
    });

    expect(progress.isCompleted).toBe(true);
    expect(progress.lastPositionSec).toBe(120);

    // Create UserNote
    const note = await prisma.userNote.create({
      data: {
        userId: 'user_1',
        lessonId: lesson.id,
        content: 'Chú ý khẩu hình miệng khi phát âm âm /i:/',
        timestamp: 45,
      }
    });

    expect(note.content).toContain('khẩu hình');
    expect(note.timestamp).toBe(45);

    // Clean up
    await prisma.category.delete({ where: { id: category.id } });
  });

  it('can create and query DailyLog', async () => {
    const category = await prisma.category.create({
      data: {
        name: 'Log Cat',
        lessons: {
          create: {
            code: 'Log 1',
            title: 'Log Lesson',
            videos: {
              create: {
                title: 'Log Video',
                youtubeUrl: 'https://youtu.be/log1234',
                youtubeId: 'log1234',
              }
            }
          }
        }
      },
      include: { lessons: { include: { videos: true } } }
    });

    const video = category.lessons[0].videos[0];

    const log = await prisma.dailyLog.create({
      data: {
        date: '2026-11-12',
        userId: 'user_1',
        videoId: video.id,
        timeSpentSec: 300,
        viewsToday: 1,
        completedToday: true,
      }
    });

    expect(log.date).toBe('2026-11-12');
    expect(log.timeSpentSec).toBe(300);
    expect(log.completedToday).toBe(true);

    // Clean up
    await prisma.category.delete({ where: { id: category.id } });
  });

  it('can create StudyPlan with PlanItems', async () => {
    const category = await prisma.category.create({
      data: {
        name: 'Plan Cat',
        lessons: {
          create: {
            code: 'Plan 1',
            title: 'Plan Lesson',
          }
        }
      },
      include: { lessons: true }
    });

    const lesson = category.lessons[0];

    const plan = await prisma.studyPlan.create({
      data: {
        userId: 'user_1',
        title: 'Plan 30 ngày',
        targetDays: 30,
        dailyMinutes: 20,
        items: {
          create: {
            lessonId: lesson.id,
            scheduledDate: '2026-11-13',
            reviewStage: 0,
          }
        }
      },
      include: { items: true }
    });

    expect(plan.title).toBe('Plan 30 ngày');
    expect(plan.items.length).toBe(1);
    expect(plan.items[0].scheduledDate).toBe('2026-11-13');

    // Clean up
    await prisma.studyPlan.delete({ where: { id: plan.id } });
    await prisma.category.delete({ where: { id: category.id } });
  });

  it('can create and query Reminder', async () => {
    const reminder = await prisma.reminder.create({
      data: {
        userId: 'user_1',
        time: '20:30',
        daysOfWeek: '1,2,3,4,5',
        isEnabled: true,
        channel: 'browser',
      }
    });

    expect(reminder.time).toBe('20:30');
    expect(reminder.daysOfWeek).toBe('1,2,3,4,5');
    expect(reminder.isEnabled).toBe(true);

    // Clean up
    await prisma.reminder.delete({ where: { id: reminder.id } });
  });

  it('verifies cascading delete on category removes lessons and videos', async () => {
    const category = await prisma.category.create({
      data: {
        name: 'Cascade Cat',
        lessons: {
          create: {
            code: 'Cascade 1',
            title: 'Cascade Lesson',
            videos: {
              create: {
                title: 'Cascade Video',
                youtubeUrl: 'https://youtu.be/cascade123',
                youtubeId: 'cascade123',
              }
            }
          }
        }
      },
      include: { lessons: { include: { videos: true } } }
    });

    const lessonId = category.lessons[0].id;
    const videoId = category.lessons[0].videos[0].id;

    await prisma.category.delete({ where: { id: category.id } });

    const foundLesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    const foundVideo = await prisma.video.findUnique({ where: { id: videoId } });

    expect(foundLesson).toBeNull();
    expect(foundVideo).toBeNull();
  });
});
