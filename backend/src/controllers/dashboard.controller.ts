import { Controller, Get, Route, Tags, Response, Security } from 'tsoa';
import { DashboardOverviewDto } from '../dtos/dashboard.dto';
import { DashboardService } from '../services/dashboard.service';

@Route('api/dashboard')
@Tags('Dashboard')
@Security('bearerAuth') // Đã bật bảo mật
export class DashboardController extends Controller {
    private dashboardService = new DashboardService();

    @Get('/overview')
    @Response(500, 'Internal Server Error')
    public async getOverview(): Promise<DashboardOverviewDto> {
        try {
            return await this.dashboardService.getOverview();
        } catch (error: any) {
            this.setStatus(500);
            throw new Error(error.message);
        }
    }
}