
export enum Category {
  ChaqueReceivables = "Chaque Receivables",
  ChaquePayables = "Chaque Payables",
  LongTermPayables = "Long Term Payables",
  LongTermReceivables = "Long Term Receivables",
  UnknownOnline = "Unknown Online"
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  chaqueNo: string;
  voucherNo: string;
}

export interface Entry {
  id: string;
  category: Category;
  date: string;
  transactionDate?: string;
  refNo: string;
  partyName: string;
  bankName: string;
  bankAccountNum: string;
  desc: string;
  totalAmount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Confirmed' | 'Overdue' | 'Active';
  confirmedBy?: string;
  payments: Payment[];
}

export type StatFilter = 'total' | 'paid' | 'pending' | 'overdue' | null;
export type ViewMode = Category | 'dashboard';
