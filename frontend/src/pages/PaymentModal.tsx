import React, { useState } from 'react';
import {
    X,
    CreditCard,
    Banknote,
    QrCode,
    Wallet,
    CheckCircle2,
    Split,
    Copy,
    Check,
    AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Order, PaymentMethod } from '../types/index';
import { formatVND, sound } from '../utils/formatters';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
    onCompletePayment: (
        paymentMethod: PaymentMethod,
        amountPaid: number,
        changeAmount: number,
        splitDetails?: { cashAmount?: number; vietqrAmount?: number; cardAmount?: number }
    ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    order,
    onClose,
    onCompletePayment,
}) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('vietqr');
    const [cashGiven, setCashGiven] = useState<number>(order.total);
    const [splitCash, setSplitCash] = useState<number>(Math.round(order.total / 2));
    const [splitQr, setSplitQr] = useState<number>(order.total - Math.round(order.total / 2));
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    // Thông tin tài khoản VietQR
    const bankInfo = {
        bankName: 'MBBank (Quân Đội)',
        accountNumber: '988899998888',
        accountName: 'AN GOURMET RESTAURANT',
    };

    const qrAmount = selectedMethod === 'split' ? splitQr : order.total;
    const qrString = `https://api.vietqr.io/image/970422-${bankInfo.accountNumber}-compact2.jpg?amount=${Math.round(
        qrAmount
    )}&addInfo=${encodeURIComponent(order.orderNumber)}&accountName=${encodeURIComponent(
        bankInfo.accountName
    )}`;

    // Gợi ý nhanh tiền mặt
    const calculateQuickCash = (total: number) => {
        const suggestions = [total];
        const roundedUp50k = Math.ceil(total / 50000) * 50000;
        const roundedUp100k = Math.ceil(total / 100000) * 100000;
        const roundedUp500k = Math.ceil(total / 500000) * 500000;

        [roundedUp50k, roundedUp100k, roundedUp500k].forEach((val) => {
            if (val > total && !suggestions.includes(val)) {
                suggestions.push(val);
            }
        });

        if (!suggestions.includes(500000) && total < 500000) suggestions.push(500000);
        if (!suggestions.includes(1000000) && total < 1000000) suggestions.push(1000000);

        return suggestions.slice(0, 5);
    };

    const quickCashList = calculateQuickCash(order.total);
    const changeAmount = Math.max(0, cashGiven - order.total);
    const isSplitValid = splitCash + splitQr === order.total;

    const handleCopyContent = () => {
        navigator.clipboard.writeText(order.orderNumber);
        sound.play('click');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirmPay = () => {
        setIsProcessing(true);
        sound.play('pay_success');

        try {
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.7 },
            });
        } catch {
            // Fallback nếu thiếu canvas-confetti
        }

        setTimeout(() => {
            setIsProcessing(false);
            if (selectedMethod === 'split') {
                onCompletePayment(selectedMethod, order.total, 0, {
                    cashAmount: splitCash,
                    vietqrAmount: splitQr,
                });
            } else if (selectedMethod === 'cash') {
                onCompletePayment(selectedMethod, cashGiven, changeAmount);
            } else {
                onCompletePayment(selectedMethod, order.total, 0);
            }
        }, 400);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-800 my-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-slate-900">Thanh toán đơn hàng</span>
                            <span className="bg-amber-500/20 text-amber-800 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                                {order.orderNumber}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {order.tableName} • {order.guestCount} khách • {order.items.length} món
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            sound.play('click');
                            onClose();
                        }}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tổng tiền cần thanh toán */}
                <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-md">
                    <div>
                        <span className="text-xs text-slate-300 font-medium">Cần thanh toán:</span>
                        <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                            {formatVND(order.total)}
                        </div>
                    </div>
                    <div className="text-right text-xs text-slate-300 space-y-0.5">
                        <div>Tạm tính: {formatVND(order.subtotal)}</div>
                        {order.discountAmount > 0 && (
                            <div className="text-rose-300">Giảm giá: -{formatVND(order.discountAmount)}</div>
                        )}
                        {order.taxAmount > 0 && <div>VAT ({order.taxPercent}%): +{formatVND(order.taxAmount)}</div>}
                    </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                    {[
                        { id: 'vietqr', label: 'VietQR', icon: QrCode, color: 'text-amber-600' },
                        { id: 'cash', label: 'Tiền mặt', icon: Banknote, color: 'text-emerald-600' },
                        { id: 'card', label: 'Thẻ POS', icon: CreditCard, color: 'text-blue-600' },
                        { id: 'momo', label: 'Ví MoMo', icon: Wallet, color: 'text-pink-600' },
                        { id: 'split', label: 'Tách kênh', icon: Split, color: 'text-purple-600' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const active = selectedMethod === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    sound.play('click');
                                    setSelectedMethod(item.id as PaymentMethod);
                                }}
                                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${active
                                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${item.color}`} />
                                <span className="text-xs">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Khung chi tiết phương thức */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 min-h-[220px] flex flex-col justify-center">
                    {/* VietQR View */}
                    {selectedMethod === 'vietqr' && (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs shrink-0 text-center">
                                <img
                                    src={qrString}
                                    alt="VietQR Payment"
                                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-lg mx-auto"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' +
                                            encodeURIComponent(`VIETQR|MB|${bankInfo.accountNumber}|${order.total}|${order.orderNumber}`);
                                    }}
                                />
                                <p className="text-[10px] text-slate-500 font-medium mt-1">
                                    Quét bằng App Ngân hàng
                                </p>
                            </div>

                            <div className="space-y-2 text-xs w-full">
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                                        Ngân hàng thụ hưởng:
                                    </span>
                                    <strong className="text-slate-800">{bankInfo.bankName}</strong>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                                            Số tài khoản:
                                        </span>
                                        <strong className="font-mono text-slate-800 text-sm">{bankInfo.accountNumber}</strong>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                        {bankInfo.accountName}
                                    </span>
                                </div>
                                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex justify-between items-center">
                                    <div>
                                        <span className="text-amber-700 block text-[10px] uppercase font-semibold">
                                            Nội dung chuyển khoản:
                                        </span>
                                        <strong className="font-mono text-amber-900 text-sm">{order.orderNumber}</strong>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyContent}
                                        className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-white border border-amber-300 px-2 py-1 rounded-lg hover:bg-amber-100 cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Đã sao chép' : 'Sao chép'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cash View */}
                    {selectedMethod === 'cash' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Khách đưa (VNĐ):
                                </label>
                                <input
                                    type="number"
                                    value={cashGiven || ''}
                                    onChange={(e) => setCashGiven(Number(e.target.value))}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-lg font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <span className="text-[11px] font-medium text-slate-500 block mb-1">
                                    Gợi ý tiền mặt nhanh:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {quickCashList.map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => {
                                                sound.play('click');
                                                setCashGiven(amt);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${cashGiven === amt
                                                ? 'bg-amber-500 text-slate-950 border-amber-500'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                }`}
                                        >
                                            {formatVND(amt)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                                <span className="font-semibold text-xs text-emerald-800">Tiền thừa trả khách:</span>
                                <span className="text-lg font-black text-emerald-700">{formatVND(changeAmount)}</span>
                            </div>
                        </div>
                    )}

                    {/* Card / POS View */}
                    {selectedMethod === 'card' && (
                        <div className="py-6 text-center space-y-2">
                            <CreditCard className="w-12 h-12 text-blue-500 mx-auto" />
                            <p className="font-bold text-slate-800 text-sm">
                                Quẹt thẻ hoặc chạm Contactless trên máy POS
                            </p>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Hỗ trợ Visa, Mastercard, JCB, Napas và Apple Pay / Google Pay.
                            </p>
                        </div>
                    )}

                    {/* MoMo View */}
                    {selectedMethod === 'momo' && (
                        <div className="py-6 text-center space-y-2">
                            <Wallet className="w-12 h-12 text-pink-500 mx-auto" />
                            <p className="font-bold text-slate-800 text-sm">
                                Thanh toán qua Ví điện tử MoMo / ZaloPay
                            </p>
                            <p className="text-xs text-slate-500">
                                Khách hàng quét mã QR hoặc chạm máy quét mã vạch ví MoMo.
                            </p>
                        </div>
                    )}

                    {/* Split Payment View */}
                    {selectedMethod === 'split' && (
                        <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        1. Tiền mặt (Cash):
                                    </label>
                                    <input
                                        type="number"
                                        value={splitCash || ''}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setSplitCash(val);
                                            setSplitQr(Math.max(0, order.total - val));
                                        }}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        2. Chuyển khoản (QR):
                                    </label>
                                    <input
                                        type="number"
                                        value={splitQr || ''}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setSplitQr(val);
                                            setSplitCash(Math.max(0, order.total - val));
                                        }}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            {!isSplitValid && (
                                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>Tổng tiền phân bổ phải đúng bằng {formatVND(order.total)}</span>
                                </div>
                            )}

                            <p className="text-[11px] text-slate-500 text-center">
                                Tổng cộng: {formatVND(splitCash + splitQr)} / Cần thanh toán: {formatVND(order.total)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 mt-4">
                    <button
                        type="button"
                        onClick={() => {
                            sound.play('click');
                            onClose();
                        }}
                        className="w-1/3 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                    >
                        Quay lại
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirmPay}
                        disabled={
                            isProcessing ||
                            (selectedMethod === 'cash' && cashGiven < order.total) ||
                            (selectedMethod === 'split' && !isSplitValid)
                        }
                        className="w-2/3 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isProcessing ? (
                            <span>Đang xử lý...</span>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Xác nhận Đã Thu Tiền & Hoàn tất</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};