import { BadRequestException } from '@nestjs/common';
import {
  calculatePercentageChange,
  generateBuckets,
  getPeriodInstants,
  getTodayInTimeZone,
  parseLocalDate,
  resolveDashboardRange,
  zonedStartOfDayToUtc,
} from './dashboard.utils.js';

const DHAKA = 'Asia/Dhaka';
const NEW_YORK = 'America/New_York';

describe('dashboard.utils', () => {
  describe('resolveDashboardRange', () => {
    const now = new Date('2026-11-15T10:00:00.000Z');

    it('resolves today and yesterday in the business timezone', () => {
      const today = resolveDashboardRange({
        preset: 'today',
        timeZone: DHAKA,
        now,
      });

      expect(today.current).toEqual({
        from: { year: 2026, month: 11, day: 15 },
        to: { year: 2026, month: 11, day: 15 },
      });
      expect(today.previous).toEqual({
        from: { year: 2026, month: 11, day: 14 },
        to: { year: 2026, month: 11, day: 14 },
      });
      expect(today.granularity).toBe('hour');

      const yesterday = resolveDashboardRange({
        preset: 'yesterday',
        timeZone: DHAKA,
        now,
      });

      expect(yesterday.current.from).toEqual({
        year: 2026,
        month: 11,
        day: 14,
      });
      expect(yesterday.previous.to).toEqual({
        year: 2026,
        month: 11,
        day: 13,
      });
    });

    it('uses an equal-length immediately preceding window for rolling ranges', () => {
      const range = resolveDashboardRange({
        preset: 'last-7-days',
        timeZone: DHAKA,
        now,
      });

      expect(range.current.from).toEqual({ year: 2026, month: 11, day: 9 });
      expect(range.current.to).toEqual({ year: 2026, month: 11, day: 15 });
      expect(range.previous.from).toEqual({ year: 2026, month: 11, day: 2 });
      expect(range.previous.to).toEqual({ year: 2026, month: 11, day: 8 });
      expect(range.granularity).toBe('day');
    });

    it('compares this month with the same span of the previous month', () => {
      const range = resolveDashboardRange({
        preset: 'this-month',
        timeZone: DHAKA,
        now,
      });

      expect(range.current.from).toEqual({ year: 2026, month: 11, day: 1 });
      expect(range.current.to).toEqual({ year: 2026, month: 11, day: 15 });
      expect(range.previous.from).toEqual({ year: 2026, month: 10, day: 1 });
      expect(range.previous.to).toEqual({ year: 2026, month: 10, day: 15 });
    });

    it('clamps the previous month-to-date comparison to the month length', () => {
      const range = resolveDashboardRange({
        preset: 'this-month',
        timeZone: DHAKA,
        now: new Date('2026-03-31T10:00:00.000Z'),
      });

      expect(range.current.to).toEqual({ year: 2026, month: 3, day: 31 });
      expect(range.previous.to).toEqual({ year: 2026, month: 2, day: 28 });
    });

    it('compares last month with the month before it', () => {
      const range = resolveDashboardRange({
        preset: 'last-month',
        timeZone: DHAKA,
        now,
      });

      expect(range.current.from).toEqual({ year: 2026, month: 10, day: 1 });
      expect(range.current.to).toEqual({ year: 2026, month: 10, day: 31 });
      expect(range.previous.from).toEqual({ year: 2026, month: 9, day: 1 });
      expect(range.previous.to).toEqual({ year: 2026, month: 9, day: 30 });
    });

    it('supports custom ranges and picks a weekly granularity for wide spans', () => {
      const range = resolveDashboardRange({
        preset: 'custom',
        from: '2026-01-01',
        to: '2026-04-30',
        timeZone: DHAKA,
        now,
      });

      expect(range.current.from).toEqual({ year: 2026, month: 1, day: 1 });
      expect(range.current.to).toEqual({ year: 2026, month: 4, day: 30 });
      expect(range.granularity).toBe('week');
    });

    it('rejects invalid custom ranges', () => {
      expect(() =>
        resolveDashboardRange({
          preset: 'custom',
          from: '2026-04-30',
          to: '2026-04-01',
          timeZone: DHAKA,
          now,
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        resolveDashboardRange({
          preset: 'custom',
          from: '2026-01-01',
          timeZone: DHAKA,
          now,
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('timezone boundaries', () => {
    it('converts midnight in Dhaka to the previous UTC evening', () => {
      const instant = zonedStartOfDayToUtc(
        { year: 2026, month: 1, day: 1 },
        DHAKA,
      );

      expect(instant.toISOString()).toBe('2025-12-31T18:00:00.000Z');
    });

    it('accounts for daylight-saving transitions', () => {
      const beforeDst = zonedStartOfDayToUtc(
        { year: 2026, month: 3, day: 8 },
        NEW_YORK,
      );
      const afterDst = zonedStartOfDayToUtc(
        { year: 2026, month: 3, day: 9 },
        NEW_YORK,
      );

      expect(beforeDst.toISOString()).toBe('2026-03-08T05:00:00.000Z');
      expect(afterDst.toISOString()).toBe('2026-03-09T04:00:00.000Z');
    });

    it('returns an exclusive end instant for the following local day', () => {
      const period = getPeriodInstants(
        {
          from: { year: 2026, month: 11, day: 15 },
          to: { year: 2026, month: 11, day: 15 },
        },
        DHAKA,
      );

      expect(period.start.toISOString()).toBe('2026-11-14T18:00:00.000Z');
      expect(period.end.toISOString()).toBe('2026-11-15T18:00:00.000Z');
    });

    it('resolves the local calendar date near a UTC boundary', () => {
      const instant = new Date('2026-11-14T20:00:00.000Z');

      expect(getTodayInTimeZone(instant, DHAKA)).toEqual({
        year: 2026,
        month: 11,
        day: 15,
      });
      expect(getTodayInTimeZone(instant, 'America/Los_Angeles')).toEqual({
        year: 2026,
        month: 11,
        day: 14,
      });
    });
  });

  describe('parseLocalDate', () => {
    it('rejects malformed and impossible dates', () => {
      expect(() => parseLocalDate('2026-02-30')).toThrow(BadRequestException);
      expect(() => parseLocalDate('15/11/2026')).toThrow(BadRequestException);
    });
  });

  describe('generateBuckets', () => {
    it('fills every day in a daily range', () => {
      expect(
        generateBuckets(
          { year: 2026, month: 11, day: 1 },
          { year: 2026, month: 11, day: 3 },
          'day',
        ),
      ).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
    });

    it('fills every hour in an hourly range', () => {
      const buckets = generateBuckets(
        { year: 2026, month: 11, day: 15 },
        { year: 2026, month: 11, day: 15 },
        'hour',
      );

      expect(buckets).toHaveLength(24);
      expect(buckets[0]).toBe('2026-11-15T00:00');
      expect(buckets[23]).toBe('2026-11-15T23:00');
    });

    it('aligns weekly buckets to Mondays', () => {
      expect(
        generateBuckets(
          { year: 2026, month: 11, day: 15 },
          { year: 2026, month: 11, day: 20 },
          'week',
        ),
      ).toEqual(['2026-11-09', '2026-11-16']);
    });

    it('fills every month in a monthly range', () => {
      expect(
        generateBuckets(
          { year: 2026, month: 1, day: 15 },
          { year: 2026, month: 3, day: 2 },
          'month',
        ),
      ).toEqual(['2026-01', '2026-02', '2026-03']);
    });
  });

  describe('calculatePercentageChange', () => {
    it('returns null without a usable comparison base', () => {
      expect(calculatePercentageChange(100, 0)).toBeNull();
      expect(calculatePercentageChange(100, null)).toBeNull();
    });

    it('rounds percentage changes to one decimal place', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
      expect(calculatePercentageChange(50, 100)).toBe(-50);
      expect(calculatePercentageChange(0, 100)).toBe(-100);
      expect(calculatePercentageChange(133, 100)).toBe(33);
      expect(calculatePercentageChange(101, 100)).toBe(1);
    });
  });
});
