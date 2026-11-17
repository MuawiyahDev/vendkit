import { StockMovementReason, StockMovementType } from '@repo/database';
import {
  buildInventoryStatusCondition,
  deriveStockStatus,
  resolveAdjustment,
} from './inventory.utils.js';

const thresholdField = 'Product.lowStockThreshold';

describe('inventory utils', () => {
  describe('deriveStockStatus', () => {
    it('marks untracked products regardless of quantity', () => {
      expect(deriveStockStatus(false, 10, 5)).toBe('untracked');
    });

    it('marks zero and negative quantities as out of stock', () => {
      expect(deriveStockStatus(true, 0, 5)).toBe('out-of-stock');
      expect(deriveStockStatus(true, -1, 5)).toBe('out-of-stock');
    });

    it('marks quantities at or below the threshold as low stock', () => {
      expect(deriveStockStatus(true, 5, 5)).toBe('low-stock');
      expect(deriveStockStatus(true, 4, 5)).toBe('low-stock');
    });

    it('marks healthy quantities as in stock', () => {
      expect(deriveStockStatus(true, 6, 5)).toBe('in-stock');
      expect(deriveStockStatus(true, 1, null)).toBe('in-stock');
    });
  });

  describe('buildInventoryStatusCondition', () => {
    it('returns no condition for all', () => {
      expect(buildInventoryStatusCondition('all', thresholdField)).toBeNull();
    });

    it('builds the low-stock condition with a field reference', () => {
      expect(buildInventoryStatusCondition('low-stock', thresholdField)).toEqual({
        trackInventory: true,
        stockQuantity: { gt: 0, lte: thresholdField },
      });
    });

    it('builds the out-of-stock condition', () => {
      expect(
        buildInventoryStatusCondition('out-of-stock', thresholdField),
      ).toEqual({ trackInventory: true, stockQuantity: { lte: 0 } });
    });
  });

  describe('resolveAdjustment', () => {
    it('increases stock', () => {
      expect(
        resolveAdjustment({ stockQuantity: 10 }, 'increase', 3, StockMovementReason.RESTOCK),
      ).toEqual({
        quantityChange: 3,
        newQuantity: 13,
        type: StockMovementType.MANUAL_INCREASE,
      });
    });

    it('decreases stock', () => {
      expect(
        resolveAdjustment({ stockQuantity: 10 }, 'decrease', 4, StockMovementReason.DAMAGED),
      ).toEqual({
        quantityChange: -4,
        newQuantity: 6,
        type: StockMovementType.DAMAGE,
      });
    });

    it('sets an exact quantity', () => {
      expect(
        resolveAdjustment({ stockQuantity: 10 }, 'set', 7, StockMovementReason.CORRECTION),
      ).toEqual({
        quantityChange: -3,
        newQuantity: 7,
        type: StockMovementType.SET,
      });
    });

    it('maps a customer return to the return movement type', () => {
      expect(
        resolveAdjustment(
          { stockQuantity: 10 },
          'increase',
          2,
          StockMovementReason.CUSTOMER_RETURN,
        ).type,
      ).toBe(StockMovementType.RETURN);
    });

    it('rejects decreasing below zero', () => {
      expect(() =>
        resolveAdjustment({ stockQuantity: 2 }, 'decrease', 3, StockMovementReason.LOST),
      ).toThrow('below zero');
    });

    it('rejects a no-op adjustment', () => {
      expect(() =>
        resolveAdjustment({ stockQuantity: 2 }, 'set', 2, StockMovementReason.CORRECTION),
      ).toThrow('already at the requested quantity');
    });

    it('rejects reasons that do not fit the mode', () => {
      expect(() =>
        resolveAdjustment(
          { stockQuantity: 2 },
          'increase',
          1,
          StockMovementReason.DAMAGED,
        ),
      ).toThrow('cannot be used');
    });

    it('rejects fractional quantities', () => {
      expect(() =>
        resolveAdjustment(
          { stockQuantity: 2 },
          'increase',
          1.5,
          StockMovementReason.RESTOCK,
        ),
      ).toThrow('whole number');
    });
  });
});
