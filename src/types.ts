export type DebtType = 'receivable' | 'payable'; // 'receivable' = Phải thu (khách nợ mình), 'payable' = Phải trả (mình nợ khách)

export type DebtStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface Debt {
  id: string;
  debtorName: string;      // Tên đối tác / khách hàng
  debtorPhone: string;     // Số điện thoại để gửi Zalo/SMS
  debtorEmail?: string;    // Email để liên hệ
  type: DebtType;
  amount: number;          // Tổng số tiền nợ gốc/chu kỳ
  paidAmount: number;      // Số tiền đã trả
  startDate: string;       // Ngày phát sinh nợ (YYYY-MM-DD)
  dueDate: string;         // Hạn thanh toán (YYYY-MM-DD)
  status: DebtStatus;
  category: string;        // Phân nhóm: Kinh doanh, Nhập hàng, Cá nhân, Thuê mặt bằng, Khác
  note?: string;           // Ghi chú thêm
}

export interface PaymentHistory {
  id: string;
  debtId: string;
  debtorName: string;
  amount: number;
  paymentDate: string;     // Ngày thanh toán (YYYY-MM-DD)
  paymentMethod: string;   // Tiền mặt, Chuyển khoản, Ví điện tử
  note?: string;
}

export interface DebtStats {
  totalReceivable: number;       // Tổng phải thu
  totalReceivablePaid: number;   // Phải thu đã thu
  totalReceivableRemaining: number; // Phải thu còn lại
  totalPayable: number;          // Tổng phải trả
  totalPayablePaid: number;      // Phải trả đã trả
  totalPayableRemaining: number;    // Phải trả còn lại
  overdueCount: number;          // Số khoản nợ quá hạn
  totalOverdueAmount: number;    // Tổng số tiền quá hạn (gồm cả phải thu và phải trả)
}

export interface AIDraftRequest {
  debtorName: string;
  amount: number;
  dueDate: string;
  type: DebtType;
  tone: 'polite' | 'friendly' | 'urgent'; // Lịch sự, Thân thiện, Khẩn cấp/Nghiêm túc
  customDetail?: string;
}

export interface AIDraftResponse {
  draft: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;       // Thời gian ghi chép
  type: 'create' | 'update' | 'delete' | 'payment';
  message: string;
}
