export interface SettlementUser {
  id: number;
  name: string;
  username: string;
}

export interface SettlementItem {
  price: number;
  users: SettlementUser[];
}

export interface SettlementPayment {
  amount: number;
  user: SettlementUser;
}

export interface SettlementCalculatorInput {
  items: SettlementItem[];
  payments: SettlementPayment[];
}

export interface SettlementPayer {
  user: SettlementUser;
  paidAmount: number;
}

export interface SettlementDebt {
  from: SettlementUser;
  to: SettlementUser;
  amount: number;
}

export interface SettlementSummary {
  total: number;
  payers: SettlementPayer[];
  debts: SettlementDebt[];
}

interface BalanceEntry {
  user: SettlementUser;
  amount: number;
}

export class SettlementCalculatorService {
  calculate(input: SettlementCalculatorInput): SettlementSummary {
    const consumedByUser = this.calculateConsumedByUser(input.items);
    const paidByUser = this.calculatePaidByUser(input.payments);
    const usersById = this.collectUsersById(input);

    const balances = Array.from(usersById.values()).map((user) => {
      const consumedAmount = consumedByUser.get(user.id) ?? 0;
      const paidAmount = paidByUser.get(user.id) ?? 0;

      return {
        user,
        amount: paidAmount - consumedAmount,
      };
    });

    const debtors = balances
      .filter((balance) => balance.amount < 0)
      .map((balance) => ({
        user: balance.user,
        amount: Math.abs(balance.amount),
      }))
      .sort(this.sortByAmountDesc);

    const creditors = balances
      .filter((balance) => balance.amount > 0)
      .sort(this.sortByAmountDesc);

    return {
      total: input.items.reduce((total, item) => total + item.price, 0),
      payers: this.mapPayers(input.payments),
      debts: this.calculateDebts(debtors, creditors),
    };
  }

  private calculateConsumedByUser(
    items: SettlementItem[],
  ): Map<number, number> {
    return items.reduce((consumedByUser, item) => {
      const consumers = [...item.users].sort((a, b) => a.id - b.id);

      if (consumers.length === 0) {
        return consumedByUser;
      }

      const baseAmount = Math.floor(item.price / consumers.length);
      const remainder = item.price % consumers.length;

      consumers.forEach((user, index) => {
        const share = baseAmount + (index < remainder ? 1 : 0);
        consumedByUser.set(user.id, (consumedByUser.get(user.id) ?? 0) + share);
      });

      return consumedByUser;
    }, new Map<number, number>());
  }

  private calculatePaidByUser(
    payments: SettlementPayment[],
  ): Map<number, number> {
    return payments.reduce((paidByUser, payment) => {
      paidByUser.set(
        payment.user.id,
        (paidByUser.get(payment.user.id) ?? 0) + payment.amount,
      );

      return paidByUser;
    }, new Map<number, number>());
  }

  private collectUsersById(
    input: SettlementCalculatorInput,
  ): Map<number, SettlementUser> {
    const usersById = new Map<number, SettlementUser>();

    input.items.forEach((item) => {
      item.users.forEach((user) => usersById.set(user.id, user));
    });

    input.payments.forEach((payment) => {
      usersById.set(payment.user.id, payment.user);
    });

    return usersById;
  }

  private mapPayers(payments: SettlementPayment[]): SettlementPayer[] {
    const payersByUser = new Map<number, SettlementPayer>();

    payments.forEach((payment) => {
      const payer = payersByUser.get(payment.user.id);

      if (!payer) {
        payersByUser.set(payment.user.id, {
          user: payment.user,
          paidAmount: payment.amount,
        });
        return;
      }

      payersByUser.set(payment.user.id, {
        user: payer.user,
        paidAmount: payer.paidAmount + payment.amount,
      });
    });

    return Array.from(payersByUser.values()).sort(
      (a, b) => b.paidAmount - a.paidAmount,
    );
  }

  private calculateDebts(
    debtors: BalanceEntry[],
    creditors: BalanceEntry[],
  ): SettlementDebt[] {
    const availableCreditors = creditors.map((creditor) => ({ ...creditor }));

    return debtors.flatMap((debtor) => {
      availableCreditors.sort(this.sortByAmountDesc);

      const singleCreditorIndex = availableCreditors.findIndex(
        (creditor) => creditor.amount >= debtor.amount,
      );

      if (singleCreditorIndex >= 0) {
        const creditor = availableCreditors[singleCreditorIndex];
        creditor.amount -= debtor.amount;

        return [
          {
            from: debtor.user,
            to: creditor.user,
            amount: debtor.amount,
          },
        ];
      }

      return this.splitDebtAcrossCreditors(debtor, availableCreditors);
    });
  }

  private splitDebtAcrossCreditors(
    debtor: BalanceEntry,
    creditors: BalanceEntry[],
  ): SettlementDebt[] {
    const debts: SettlementDebt[] = [];
    let remainingDebt = debtor.amount;

    creditors.forEach((creditor) => {
      if (remainingDebt === 0 || creditor.amount === 0) {
        return;
      }

      const amount = Math.min(remainingDebt, creditor.amount);
      creditor.amount -= amount;
      remainingDebt -= amount;

      debts.push({
        from: debtor.user,
        to: creditor.user,
        amount,
      });
    });

    return debts;
  }

  private sortByAmountDesc(a: BalanceEntry, b: BalanceEntry): number {
    return b.amount - a.amount;
  }
}
