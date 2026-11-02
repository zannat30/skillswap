'use client';

import React from 'react';
import { Transaction } from '@/types';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const getBadgeVariant = (type: string): BadgeVariant => {
    switch (type) {
      case 'BONUS':
        return 'violet';
      case 'ESCROW_LOCK':
        return 'amber';
      case 'RELEASE':
        return 'emerald';
      case 'REFUND':
        return 'cyan';
      case 'BURN':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const isPositive = tx.amount >= 0;
          return (
            <TableRow key={tx._id}>
              <TableCell>
                <Badge variant={getBadgeVariant(tx.type)}>{tx.type}</Badge>
              </TableCell>
              <TableCell>{tx.description}</TableCell>
              <TableCell
                className={`text-right font-bold ${
                  isPositive ? 'text-emerald' : 'text-amber'
                }`}
              >
                {isPositive ? `+${tx.amount} CR` : `${tx.amount} CR`}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
