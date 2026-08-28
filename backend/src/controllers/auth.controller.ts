import {
    Controller,
    Post,
    Get,
    Route,
    Tags,
    Body,
    SuccessResponse,
    Response,
    Security,
    Request,
} from 'tsoa'; //[cite: 36]
import { LoginDto, RegisterDto, AuthResponseDto, PinLoginDto } from '../dtos/auth.dto'; //[cite: 36]
import { Request as ExpressRequest } from 'express'; //[cite: 36]
import { AuthService } from '../services/auth.service'; //[cite: 36]

@Route('api/auth')
@Tags('Auth')
export class AuthController extends Controller {
    private authService = new AuthService();

    @Post('/register')
    @SuccessResponse(201, 'Registered Successfully')
    @Response(400, 'Bad Request')
    public async register(
        @Body() requestBody: RegisterDto
    ): Promise<AuthResponseDto> {
        try {
            this.setStatus(201);
            return await this.authService.register(requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Post('/login')
    @Response(400, 'Bad Request')
    public async login(@Body() requestBody: LoginDto): Promise<AuthResponseDto> {
        try {
            return await this.authService.login(requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Post('/pin-login')
    @Response(400, 'Bad Request')
    public async pinLogin(@Body() requestBody: PinLoginDto): Promise<AuthResponseDto> {
        try {
            return await this.authService.pinLogin(requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Get('/me')
    @Security('bearerAuth')
    @Response(401, 'Unauthorized')
    public async getProfile(@Request() request: ExpressRequest): Promise<any> {
        return (request as any).user;
    }
}