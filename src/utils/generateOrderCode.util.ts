import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

export const generateOrderCode = () => `OD-${dayjs().format('YYMMDD')}-${nanoid(6).toUpperCase()}`;