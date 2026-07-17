import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getRequestFromExecutionContext } from '../utils/request-context';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = getRequestFromExecutionContext(context);
  return request.user;
});
