import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../src/routers';

export const trpc = createTRPCReact<AppRouter>();
