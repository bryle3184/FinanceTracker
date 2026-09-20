// @ts-check
/**
 * Static category catalog. Colors are hex constants shared across charts,
 * budgets and transaction rows so a category is always the same hue.
 *
 * `essential` tags which categories are life-essential (used by budgets).
 */

/** @typedef {'food'|'groceries'|'dining'|'transport'|'housing'|'utilities'|'health'|'insurance'|'entertainment'|'shopping'|'personal'|'kids'|'education'|'travel'|'bills'|'debt'|'investments'|'other_expense'|'salary'|'freelance'|'investments_income'|'gifts'|'refunds'|'other_income'} CategoryId */

export const EXPENSE_CATEGORIES = [
  { id: 'groceries', label: 'Groceries', color: '#4cc9a4', essential: true },
  { id: 'dining', label: 'Dining & Coffee', color: '#f4a261', essential: false },
  { id: 'food', label: 'Food & Misc', color: '#e9c46a', essential: true },
  { id: 'transport', label: 'Transport & Gas', color: '#8ab4f8', essential: true },
  { id: 'housing', label: 'Housing / Rent', color: '#b5838d', essential: true },
  { id: 'utilities', label: 'Utilities', color: '#80b918', essential: true },
  { id: 'health', label: 'Health & Fitness', color: '#ef476f', essential: true },
  { id: 'insurance', label: 'Insurance', color: '#06d6a0', essential: true },
  { id: 'entertainment', label: 'Entertainment', color: '#9d4edd', essential: false },
  { id: 'shopping', label: 'Shopping', color: '#ff70a6', essential: false },
  { id: 'personal', label: 'Personal Care', color: '#fb8500', essential: false },
  { id: 'kids', label: 'Kids', color: '#f72585', essential: false },
  { id: 'education', label: 'Education', color: '#4ea8de', essential: true },
  { id: 'travel', label: 'Travel', color: '#3d5a80', essential: false },
  { id: 'bills', label: 'Bills & Fees', color: '#5f6368', essential: true },
  { id: 'debt', label: 'Debt & Loans', color: '#d00000', essential: true },
  { id: 'investments', label: 'Investments', color: '#2b9348', essential: false },
  { id: 'other_expense', label: 'Other', color: '#adb5bd', essential: false }
];

export const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', color: '#2dc653', essential: false },
  { id: 'freelance', label: 'Freelance / Side gig', color: '#38b000', essential: false },
  { id: 'investments_income', label: 'Investments & Interest', color: '#90be6d', essential: false },
  { id: 'gifts', label: 'Gifts Received', color: '#ffd166', essential: false },
  { id: 'refunds', label: 'Refunds / Reimbursements', color: '#7b2cbf', essential: false },
  { id: 'other_income', label: 'Other Income', color: '#adb5bd', essential: false }
];

/** @type {Record<CategoryId, {label:string,color:string,essential:boolean,kind:'expense'|'income'}>} */
export const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].reduce(
  (acc, c) => {
    acc[c.id] = { ...c, kind: EXPENSE_CATEGORIES.some((e) => e.id === c.id) ? 'expense' : 'income' };
    return acc;
  },
  {}
);

/** @param {string} categoryId */
export function categoryById(categoryId) {
  return CATEGORIES[categoryId] || { label: 'Unknown', color: '#adb5bd', essential: false, kind: 'expense' };
}

/** All expense category ids. */
export const EXPENSE_IDS = EXPENSE_CATEGORIES.map((c) => c.id);

/** @param {string} id */
export function isExpenseCategory(id) {
  return CATEGORIES[id]?.kind === 'expense';
}

/**
 * Color assigned to a budget/goal by index when the subject has no category
 * color of its own (uses the category palette, cycling).
 * @param {number} index
 */
export function paletteColor(index) {
  const colors = EXPENSE_CATEGORIES.map((c) => c.color);
  return colors[index % colors.length];
}