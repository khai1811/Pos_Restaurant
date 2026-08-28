import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Route,
    Tags,
    Body,
    Path,
    Query,
    SuccessResponse,
    Response,
    Security,
} from 'tsoa';
import { TableStatus } from '@prisma/client';
import { RestaurantTableService } from '../services/table.service';

@Route('api/tables')
@Tags('Restaurant Table')
@Security('bearerAuth') // Đã bật bảo mật
export class RestaurantTableController extends Controller {
    private tableService = new RestaurantTableService();

    @Get('/')
    public async getTables(
        @Query() status?: TableStatus
    ): Promise<any[]> {
        return this.tableService.getAll(status);
    }

    @Get('{id}')
    @Response(404, 'Table not found')
    public async getTableById(@Path() id: string): Promise<any> {
        const table = await this.tableService.getById(id);
        if (!table) {
            this.setStatus(404);
            throw new Error('Không tìm thấy bàn');
        }
        return table;
    }

    @Post('/')
    @SuccessResponse(201, 'Created')
    @Response(400, 'Bad Request')
    public async createTable(
        @Body() requestBody: any // 🔥 Ép nhận mọi dữ liệu, bỏ qua bộ lọc TSOA
    ): Promise<any> {
        try {
            this.setStatus(201);
            return await this.tableService.create(requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    // === API CHUYỂN / GỘP BÀN ===
    @Post('transfer')
    @Response(400, 'Bad Request')
    public async transferTable(
        @Body() requestBody: any // 🔥 Ép nhận mọi dữ liệu
    ): Promise<{ success: boolean }> {
        try {
            const success = await this.tableService.transferTable(
                requestBody.sourceTableId,
                requestBody.targetTableId,
                requestBody.actionType
            );
            return { success };
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
    // ====================================

    @Put('{id}')
    @Response(400, 'Bad Request')
    @Response(404, 'Table not found')
    public async updateTable(
        @Path() id: string,
        @Body() requestBody: any // 🔥 Ép nhận mọi dữ liệu, bỏ qua bộ lọc TSOA
    ): Promise<any> {
        try {
            return await this.tableService.update(id, requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Delete('{id}')
    @Response(400, 'Bad Request')
    public async deleteTable(@Path() id: string): Promise<{ success: boolean }> {
        try {
            const success = await this.tableService.delete(id);
            return { success };
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
}