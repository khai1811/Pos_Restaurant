// src/controllers/user.controller.ts
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
    SuccessResponse,
    Response,
    Security,
} from 'tsoa';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@Route('api/users')
@Tags('User')
@Security('bearerAuth')
export class UserController extends Controller {
    private userService = new UserService();

    @Get('/')
    public async getUsers(): Promise<UserResponseDto[]> {
        return this.userService.getAll();
    }

    @Get('{id}')
    @Response(404, 'User not found')
    public async getUser(@Path() id: string): Promise<UserResponseDto> {
        const user = await this.userService.getById(id);
        if (!user) {
            this.setStatus(404);
            throw new Error('Không tìm thấy người dùng');
        }
        return user;
    }

    @Post('/')
    @Security('bearerAuth', ['ADMIN']) // <--- CHỈ ADMIN MỚI ĐƯỢC TẠO
    @SuccessResponse(201, 'Created')
    @Response(400, 'Bad Request')
    public async createUser(
        @Body() requestBody: CreateUserDto
    ): Promise<UserResponseDto> {
        try {
            this.setStatus(201);
            return await this.userService.create(requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Put('{id}')
    @Security('bearerAuth', ['ADMIN']) // <--- CHỈ ADMIN MỚI ĐƯỢC SỬA
    @Response(400, 'Bad Request')
    @Response(404, 'User not found')
    public async updateUser(
        @Path() id: string,
        @Body() requestBody: UpdateUserDto
    ): Promise<UserResponseDto> {
        try {
            return await this.userService.update(id, requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Put('{id}/status')
    @Security('bearerAuth', ['ADMIN']) // <--- CHỈ ADMIN MỚI ĐƯỢC ĐỔI TRẠNG THÁI
    @Response(400, 'Bad Request')
    @Response(404, 'User not found')
    public async updateUserStatus(
        @Path() id: string,
        @Body() requestBody: { isActive: boolean }
    ): Promise<UserResponseDto> {
        try {
            return await this.userService.update(id, requestBody as any);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Delete('{id}')
    @Security('bearerAuth', ['ADMIN']) // <--- CHỈ ADMIN MỚI ĐƯỢC XÓA
    @Response(400, 'Bad Request')
    public async deleteUser(@Path() id: string): Promise<{ success: boolean }> {
        try {
            const success = await this.userService.delete(id);
            return { success };
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
}