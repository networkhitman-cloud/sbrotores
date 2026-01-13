
import { Category } from './types';

export const BANK_LIST = [
  'HBL',
  'Meezan Bank',
  'UBL Bank',
  'Allied Bank',
  'Faysal Bank',
  'Alfalah Bank',
  'Other Bank'
];

export const CATEGORIES = Object.values(Category);

export const COLORS = {
  [Category.ChaqueReceivables]: 'emerald',
  [Category.ChaquePayables]: 'rose',
  [Category.LongTermReceivables]: 'amber',
  [Category.LongTermPayables]: 'blue',
  [Category.UnknownOnline]: 'violet',
};
