'use client';

import React from 'react';
import { Transaction } from '@/types';

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'BONUS':
        return 'badge-type badge-bonus';
      case 'ESCROW_LOCK':
        return 'badge-type badge-lock';
      case 'RELEASE':
        return 'badge-type badge-release';
      case 'REFUND':
        return 'badge-type badge-refund';
      case 'BURN':
        return 'badge-type badge-burn';
      default:
        return 'badge-type badge-bonus';
    }
  };

  return (
    <div className="table-container">
      <table className="ledger-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isPositive = tx.amount >= 0;
            return (
              <tr key={tx._id}>
                <td>
                  <span className={getBadgeClass(tx.type)}>{tx.type}</span>
                </td>
                <td>{tx.description}</td>
                <td
                  className={`text-right font-bold ${
                    isPositive ? 'text-emerald' : 'text-amber'
                  }`}
                >
                  {isPositive ? `+${tx.amount}` : tx.amount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
