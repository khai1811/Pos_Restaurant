import {
    Controller,
    Get,
    Post,
    Route,
    Tags,
    Body,
    Path,
    SuccessResponse,
    Response,
    Security,
} from 'tsoa';
import { CreatePaymentDto, PaymentResponseDto } from '../dtos/payment.dto';
import { PaymentService } from '../services/payment.service';

@Route('api/payments')
@Tags('Payment')
@Security('bearerAuth')
export class PaymentController extends Controller {
    private paymentService = new PaymentService();

    @Get('/')
    public async getAllPayments(): Promise<PaymentResponseDto[]> {
        return this.paymentService.getAll();
    }

    @Get('{id}')
    @Response(404, 'Payment not found')
    public async getPaymentById(@Path() id: string): Promise<PaymentResponseDto> {
        const payment = await this.paymentService.getById(id);
        if (!payment) {
            this.setStatus(404);
            throw new Error('Không tìm thấy thông tin thanh toán');
        }
        return payment;
    }

    @Post('/')
    @SuccessResponse(201, 'Created')
    @Response(400, 'Bad Request')
    public async createPayment(
        @Body() requestBody: CreatePaymentDto & { cashAmount?: number; transferAmount?: number }
    ): Promise<PaymentResponseDto> {
        try {
            this.setStatus(201);
            return await this.paymentService.create(requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
}
//PAYMENT