import { Debt } from "./types";

// Lấy ngày hiện tại làm mốc neo dữ liệu (2026-05-27)
export const INITIAL_DEBTS: Debt[] = [
  {
    id: "debt-01",
    debtorName: "Nguyễn Văn Nam",
    debtorPhone: "0912345678",
    debtorEmail: "nam.nguyen@gmail.com",
    type: "receivable",
    amount: 15400000,
    paidAmount: 5000000,
    startDate: "2026-04-10",
    dueDate: "2026-05-20", // Quá hạn (Overdue) -> Báo đỏ!
    status: "partially_paid",
    category: "Bán hàng thiết bị",
    note: "Khách hàng mua máy phát điện Makita, đã chuyển khoản cọc. Hứa chuyển nốt phần còn lại."
  },
  {
    id: "debt-02",
    debtorName: "Trần Thị Mai",
    debtorPhone: "0987654321",
    debtorEmail: "maitran@gmail.com",
    type: "receivable",
    amount: 8200000,
    paidAmount: 0,
    startDate: "2026-05-01",
    dueDate: "2026-05-25", // Quá hạn nợ gốc toàn bộ -> Báo đỏ!
    status: "unpaid",
    category: "Thiết kế logo & Nhãn hiệu",
    note: "Hợp đồng thiết kế bộ nhận diện thương hiệu thời trang Mai Vy."
  },
  {
    id: "debt-03",
    debtorName: "Cơ khí Hoàng Long",
    debtorPhone: "0905558899",
    debtorEmail: "contact@hoanglongme.vn",
    type: "receivable",
    amount: 45000000,
    paidAmount: 45000000,
    startDate: "2026-03-20",
    dueDate: "2026-05-01", // Đã thanh toán đầy đủ
    status: "paid",
    category: "Gia công cấu kiện",
    note: "Đã tất toán toàn bộ ngày 28/4/2026. Giao dịch thuận lợi."
  },
  {
    id: "debt-04",
    debtorName: "Nhà cung cấp gỗ Hòa Phát",
    debtorPhone: "0243123456",
    type: "payable", // Mình nợ nhà cung cấp
    amount: 32000000,
    paidAmount: 12000000,
    startDate: "2026-05-10",
    dueDate: "2026-05-26", // Quá hạn thanh toán của mình -> Báo đỏ!
    status: "partially_paid",
    category: "Nhập nguyên vật liệu",
    note: "Hóa đơn nhập gỗ sồi Nga đợt 2 kèm phụ kiện gỗ."
  },
  {
    id: "debt-05",
    debtorName: "Chị Lê Hoàng Yến",
    debtorPhone: "0944662288",
    type: "receivable",
    amount: 3500000,
    paidAmount: 0,
    startDate: "2026-05-15",
    dueDate: "2026-05-29", // Sắp đến hạn -> Cảnh báo cam/đỏ nhẹ!
    status: "unpaid",
    category: "Cá nhân vay mượn",
    note: "Mượn tạm thanh toán hóa đơn tiền điện chi nhánh 2."
  },
  {
    id: "debt-06",
    debtorName: "Đơn vị Quảng Cáo Ánh Sáng",
    debtorPhone: "0967889900",
    type: "payable",
    amount: 12500000,
    paidAmount: 0,
    startDate: "2026-05-20",
    dueDate: "2026-06-15", // Chưa đến hạn (Hạn xa) -> An toàn
    status: "unpaid",
    category: "Chi phí Marketing",
    note: "Chi phí in bạt Hiflex và treo biển hiệu ngoài trời đường Láng."
  },
  {
    id: "debt-07",
    debtorName: "Bùi Minh Tú (Đại lý Sài Gòn)",
    debtorPhone: "0933445566",
    debtorEmail: "tubui@saigonagency.com",
    type: "receivable",
    amount: 110000000,
    paidAmount: 80000000,
    startDate: "2026-04-01",
    dueDate: "2026-05-15", // Khoản lớn quá hạn thu -> Báo đỏ nguy cấp!
    status: "partially_paid",
    category: "Bán hàng thiết bị",
    note: "Lô hàng linh kiện phân phối cho đại lý Sài Gòn đợt 1."
  },
  {
    id: "debt-08",
    debtorName: "Ủy Ban Nhân Dân Phường (Thuế đất)",
    debtorPhone: "0243000111",
    type: "payable",
    amount: 2500000,
    paidAmount: 2500000,
    startDate: "2026-04-20",
    dueDate: "2026-05-10",
    status: "paid",
    category: "Thuế & Phí mặt bằng",
    note: "Đã nộp đầy đủ biên lai thuế trực tiếp tại cơ quan hành chính."
  }
];

export const CATEGORIES = [
  "Hợp Đồng Biểu diễn",
  "hợp đồng dancer",
  "hợp đồng cho thuê trang phục",
  "Bán hàng thiết bị",
  "Nhập nguyên vật liệu",
  "Thiết kế logo & Nhãn hiệu",
  "Gia công cấu kiện",
  "Chi phí Marketing",
  "Thu Thuế & Phí",
  "Thuê mặt bằng",
  "Cá nhân vay mượn",
  "Khác"
];

export const INITIAL_LOGS = [
  { id: "log-1", timestamp: "2026-05-25 09:30:15", type: "create", message: "Đã thêm khoản nợ phải thu mới: Chị Lê Hoàng Yến - 3.500.000 ₫" },
  { id: "log-2", timestamp: "2026-05-26 14:15:22", type: "payment", message: "Ghi nhận thanh toán 12.000.000 ₫ cho khoản nợ trả 'Nhà cung cấp gỗ Hòa Phát'" },
  { id: "log-3", timestamp: "2026-05-27 08:23:44", type: "update", message: "Đã cập nhật thông tin hạn nợ của đại lý Bùi Minh Tú" }
];
