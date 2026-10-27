import type { AdminStatsGateway } from '../ports/AdminGateway'
import type { AdminStats } from '@/domain/admin/AdminStats'

export class GetAdminStats {
   constructor(private readonly stats: AdminStatsGateway) {}

   execute(token: string, days = 30): Promise<AdminStats> {
      return this.stats.getStats(token, days)
   }
}
