"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantTableService = void 0;
const prisma_1 = require("../config/prisma");
const table_entity_1 = require("../entity/table.entity");
const client_1 = require("@prisma/client");
class RestaurantTableService {
    async getAll(status) {
        const whereCondition = status ? { status } : {};
        const tables = await prisma_1.prisma.restaurantTable.findMany({
            where: whereCondition,
            orderBy: { tableNumber: 'asc' },
        });
        return tables.map((table) => new table_entity_1.TableEntity(table));
    }
    async getById(id) {
        const table = await prisma_1.prisma.restaurantTable.findUnique({
            where: { id },
        });
        if (!table)
            return null;
        return new table_entity_1.TableEntity(table);
    }
    async create(data) {
        // 🔥 Ép kiểu tableNumber sang số nguyên để fix triệt để lỗi Prisma
        const tableNum = Number(data.tableNumber);
        if (isNaN(tableNum)) {
            throw new Error('Số bàn không hợp lệ, phải là số nguyên!');
        }
        const existing = await prisma_1.prisma.restaurantTable.findUnique({
            where: { tableNumber: tableNum },
        });
        if (existing) {
            throw new Error('Số bàn đã tồn tại');
        }
        const table = await prisma_1.prisma.restaurantTable.create({
            data: {
                tableNumber: tableNum,
                capacity: data.capacity ? Number(data.capacity) : 4,
                status: data.status ?? client_1.TableStatus.AVAILABLE,
                area: data.area || 'Sảnh chính',
            },
        });
        return new table_entity_1.TableEntity(table);
    }
    async update(id, data) {
        const table = await prisma_1.prisma.restaurantTable.findUnique({ where: { id } });
        if (!table) {
            throw new Error('Không tìm thấy bàn');
        }
        const updatePayload = { ...data };
        // 🔥 Xử lý ép kiểu an toàn khi user muốn Cập nhật lại số bàn
        if (data.tableNumber !== undefined) {
            const tableNum = Number(data.tableNumber);
            if (isNaN(tableNum)) {
                throw new Error('Số bàn mới không hợp lệ, phải là số nguyên!');
            }
            if (tableNum !== table.tableNumber) {
                const existing = await prisma_1.prisma.restaurantTable.findUnique({
                    where: { tableNumber: tableNum },
                });
                if (existing) {
                    throw new Error('Số bàn mới đã tồn tại');
                }
            }
            updatePayload.tableNumber = tableNum;
        }
        if (data.capacity !== undefined)
            updatePayload.capacity = Number(data.capacity);
        if (data.area !== undefined)
            updatePayload.area = data.area;
        const updated = await prisma_1.prisma.restaurantTable.update({
            where: { id },
            data: updatePayload,
        });
        return new table_entity_1.TableEntity(updated);
    }
    async delete(id) {
        const table = await prisma_1.prisma.restaurantTable.findUnique({ where: { id } });
        if (!table) {
            throw new Error('Không tìm thấy bàn');
        }
        await prisma_1.prisma.restaurantTable.delete({ where: { id } });
        return true;
    }
    // --- LOGIC XỬ LÝ CHUYỂN / GỘP BÀN ---
    async transferTable(sourceTableId, targetTableId, actionType) {
        const sourceOrder = await prisma_1.prisma.order.findFirst({
            where: { tableId: sourceTableId },
            orderBy: { createdAt: 'desc' },
            include: { orderItems: true },
        });
        if (!sourceOrder) {
            throw new Error('Không tìm thấy hóa đơn hoạt động ở bàn nguồn!');
        }
        if (actionType === 'move') {
            const targetTable = await prisma_1.prisma.restaurantTable.findUnique({ where: { id: targetTableId } });
            if (!targetTable || targetTable.status !== 'AVAILABLE') {
                throw new Error('Bàn đích không trống hoặc không tồn tại!');
            }
            await prisma_1.prisma.order.update({
                where: { id: sourceOrder.id },
                data: { tableId: targetTableId },
            });
            await prisma_1.prisma.restaurantTable.update({ where: { id: sourceTableId }, data: { status: 'AVAILABLE' } });
            await prisma_1.prisma.restaurantTable.update({ where: { id: targetTableId }, data: { status: 'OCCUPIED' } });
        }
        else if (actionType === 'merge') {
            const targetOrder = await prisma_1.prisma.order.findFirst({
                where: { tableId: targetTableId },
                orderBy: { createdAt: 'desc' },
            });
            if (!targetOrder) {
                throw new Error('Bàn đích chưa có khách, không thể gộp!');
            }
            await prisma_1.prisma.orderItem.updateMany({
                where: { orderId: sourceOrder.id },
                data: { orderId: targetOrder.id },
            });
            const targetAny = targetOrder;
            const sourceAny = sourceOrder;
            const targetTotal = Number(targetAny.total ?? targetAny.totalAmount ?? 0);
            const sourceTotal = Number(sourceAny.total ?? sourceAny.totalAmount ?? 0);
            const newTotalAmount = targetTotal + sourceTotal;
            const updateData = {};
            if (targetAny.total !== undefined) {
                updateData.total = newTotalAmount;
            }
            else if (targetAny.totalAmount !== undefined) {
                updateData.totalAmount = newTotalAmount;
            }
            if (Object.keys(updateData).length > 0) {
                await prisma_1.prisma.order.update({
                    where: { id: targetOrder.id },
                    data: updateData
                });
            }
            await prisma_1.prisma.order.delete({
                where: { id: sourceOrder.id },
            });
            await prisma_1.prisma.restaurantTable.update({ where: { id: sourceTableId }, data: { status: 'AVAILABLE' } });
        }
        return true;
    }
    // --- LOGIC XỬ LÝ ĐẶT BÀN TRƯỚC ---
    async reserveTable(id, data) {
        const table = await prisma_1.prisma.restaurantTable.findUnique({ where: { id } });
        if (!table) {
            throw new Error('Không tìm thấy bàn');
        }
        if (table.status !== 'AVAILABLE') {
            throw new Error('Bàn hiện không trống để đặt trước!');
        }
        const updated = await prisma_1.prisma.restaurantTable.update({
            where: { id },
            data: {
                status: 'RESERVED',
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                reservationTime: data.reservationTime,
            },
        });
        return new table_entity_1.TableEntity(updated);
    }
}
exports.RestaurantTableService = RestaurantTableService;
