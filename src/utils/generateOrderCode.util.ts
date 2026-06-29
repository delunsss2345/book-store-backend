import dayjs from 'dayjs';
import { customAlphabet } from 'nanoid';

const nanoidAlphanumeric = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
export const generateOrderCode = () => `VLR${dayjs().format('YYMMDD')}${nanoidAlphanumeric()}`