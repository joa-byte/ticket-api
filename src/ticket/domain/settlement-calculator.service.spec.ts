import { describe, expect, it } from '@jest/globals';
import { SettlementCalculatorService } from './settlement-calculator.service';

describe('SettlementCalculatorService', () => {
  const calculator = new SettlementCalculatorService();
  const joa = { id: 1, name: 'Joa', username: 'joa' };
  const juan = { id: 2, name: 'Juan', username: 'juan' };
  const ana = { id: 3, name: 'Ana', username: 'ana' };
  const luz = { id: 4, name: 'Luz', username: 'luz' };

  it('returns no debts when balances are zero', () => {
    const summary = calculator.calculate({
      items: [
        { price: 1000, quantity: 1, users: [{ user: joa, quantity: 1 }] },
        { price: 1000, quantity: 1, users: [{ user: juan, quantity: 1 }] },
      ],
      payments: [
        { amount: 1000, user: joa },
        { amount: 1000, user: juan },
      ],
    });

    expect(summary).toEqual({
      total: 2000,
      payers: [
        { user: joa, paidAmount: 1000 },
        { user: juan, paidAmount: 1000 },
      ],
      debts: [],
    });
  });

  it('assigns a debtor to one creditor when the creditor can cover the debt', () => {
    const summary = calculator.calculate({
      items: [
        {
          price: 3000,
          quantity: 1,
          users: [
            { user: joa, quantity: 1 / 3 },
            { user: juan, quantity: 1 / 3 },
            { user: ana, quantity: 1 / 3 },
          ],
        },
        { price: 1500, quantity: 1, users: [{ user: ana, quantity: 1 }] },
      ],
      payments: [{ amount: 4500, user: joa }],
    });

    expect(summary.debts).toEqual([
      { from: ana, to: joa, amount: 2500 },
      { from: juan, to: joa, amount: 1000 },
    ]);
  });

  it('splits a debt only when no creditor can cover it completely', () => {
    const summary = calculator.calculate({
      items: [
        { price: 5000, quantity: 1, users: [{ user: juan, quantity: 1 }] },
        { price: 1000, quantity: 1, users: [{ user: joa, quantity: 1 }] },
        { price: 1000, quantity: 1, users: [{ user: ana, quantity: 1 }] },
        { price: 1000, quantity: 1, users: [{ user: luz, quantity: 1 }] },
      ],
      payments: [
        { amount: 3000, user: joa },
        { amount: 3000, user: ana },
        { amount: 2000, user: luz },
      ],
    });

    expect(summary.debts).toEqual([
      { from: juan, to: joa, amount: 2000 },
      { from: juan, to: ana, amount: 2000 },
      { from: juan, to: luz, amount: 1000 },
    ]);
  });

  it('preserves total cents when splitting indivisible item prices', () => {
    const summary = calculator.calculate({
      items: [
        {
          price: 100,
          quantity: 1,
          users: [
            { user: joa, quantity: 1 / 3 },
            { user: juan, quantity: 1 / 3 },
            { user: ana, quantity: 1 / 3 },
          ],
        },
      ],
      payments: [{ amount: 100, user: joa }],
    });

    const totalDebt = summary.debts.reduce(
      (total, debt) => total + debt.amount,
      0,
    );

    expect(summary.total).toBe(100);
    expect(totalDebt).toBe(66);
  });

  it('uses item quantity to calculate total consumption', () => {
    const summary = calculator.calculate({
      items: [
        {
          price: 1000,
          quantity: 0.5,
          users: [
            { user: joa, quantity: 0.25 },
            { user: juan, quantity: 0.25 },
          ],
        },
      ],
      payments: [{ amount: 500, user: joa }],
    });

    expect(summary.total).toBe(500);
    expect(summary.debts).toEqual([{ from: juan, to: joa, amount: 250 }]);
  });

  it('rejects negative item quantities', () => {
    expect(() =>
      calculator.calculate({
        items: [
          {
            price: 1000,
            quantity: -1,
            users: [{ user: joa, quantity: -1 }],
          },
        ],
        payments: [],
      }),
    ).toThrow('Item quantity must be a non-negative number');
  });

  it('rejects negative item user quantities', () => {
    expect(() =>
      calculator.calculate({
        items: [
          {
            price: 1000,
            quantity: 1,
            users: [{ user: joa, quantity: -1 }],
          },
        ],
        payments: [],
      }),
    ).toThrow('Item user quantity must be a non-negative number');
  });

  it('rejects item user quantities that do not match the item quantity', () => {
    expect(() =>
      calculator.calculate({
        items: [
          {
            price: 1000,
            quantity: 1,
            users: [{ user: joa, quantity: 0.5 }],
          },
        ],
        payments: [],
      }),
    ).toThrow('Item user quantities must match item quantity');
  });
});
