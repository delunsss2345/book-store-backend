export enum UniqueIndex {
    USERS_EMAIL_KEY = 'users_email_key',
    USERS_PHONE_NUMBER_KEY = 'users_phone_number_key',
}
export const UNIQUE_INDEX_MESSAGE: Record<string, { message: string }> = {
    [UniqueIndex.USERS_EMAIL_KEY]: { message: 'Email already exists' },
    [UniqueIndex.USERS_PHONE_NUMBER_KEY]: { message: 'Phone number already exists' },
};