import { prisma } from '../config/prisma';
import {
    CreateOrderDto,
    UpdateOrderStatusDto
} from '../dtos/order.dto';
import {
    OrderEntity,
    OrderItemEntity
} from '../entity/order.entity';
import {
    OrderStatus,
    TableStatus
} from '@prisma/client';

interface CreateOrderItemInput {
    menuItemId: string;
    quantity: number;
    price: number;
    subtotal: number;
}

export class OrderService {

    // =========================================================
    // MAP PRISMA -> ENTITY
    // =========================================================
    private mapToEntity(order: any): OrderEntity {
        const staff = order?.staff;

        const items =
            Array.isArray(order?.orderItems)
                ? order.orderItems
                : Array.isArray(order?.items)
                    ? order.items
                    : [];

        return new OrderEntity({
            ...order,
            totalAmount: Number(order?.totalAmount || 0),
            tableNumber: order?.table?.tableNumber,
            userName: staff?.fullName || staff?.username || '',
            items: items.map(
                (item: any) =>
                    new OrderItemEntity({
                        ...item,
                        unitPrice: Number(item?.price ?? item?.unitPrice ?? 0),
                        menuItemName: item?.menuItem?.name,
                    })
            ),
        });
    }

    // =========================================================
    // GET ALL (SIÊU TỐC: DÙNG SELECT LOẠI BỎ ẢNH NẶNG, GIỚI HẠN 100 ĐƠN)
    // =========================================================
    async getAll(status?: OrderStatus): Promise<OrderEntity[]> {
        const whereCondition = status ? { status } : {};

        const orders = await prisma.order.findMany({
            where: whereCondition,
            take: 100,
            select: {
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                tableId: true,
                staffId: true,
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
    async getById(id: string): Promise<OrderEntity | null> {
        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                tableId: true,
                staffId: true,
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

        if (!order) return null;
        return this.mapToEntity(order);
    }

    // =========================================================
    // CREATE / ADD ITEMS TO ORDER
    // =========================================================
    async create(data: CreateOrderDto & { userId?: string; }): Promise<OrderEntity> {
        if (!data.userId) throw new Error('Không xác định được nhân viên đăng nhập');

        let table = null;
        const hasTableId = data.tableId && String(data.tableId).trim() !== '' && data.tableId !== 'undefined';

        if (hasTableId) {
            table = await prisma.restaurantTable.findUnique({
                where: { id: String(data.tableId) },
            });
            if (!table) throw new Error(`Không tìm thấy bàn với ID ${data.tableId}`);
        }

        if (!Array.isArray(data.items) || data.items.length === 0) {
            throw new Error('Đơn hàng phải có ít nhất một món');
        }

        let additionalAmount = 0;
        const orderItemsData: CreateOrderItemInput[] = [];

        for (let index = 0; index < data.items.length; index++) {
            const item = data.items[index];
            if (!item?.menuItemId) throw new Error(`Món thứ ${index + 1} thiếu menuItemId`);

            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Số lượng món không hợp lệ`);

            const menuItem = await prisma.menuItem.findUnique({
                where: { id: String(item.menuItemId) },
            });

            if (!menuItem) throw new Error(`Không tìm thấy món ăn với ID ${item.menuItemId}`);
            if (!menuItem.isAvailable) throw new Error(`Món ${menuItem.name} hiện đã hết`);

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

        const savedOrder = await prisma.$transaction(async (tx: any) => {
            let existingOrder = null;

            if (table) {
                existingOrder = await tx.order.findFirst({
                    where: {
                        tableId: String(data.tableId),
                        status: OrderStatus.PENDING,
                    },
                    include: { orderItems: true },
                });
            }

            let targetOrder;

            if (existingOrder) {
                for (const newItem of orderItemsData) {
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

                const newTotalAmount = Number(existingOrder.totalAmount) + additionalAmount;

                targetOrder = await tx.order.update({
                    where: { id: existingOrder.id },
                    data: { totalAmount: newTotalAmount },
                    select: {
                        id: true,
                        totalAmount: true,
                        status: true,
                        createdAt: true,
                        tableId: true,
                        staffId: true,
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

            } else {
                const createData: any = {
                    tableId: table ? String(data.tableId) : null,
                    totalAmount: additionalAmount,
                    status: OrderStatus.PENDING,
                    staffId: String(data.userId),
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
                        data: { status: TableStatus.OCCUPIED },
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
    async updateStatus(id: string, data: UpdateOrderStatusDto): Promise<OrderEntity> {
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        const updated = await prisma.order.update({
            where: { id },
            data: { status: data.status },
            select: {
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                tableId: true,
                staffId: true,
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

        if (data.status === OrderStatus.CANCELLED && updated.tableId) {
            await prisma.restaurantTable.update({
                where: { id: updated.tableId },
                data: { status: TableStatus.AVAILABLE },
            });
        }

        if (data.status === 'SERVED') {
            await prisma.orderItem.updateMany({
                where: { orderId: id },
                data: { status: 'SERVED' }
            });

            if (updated.tableId) {
                await prisma.restaurantTable.update({
                    where: { id: updated.tableId },
                    data: { status: TableStatus.BILL_REQUESTED },
                });
            }
        }

        return this.mapToEntity(updated);
    }

    // =========================================================
    // CẬP NHẬT TRẠNG THÁI CHO TỪNG MÓN CỦA BẾP
    // =========================================================
    async updateOrderItemStatus(itemId: string, status: string) {
        const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
        if (!item) {
            throw new Error('Không tìm thấy món ăn này trong đơn hàng');
        }

        const updatedItem = await prisma.orderItem.update({
            where: { id: itemId },
            data: { status: status.toUpperCase() }
        });

        return updatedItem;
    }
}