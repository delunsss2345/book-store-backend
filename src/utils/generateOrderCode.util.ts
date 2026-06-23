import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

export const generateOrderCode = () => `VLR${dayjs().format('YYMMDD')}${nanoid(6).toUpperCase()}`;