// @ts-check
/**
 * JSDoc data model — single source of truth for entity shapes.
 * Marked with `// @ts-check` so the editor surfaces type errors for free.
 * These typedefs are compile-time only; they do not exist at runtime.
 */

/**
 * Household member.
 * @typedef {Object} Member
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {string} initials
 * @property {boolean} isActive
 * @property {string} createdAt ISO datetime
 */

/**
 * A ledger entry. `splits` partition `amountCents` across members.
 * @typedef {'expense'|'income'} TxType
 * @typedef {Object} TxSplit
 * @property {string} memberId
 * @property {number} shareCents positive integer share
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {TxType} type
 * @property {number} amountCents integer minor units
 * @property {string} date 'YYYY-MM-DD'
 * @property {string} categoryId
 * @property {string} description
 * @property {string} notes
 * @property {string|null} paidByMemberId who racked up the cost
 * @property {TxSplit[]} splits partition of amountCents (sum === amountCents)
 * @property {string|null} recurringId when created from a projected bill
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Thread-style comment on a transaction.
 * @typedef {Object} CommentEntry
 * @property {string} id
 * @property {string} transactionId
 * @property {string} authorMemberId
 * @property {string} body
 * @property {string|null} parentId null for top-level
 * @property {string} createdAt
 */

/**
 * Recurring bill/schedule. Projection is read-only — recordings create
 * real transactions linked via `recurringId`.
 * @typedef {'monthly'|'yearly'} RecurFreq
 * @typedef {Object} Recurring
 * @property {string} id
 * @property {string} name
 * @property {number} amountCents
 * @property {TxType} type
 * @property {string} categoryId
 * @property {RecurFreq} frequency
 * @property {number} dayOfPeriod 1..31 (clamped to month length at projection)
 * @property {string} startDate 'YYYY-MM-DD'
 * @property {string|null} endDate nullable -> open-ended
 * @property {boolean} active
 * @property {string} notes
 * @property {string} updatedAt
 */

/**
 * Month-scoped budget for one category.
 * @typedef {Object} Budget
 * @property {string} id
 * @property {string} categoryId
 * @property {string} monthKey 'YYYY-MM'
 * @property {number} limitCents
 * @property {boolean} essential
 * @property {number|null} carryInCents null => computed by rollover
 * @property {string} updatedAt
 */

/**
 * Savings / debt / sinking-fund goal (discriminated by `kind`).
 * @typedef {'savings'|'debt'|'sinkingFund'} GoalKind
 * @typedef {Object} GoalContribution
 * @property {string} id
 * @property {number} amountCents
 * @property {string} date 'YYYY-MM-DD'
 * @property {string} note
 * @property {string} createdAt
 * @typedef {Object} GoalBase
 * @property {string} id
 * @property {GoalKind} kind
 * @property {string} name
 * @property {string} note
 * @property {GoalContribution[]} contributions
 * @property {string} createdAt
 * @property {string} updatedAt
 * @typedef {GoalBase & {kind:'savings', targetCents:number, deadline: string|null}} SavingsGoal
 * @typedef {GoalBase & {kind:'debt', principalCents:number, interestRateBps:number, minPaymentCents:number, deadline:string|null}} DebtGoal
 * @typedef {GoalBase & {kind:'sinkingFund', targetCents:number, monthlyContributionCents:number, deadline:string|null}} SinkingFundGoal
 * @typedef {SavingsGoal|DebtGoal|SinkingFundGoal} Goal
 */

/**
 * One month's snapshot of asset/liability values.
 * @typedef {Object} NetWorthEntry
 * @property {string} class
 * @property {string|null} name
 * @property {number} valueCents
 * @typedef {Object} NetWorthSnapshot
 * @property {string} id
 * @property {string} monthKey 'YYYY-MM'
 * @property {NetWorthEntry[]} assets
 * @property {NetWorthEntry[]} liabilities
 * @property {string} note
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * App preferences + UI-ish persisted settings.
 * @typedef {Object} Settings
 * @property {string} currency
 * @property {'light'|'dark'|'system'} theme
 * @property {string} whatIsNewLastSeenVersion
 * @property {string|null} defaultMemberId
 */

/**
 * A single persisted collection set used by backup/restore and cloud sync.
 * @typedef {Object} AppData
 * @property {Settings} settings
 * @property {Member[]} members
 * @property {Transaction[]} transactions
 * @property {CommentEntry[]} comments
 * @property {Recurring[]} recurring
 * @property {Budget[]} budgets
 * @property {Goal[]} goals
 * @property {NetWorthSnapshot[]} netWorth
 */

export {};