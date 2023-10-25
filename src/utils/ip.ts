import { getClientIp } from '@supercharge/request-ip';
import { type FastifyRequest } from 'fastify';

export function getIpFromRequest(req: FastifyRequest) {
  return getClientIp(req);
}
