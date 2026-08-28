import { Controller, Get, Query, Route, Tags, Response, Security } from 'tsoa';
import { RevenueReportResponseDto } from '../dtos/report.dto';
import { ReportService } from '../services/report.service';

@Route('api/reports')
@Tags('Report')
@Security('bearerAuth') // Đã bật bảo mật
export class ReportController extends Controller {
    private reportService = new ReportService();

    @Get('/revenue')
    @Response(500, 'Internal Server Error')
    public async getRevenueReport(
        @Query() startDate?: string,
        @Query() endDate?: string
    ): Promise<RevenueReportResponseDto> {
        try {
            return await this.reportService.getRevenueReport(startDate, endDate);
        } catch (error: any) {
            this.setStatus(500);
            throw new Error(error.message);
        }
    }
}