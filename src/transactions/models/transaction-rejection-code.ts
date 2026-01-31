export enum TransactionRejectionCode {
  CardNotFound = 'CARD_NOT_FOUND',
  OrganizationNotFound = 'ORGANIZATION_NOT_FOUND',
  InsufficientBalance = 'INSUFFICIENT_BALANCE',
  DailyLimitExceeded = 'DAILY_LIMIT_EXCEEDED',
  MonthlyLimitExceeded = 'MONTHLY_LIMIT_EXCEEDED',
  InvalidAmount = 'INVALID_AMOUNT',
}
