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
import {
    CreateCategoryDto,
    UpdateCategoryDto,
    CategoryResponseDto,
} from '../dtos/category.dto';
import { CategoryService } from '../services/category.service';

@Route('api/categories')
@Tags('Category')
@Security('bearerAuth') // Đã bật bảo mật
export class CategoryController extends Controller {
    private categoryService = new CategoryService();

    @Get('/')
    public async getCategories(): Promise<CategoryResponseDto[]> {
        return this.categoryService.getAll();
    }

    @Get('{id}')
    @Response(404, 'Category not found')
    public async getCategoryById(
        @Path() id: string
    ): Promise<CategoryResponseDto> {
        const category = await this.categoryService.getById(id);
        if (!category) {
            this.setStatus(404);
            throw new Error('Không tìm thấy danh mục');
        }
        return category;
    }

    @Post('/')
    @SuccessResponse(201, 'Created')
    @Response(400, 'Bad Request')
    public async createCategory(
        @Body() requestBody: CreateCategoryDto
    ): Promise<CategoryResponseDto> {
        try {
            this.setStatus(201);
            return await this.categoryService.create(requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Put('{id}')
    @Response(400, 'Bad Request')
    @Response(404, 'Category not found')
    public async updateCategory(
        @Path() id: string,
        @Body() requestBody: UpdateCategoryDto
    ): Promise<CategoryResponseDto> {
        try {
            return await this.categoryService.update(id, requestBody);
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }

    @Delete('{id}')
    @Response(400, 'Bad Request')
    public async deleteCategory(@Path() id: string): Promise<{ success: boolean }> {
        try {
            const success = await this.categoryService.delete(id);
            return { success };
        } catch (error: any) {
            this.setStatus(400);
            throw new Error(error.message);
        }
    }
}