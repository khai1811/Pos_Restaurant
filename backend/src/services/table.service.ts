import { prisma } from '../config/prisma';
import { CreateTableDto, UpdateTableDto } from '../dtos/table.dto';
import { TableEntity } from '../entity/table.entity';
import { TableStatus } from '@prisma/client';

export class RestaurantTableService {
    async getAll(status?: TableStatus): Promise<TableEntity[]> {
        const whereCondition = status ? { status } : {};

        const tables = await prisma.restaurantTable.findMany({
            where: whereCondition,
            orderBy: { tableNumber: 'asc' },
        });

        return tables.map((table) => new TableEntity(table));
    }

    async getById(id: string): Promise<TableEntity | null> {
        const table = await prisma.restaurantTable.findUnique({
            where: { id },
        });

        if (!table) return null;
        return new TableEntity(table);
    }

    async create(data: CreateTableDto | any): Promise<TableEntity> {
        const existing = await prisma.restaurantTable.findUnique({
            where: { tableNumber: data.tableNumber },
        });
        if (existing) {
            throw new Error('Số bàn đã tồn tại');
        }

        const table = await prisma.restaurantTable.create({
            data: {
                tableNumber: data.tableNumber,
                capacity: data.capacity ?? 4,
                status: data.status ?? TableStatus.AVAILABLE,
                // 🔥 Nhận dữ liệu khu vực từ giao diện để lưu vào Database
                area: data.area || 'Sảnh chính',
            },
        });

        return new TableEntity(table);
    }

    async update(id: string, data: UpdateTableDto | any): Promise<TableEntity> {
        const table = await prisma.restaurantTable.findUnique({ where: { id } });
        if (!table) {
            throw new Error('Không tìm thấy bàn');
        }

        if (data.tableNumber && data.tableNumber !== table.tableNumber) {
            const existing = await prisma.restaurantTable.findUnique({
                where: { tableNumber: data.tableNumber },
            });
            if (existing) {
                throw new Error('Số bàn mới đã tồn tại');
            }
        }

        // Tạo payload để update, chắc chắn có trường area
        const updatePayload: any = { ...data };
        if (data.area !== undefined) {
            updatePayload.area = data.area;
        }

        const updated = await prisma.restaurantTable.update({
            where: { id },
            data: updatePayload,
        });

        return new TableEntity(updated);
    }

    async delete(id: string): Promise<boolean> {
        const table = await prisma.restaurantTable.findUnique({ where: { id } });
        if (!table) {
            throw new Error('Không tìm thấy bàn');
        }

        await prisma.restaurantTable.delete({ where: { id } });
        return true;
    }

    // --- LOGIC XỬ LÝ CHUYỂN / GỘP BÀN ---
    async transferTable(sourceTableId: string, targetTableId: string, actionType: 'move' | 'merge'): Promise<boolean> {
        const sourceOrder = await prisma.order.findFirst({
            where: { tableId: sourceTableId },
            orderBy: { createdAt: 'desc' },
            include: { orderItems: true },
        });

        if (!sourceOrder) {
            throw new Error('Không tìm thấy hóa đơn hoạt động ở bàn nguồn!');
        }

        if (actionType === 'move') {
            const targetTable = await prisma.restaurantTable.findUnique({ where: { id: targetTableId } });
            if (!targetTable || targetTable.status !== 'AVAILABLE') {
                throw new Error('Bàn đích không trống hoặc không tồn tại!');
            }

            await prisma.order.update({
                where: { id: sourceOrder.id },
                data: { tableId: targetTableId },
            });

            await prisma.restaurantTable.update({ where: { id: sourceTableId }, data: { status: 'AVAILABLE' } });
            await prisma.restaurantTable.update({ where: { id: targetTableId }, data: { status: 'OCCUPIED' } });

        } else if (actionType === 'merge') {
            const targetOrder = await prisma.order.findFirst({
                where: { tableId: targetTableId },
                orderBy: { createdAt: 'desc' },
            });

            if (!targetOrder) {
                throw new Error('Bàn đích chưa có khách, không thể gộp!');
            }

            await prisma.orderItem.updateMany({
                where: { orderId: sourceOrder.id },
                data: { orderId: targetOrder.id },
            });

            const targetAny = targetOrder as any;
            const sourceAny = sourceOrder as any;

            const targetTotal = Number(targetAny.total ?? targetAny.totalAmount ?? 0);
            const sourceTotal = Number(sourceAny.total ?? sourceAny.totalAmount ?? 0);
            const newTotalAmount = targetTotal + sourceTotal;

            const updateData: any = {};
            if (targetAny.total !== undefined) {
                updateData.total = newTotalAmount;
            } else if (targetAny.totalAmount !== undefined) {
                updateData.totalAmount = newTotalAmount;
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.order.update({
                    where: { id: targetOrder.id },
                    data: updateData
                });
            }

            await prisma.order.delete({
                where: { id: sourceOrder.id },
            });

            await prisma.restaurantTable.update({ where: { id: sourceTableId }, data: { status: 'AVAILABLE' } });
        }

        return true;
    }
}