export const RequestValidationMessage = {
  FIELD_REQUIRED: (fieldName: string) => `${fieldName} là bắt buộc`,
  FIELD_MUST_BE_BIGINT: (fieldName: string) => `${fieldName} phải là bigint`,
} as const;
