"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const prisma_1 = require("../config/prisma");
const order_entity_1 = require("../entity/order.entity");
const client_1 = require("@prisma/client");
class OrderService {
    // =========================================================
    // MAP PRISMA -> ENTITY
    // =========================================================
    mapToEntity(order) {
        const staff = order?.staff;
        const items = Array.isArray(order?.orderItems)
            ? order.orderItems
            : Array.isArray(order?.items)
                ? order.items
                : [];
        return new order_entity_1.OrderEntity({
            ...order,
            totalAmount: Number(order?.totalAmount || 0),
            tableNumber: order?.table?.tableNumber,
            userName: staff?.fullName || staff?.username || '',
            guestCount: order?.guestCount || 1, // Lấy số lượng khách
            items: items.map((item) => new order_entity_1.OrderItemEntity({
                ...item,
                unitPrice: Number(item?.price ?? item?.unitPrice ?? 0),
                menuItemName: item?.menuItem?.name,
            })),
        });
    }
    // =========================================================
    // GET ALL (SIÊU TỐC: DÙNG SELECT LOẠI BỎ ẢNH NẶNG, GIỚI HẠN 100 ĐƠN)
    // =========================================================
    async getAll(status) {
        const whereCondition = status ? { status } : {};
        const orders = await prisma_1.prisma.order.findMany({
            where: whereCondition,
            take: 100,
            select: {
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                tableId: true,
                staffId: true,
                guestCount: true,
                table: { select: { id: true, tableNumber: true, area: true } },
                staff: { select: { id: true, fullName: true, username: true } },
                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        subtotal: true,
                        status: true,
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return orders.map((order) => this.mapToEntity(order));
    }
    // =========================================================
    // GET BY ID
    // =========================================================
    async getById(id) {
        const order = await prisma_1.prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                tableId: true,
                staffId: true,
                guestCount: true,
                table: { select: { id: true, tableNumber: true, area: true } },
                staff: { select: { id: true, fullName: true, username: true } },
                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        subtotal: true,
                        status: true,
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true
                            }
                        }
                    }
                }
            },
        });
        if (!order)
            return null;
        return this.mapToEntity(order);
    }
    // =========================================================
    // CREATE / ADD ITEMS TO ORDER
    // =========================================================
    async create(data) {
        if (!data.userId)
            throw new Error('Không xác định được nhân viên đăng nhập');
        let table = null;
        const hasTableId = data.tableId && String(data.tableId).trim() !== '' && data.tableId !== 'undefined';
        if (hasTableId) {
            table = await prisma_1.prisma.restaurantTable.findUnique({
                where: { id: String(data.tableId) },
            });
            if (!table)
                throw new Error(`Không tìm thấy bàn với ID ${data.tableId}`);
        }
        if (!Array.isArray(data.items) || data.items.length === 0) {
            throw new Error('Đơn hàng phải có ít nhất một món');
        }
        let additionalAmount = 0;
        const orderItemsData = [];
        for (let index = 0; index < data.items.length; index++) {
            const item = data.items[index];
            if (!item?.menuItemId)
                throw new Error(`Món thứ ${index + 1} thiếu menuItemId`);
            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity <= 0)
                throw new Error(`Số lượng món không hợp lệ`);
            const menuItem = await prisma_1.prisma.menuItem.findUnique({
                where: { id: String(item.menuItemId) },
            });
            if (!menuItem)
                throw new Error(`Không tìm thấy món ăn với ID ${item.menuItemId}`);
            if (!menuItem.isAvailable)
                throw new Error(`Món ${menuItem.name} hiện đã hết`);
            const unitPrice = Number(menuItem.price);
            const subtotal = unitPrice * quantity;
            additionalAmount += subtotal;
            orderItemsData.push({
                menuItemId: String(item.menuItemId),
                quantity,
                price: unitPrice,
                subtotal,
            });
        }
        const savedOrder = await prisma_1.prisma.$transaction(async (tx) => {
            let existingOrder = null;
            if (table) {
                existingOrder = await tx.order.findFirst({
                    where: {
                        tableId: String(data.tableId),
                        status: {
                            // Tìm hóa đơn ở mọi trạng thái đang hoạt động
                            in: [client_1.OrderStatus.PENDING, client_1.OrderStatus.PREPARING, client_1.OrderStatus.SERVED]
                        }
                    },
                    include: { orderItems: true },
                });
            }
            let targetOrder;
            if (existingOrder) {
                for (const newItem of orderItemsData) {
                    // Kiểm tra xem món này đã có trong Bill và đang "Chờ bếp" (PENDING) chưa?
                    const existingItem = await tx.orderItem.findFirst({
                        where: {
                            orderId: existingOrder.id,
                            menuItemId: newItem.menuItemId,
                            status: 'PENDING'
                        }
                    });
                    if (existingItem) {
                        // CỘNG DỒN số lượng và thành tiền
                        await tx.orderItem.update({
                            where: { id: existingItem.id },
                            data: {
                                quantity: existingItem.quantity + newItem.quantity,
                                subtotal: Number(existingItem.subtotal) + newItem.subtotal
                            }
                        });
                    }
                    else {
                        // TẠO DÒNG MỚI
                        await tx.orderItem.create({
                            data: {
                                orderId: existingOrder.id,
                                menuItemId: newItem.menuItemId,
                                quantity: newItem.quantity,
                                price: newItem.price,
                                subtotal: newItem.subtotal,
                            },
                        });
                    }
                }
                const newTotalAmount = Number(existingOrder.totalAmount) + additionalAmount;
                const updatePayload = {
                    totalAmount: newTotalAmount,
                    status: client_1.OrderStatus.PENDING // Đánh thức hóa đơn để Bếp nhìn thấy
                };
                // Cập nhật số lượng khách nếu có truyền lên
                if (data.guestCount) {
                    updatePayload.guestCount = data.guestCount;
                }
                targetOrder = await tx.order.update({
                    where: { id: existingOrder.id },
                    data: updatePayload,
                    select: {
                        id: true,
                        totalAmount: true,
                        status: true,
                        createdAt: true,
                        tableId: true,
                        staffId: true,
                        guestCount: true,
                        table: { select: { id: true, tableNumber: true, area: true } },
                        staff: { select: { id: true, fullName: true, username: true } },
                        orderItems: {
                            select: {
                                id: true,
                                quantity: true,
                                price: true,
                                subtotal: true,
                                status: true,
                                menuItem: { select: { id: true, name: true, price: true } }
                            }
                        }
                    },
                });
                // Kéo bàn về trạng thái có khách nếu đang ở trạng thái chờ tính tiền
                if (table) {
                    await tx.restaurantTable.update({
                        where: { id: String(data.tableId) },
                        data: { status: client_1.TableStatus.OCCUPIED },
                    });
                }
            }
            else {
                // TẠO ĐƠN HÀNG MỚI HOÀN TOÀN
                const createData = {
                    tableId: table ? String(data.tableId) : null,
                    totalAmount: additionalAmount,
                    status: client_1.OrderStatus.PENDING,
                    staffId: String(data.userId),
                    guestCount: data.guestCount || 1,
                    orderItems: { create: orderItemsData },
                };
                targetOrder = await tx.order.create({
                    data: createData,
                    select: {
                        id: true,
                        totalAmount: true,
                        status: true,
                        createdAt: true,
                        tableId: true,
                        staffId: true,
                        guestCount: true,
                        table: { select: { id: true, tableNumber: true, area: true } },
                        staff: { select: { id: true, fullName: true, username: true } },
                        orderItems: {
                            select: {
                                id: true,
                                quantity: true,
                                price: true,
                                subtotal: true,
                                status: true,
                                menuItem: { select: { id: true, name: true, price: true } }
                            }
                        }
                    },
                });
                if (table) {
                    await tx.restaurantTable.update({
                        where: { id: String(data.tableId) },
                        data: { status: client_1.TableStatus.OCCUPIED },
                    });
                }
            }
            return targetOrder;
        });
        return this.mapToEntity(savedOrder);
    }
    // =========================================================
    // UPDATE STATUS
    // =========================================================
    async updateStatus(id, data) {
        const order = await prisma_1.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new Error('Không tìm thấy đơn hàng');
        const updated = await prisma_1.prisma.order.update({
            where: { id },
            data: { status: data.status },
            select: {
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                tableId: true,
                staffId: true,
                guestCount: true,
                table: { select: { id: true, tableNumber: true, area: true } },
                staff: { select: { id: true, fullName: true, username: true } },
                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        subtotal: true,
                        status: true,
                        menuItem: { select: { id: true, name: true, price: true } }
                    }
                }
            },
        });
        if (data.status === client_1.OrderStatus.CANCELLED && updated.tableId) {
            await prisma_1.prisma.restaurantTable.update({
                where: { id: updated.tableId },
                data: { status: client_1.TableStatus.AVAILABLE },
            });
        }
        if (data.status === 'SERVED') {
            await prisma_1.prisma.orderItem.updateMany({
                where: { orderId: id },
                data: { status: 'SERVED' }
            });
            if (updated.tableId) {
                await prisma_1.prisma.restaurantTable.update({
                    where: { id: updated.tableId },
                    data: { status: client_1.TableStatus.BILL_REQUESTED },
                });
            }
        }
        return this.mapToEntity(updated);
    }
    // =========================================================
    // CẬP NHẬT TRẠNG THÁI CHO TỪNG MÓN CỦA BẾP
    // =========================================================
    async updateOrderItemStatus(itemId, status) {
        const item = await prisma_1.prisma.orderItem.findUnique({ where: { id: itemId } });
        if (!item) {
            throw new Error('Không tìm thấy món ăn này trong đơn hàng');
        }
        const updatedItem = await prisma_1.prisma.orderItem.update({
            where: { id: itemId },
            data: { status: status.toUpperCase() }
        });
        return updatedItem;
    }
    // =========================================================
    // CẬP NHẬT TRỰC TIẾP SỐ LƯỢNG KHÁCH (GUEST COUNT)
    // =========================================================
    async updateGuestCount(id, guestCount) {
        const order = await prisma_1.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new Error('Không tìm thấy đơn hàng');
        const updated = await prisma_1.prisma.order.update({
            where: { id },
            data: { guestCount: guestCount },
            select: {
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                tableId: true,
                staffId: true,
                guestCount: true,
                table: { select: { id: true, tableNumber: true, area: true } },
                staff: { select: { id: true, fullName: true, username: true } },
                orderItems: {
                    select: {
                        id: true, quantity: true, price: true, subtotal: true, status: true,
                        menuItem: { select: { id: true, name: true, price: true } }
                    }
                }
            },
        });
        return this.mapToEntity(updated);
    }
}
exports.OrderService = OrderService;
