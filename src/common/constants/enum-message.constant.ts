import {
  ChangePasswordMessage,
  ForgotPasswordMessage,
  LoginMessage,
  RegisterMessage,
} from './auth-message.constant';

export {
  ChangePasswordMessage,
  ForgotPasswordMessage,
  LoginMessage,
  RegisterMessage,
};

export const StatusMessage = {
  LoginMessage,
  RegisterMessage,
  ChangePasswordMessage,
  ForgotPasswordMessage,
} as const;
