import {
    Controller,
    Get,
    Post,
    Put,
    Patch, // BẮT BUỘC CẦN IMPORT PATCH Ở ĐÂY
    Route,
    Tags,
    Body,
    Path,
    Query,
    SuccessResponse,
    Response,
    Security,
    Request,
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import {
    CreateOrderDto,
    UpdateOrderStatusDto,
    OrderResponseDto,
} from '../dtos/order.dto';
import { OrderStatus } from '@prisma/client';
import { OrderService } from '../services/order.service';

@Route('api/orders')
@Tags('Order')
@Security('bearerAuth') // Đã bật bảo mật
export class OrderController extends Controller {
    private orderService = new OrderService();

    @Get('/')
    public async getOrders(
        @Query() status?: OrderStatus
    ): Promise<OrderResponseDto[]> {
        try {
            return await this.orderService.getAll(status);
        } catch (error: any) {
            console.error('❌ Lỗi GET /api/orders:', error.message);
            this.setStatus(500);
            throw new Error(`Lỗi Server khi lấy danh sách đơn: ${error.message}`);
        }
    }

    @Get('{id}')
    @Response(404, 'Order not found')
    public async getOrderById(@Path() id: string): Promise<OrderResponseDto> {
        const order = await this.orderService.getById(id);
        if (!order) {
            this.setStatus(404);
            throw new Error('Không tìm thấy đơn hàng');
        }
        return order;
    }

    @Post('/')
    @SuccessResponse(201, 'Created')
    @Response(400, 'Bad Request')
    public async createOrder(
        @Request() request: ExpressRequest,
        @Body() requestBody: CreateOrderDto
    ): Promise<OrderResponseDto> {
        try {
            const user = (request as any).user;
            const userId = user?.id || user?.userId;

            if (!userId) {
                this.setStatus(401);
                throw new Error('Không tìm thấy thông tự xác thực người dùng');
            }

            this.setStatus(201);
            return await this.orderService.create({
                ...requestBody,
                userId: userId,
            } as any);
        } catch (error: any) {
            console.error('❌ Lỗi POST /api/orders:', error.message);
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Put('{id}/status')
    @Response(400, 'Bad Request')
    @Response(404, 'Order not found')
    public async updateOrderStatus(
        @Path() id: string,
        @Body() requestBody: UpdateOrderStatusDto
    ): Promise<OrderResponseDto> {
        try {
            return await this.orderService.updateStatus(id, requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    // =========================================================
    // API: CẬP NHẬT TRẠNG THÁI RIÊNG LẺ TỪNG MÓN CHO BẾP
    // =========================================================
    @Patch('items/{itemId}/status')
    @SuccessResponse(200, 'OK')
    @Response(400, 'Bad Request')
    public async updateOrderItemStatus(
        @Path() itemId: string,
        @Body() requestBody: { status: string }
    ): Promise<any> {
        try {
            return await this.orderService.updateOrderItemStatus(itemId, requestBody.status);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
}