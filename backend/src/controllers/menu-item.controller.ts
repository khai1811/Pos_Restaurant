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
import {
    CreateMenuItemDto,
    UpdateMenuItemDto,
    MenuItemResponseDto,
} from '../dtos/menu-item.dto';
import { MenuItemService } from '../services/menu-item.service';

@Route('api/menu-items')
@Tags('MenuItem')
@Security('bearerAuth')
export class MenuItemController extends Controller {
    private menuItemService = new MenuItemService();

    @Get('/')
    public async getMenuItems(
        @Query() categoryId?: string
    ): Promise<MenuItemResponseDto[]> {
        return this.menuItemService.getAll(categoryId);
    }

    @Get('{id}')
    @Response(404, 'MenuItem not found')
    public async getMenuItemById(
        @Path() id: string
    ): Promise<MenuItemResponseDto> {
        const item = await this.menuItemService.getById(id);
        if (!item) {
            this.setStatus(404);
            throw new Error('Không tìm thấy món ăn');
        }
        return item;
    }

    @Post('/')
    @SuccessResponse(201, 'Created')
    @Response(400, 'Bad Request')
    public async createMenuItem(
        @Body() requestBody: CreateMenuItemDto
    ): Promise<MenuItemResponseDto> {
        try {
            this.setStatus(201);
            return await this.menuItemService.create(requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Put('{id}')
    @Response(400, 'Bad Request')
    @Response(404, 'MenuItem not found')
    public async updateMenuItem(
        @Path() id: string,
        @Body() requestBody: UpdateMenuItemDto
    ): Promise<MenuItemResponseDto> {
        try {
            console.log("=== DỮ LIỆU TỪ WEB GỬI LÊN ===", requestBody);
            return await this.menuItemService.update(id, requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Delete('{id}')
    @Response(400, 'Bad Request')
    public async deleteMenuItem(@Path() id: string): Promise<{ success: boolean }> {
        try {
            const success = await this.menuItemService.delete(id);
            return { success };
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
}