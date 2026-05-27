import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Storage path: root "db.json"
const DB_FILE_PATH = path.join(process.cwd(), "db.json");

const INITIAL_DEBTS = [
  {
    id: "debt-01",
    debtorName: "Nguyễn Văn Nam",
    debtorPhone: "0912345678",
    debtorEmail: "nam.nguyen@gmail.com",
    type: "receivable",
    amount: 15400000,
    paidAmount: 5000000,
    startDate: "2026-04-10",
    dueDate: "2026-05-20",
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
    dueDate: "2026-05-25",
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
    dueDate: "2026-05-01",
    status: "paid",
    category: "Gia công cấu kiện",
    note: "Đã tất toán toàn bộ ngày 28/4/2026. Giao dịch thuận lợi."
  },
  {
    id: "debt-04",
    debtorName: "Nhà cung cấp gỗ Hòa Phát",
    debtorPhone: "0243123456",
    type: "payable",
    amount: 32000000,
    paidAmount: 12000000,
    startDate: "2026-05-10",
    dueDate: "2026-05-26",
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
    dueDate: "2026-05-29",
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
    dueDate: "2026-06-15",
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
    dueDate: "2026-05-15",
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

const INITIAL_LOGS = [
  { id: "log-1", timestamp: "2026-05-25 09:30:15", type: "create", message: "Đã thêm khoản nợ phải thu mới: Chị Lê Hoàng Yến - 3.500.000 ₫" },
  { id: "log-2", timestamp: "2026-05-26 14:15:22", type: "payment", message: "Ghi nhận thanh toán 12.000.000 ₫ cho khoản nợ trả 'Nhà cung cấp gỗ Hòa Phát'" },
  { id: "log-3", timestamp: "2026-05-27 08:23:44", type: "update", message: "Đã cập nhật thông tin hạn nợ của đại lý Bùi Minh Tú" }
];

const INITIAL_PAYMENTS = [
  {
    id: "pay-init-0",
    debtId: "debt-01",
    debtorName: "Nguyễn Văn Nam",
    amount: 5000000,
    paymentDate: "2026-04-10",
    paymentMethod: "Chuyển khoản",
    note: "Ghi nhận trả nợ ban đầu"
  },
  {
    id: "pay-init-2",
    debtId: "debt-03",
    debtorName: "Cơ khí Hoàng Long",
    amount: 45000000,
    paymentDate: "2026-03-20",
    paymentMethod: "Chuyển khoản",
    note: "Ghi nhận trả nợ ban đầu"
  },
  {
    id: "pay-init-3",
    debtId: "debt-04",
    debtorName: "Nhà cung cấp gỗ Hòa Phát",
    amount: 12000000,
    paymentDate: "2026-05-10",
    paymentMethod: "Chuyển khoản",
    note: "Ghi nhận trả nợ ban đầu"
  },
  {
    id: "pay-init-6",
    debtId: "debt-07",
    debtorName: "Bùi Minh Tú (Đại lý Sài Gòn)",
    amount: 80000000,
    paymentDate: "2026-04-01",
    paymentMethod: "Chuyển khoản",
    note: "Ghi nhận trả nợ ban đầu"
  },
  {
    id: "pay-init-7",
    debtId: "debt-08",
    debtorName: "Ủy Ban Nhân Dân Phường (Thuế đất)",
    amount: 2500000,
    paymentDate: "2026-04-20",
    paymentMethod: "Chuyển khoản",
    note: "Ghi nhận trả nợ ban đầu"
  }
];

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const defaultData = {
        debts: INITIAL_DEBTS,
        logs: INITIAL_LOGS,
        payments: INITIAL_PAYMENTS
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }
    const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Lỗi khi đọc file db.json:", error);
    return {
      debts: INITIAL_DEBTS,
      logs: INITIAL_LOGS,
      payments: INITIAL_PAYMENTS
    };
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Lỗi khi ghi file db.json:", error);
    return false;
  }
}

// API to Fetch All Data
app.get("/api/data", (req, res) => {
  const dbData = readDb();
  res.json(dbData);
});

// API to Persist Data
app.post("/api/save", (req, res) => {
  const { debts, logs, payments } = req.body;
  if (!debts || !logs || !payments) {
    return res.status(400).json({ status: "error", message: "Dữ liệu gửi lên không đúng định dạng." });
  }
  const success = writeDb({ debts, logs, payments });
  if (success) {
    res.json({ status: "ok", message: "Đã đồng bộ lưu trữ đám mây thành công!" });
  } else {
    res.status(500).json({ status: "error", message: "Không thể lưu trữ tệp lên server." });
  }
});

// Lazy initialize Google Gen AI to prevent application crashes when GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Format currency for placeholder fallback
const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

// API Endpoint for AI Debt Reminder Drafting
app.post("/api/ai-reminder-draft", async (req, res) => {
  const { debtorName, amount, dueDate, type, tone, customDetail } = req.body;

  if (!debtorName || amount === undefined || !dueDate || !type || !tone) {
    return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc (debtorName, amount, dueDate, type, tone)." });
  }

  const amountStr = formatVND(amount);
  const relation = type === 'receivable' ? 'khoản phải thu' : 'khoản phải trả';
  const role = type === 'receivable' ? 'chủ nợ' : 'người thanh toán';

  // Construct prompt for Vietnamese Tone
  let toneGuideline = "";
  if (tone === 'polite') {
    toneGuideline = "lịch sự, trang trọng, tôn trọng đối tác kinh doanh, giữ gìn mối quan hệ tốt đẹp.";
  } else if (tone === 'friendly') {
    toneGuideline = "thân thiện, nhẹ nhàng, cởi mở như bạn bè thân thiết hoặc đối tác thân quen lâu năm.";
  } else if (tone === 'urgent') {
    toneGuideline = "nghiêm túc, dứt khoát, nhấn mạnh tính khẩn cấp của việc quá hạn hoặc sát ngày đóng sổ, yêu cầu phản hồi sớm.";
  }

  const prompt = `Bạn là một trợ lý ảo thông minh của ứng dụng quản lý công nợ "Mai Công Việc". 
Hãy viết một tin nhắn nhắc nhở thanh toán công nợ bằng TIẾNG VIỆT tự nhiên, tinh tế để người dùng gửi qua Zalo, SMS hoặc Messenger.

Thông tin công nợ:
- Tên người nợ / đối tác: ${debtorName}
- Số tiền: ${amountStr}
- Hạn thanh toán: ${dueDate}
- Loại công nợ: ${relation}
- Vai trò của người gửi: ${type === 'receivable' ? 'Người thu hồi nợ (nhắc đối tác trả tiền cho thiết bị/dịch vụ)' : 'Người đề xuất thanh toán (nhắc nhân viên/bộ phận duyệt chi để trả tiền)'}
- Ghi chú thêm từ người dùng: ${customDetail || "Không có"}

Yêu cầu về giọng điệu:
- Giọng điệu chủ đạo: ${toneGuideline}
- Độ dài vừa phải (khoảng 100-250 từ).
- Tin nhắn nên có cấu trúc rõ ràng: Lời chào xã giao phù hợp, thông tin số tiền & hạn thanh toán chi tiết chính xác, lời chúc tốt đẹp hoặc lời cảm ơn, đề xuất phương thức chuyển khoản thuận tiện.
- Đặt tiêu đề hoặc đặt trong khung văn bản dễ sao chép một chạm. Không chứa các ký tự lạ hoặc thẻ HTML phức tạp.
- Trả về TIN NHẮN TRỰC TIẾP, không viết thêm các đoạn phân tích bối cảnh ngoài lề hay giải thích dài dòng ở đầu hay cuối.`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const draftText = response.text || "";
    return res.json({ draft: draftText.trim() });
  } catch (error: any) {
    console.warn("Lỗi khi kết nối hoặc chưa cấu hình Gemini API. Chuyển sang dịch vụ fallback nội bộ.", error?.message);

    // Dynamic High-Quality Fallback Messages
    let fallbackText = "";
    if (type === 'receivable') {
      if (tone === 'polite') {
        fallbackText = `Kính gửi anh/chị ${debtorName},\n\nMai Công Việc xin phép gửi lời chào trân trọng đến anh/chị.\n\nChúng tôi xin phép nhắc lại thông tin đối chiếu công nợ của anh/chị tại bối cảnh hợp tác kinh doanh:\n- Số tiền nợ cần thanh toán: ${amountStr}\n- Hạn thanh toán: ${dueDate}\n\nĐể hỗ trợ công tác kế toán cuối kỳ và đối soát nhanh chóng, kính mong anh/chị sắp xếp thời gian thanh toán sớm trước ngày nêu trên.\n\nNếu có bất kỳ thắc mắc hoặc cần thêm chứng từ đối chiếu, anh/chị vui lòng phản hồi lại tại đây.\n\nXin chân thành cảm ơn sự hợp tác của anh/chị!\nTrân trọng,\n[Tên của bạn] - Ứng dụng Mai Công Việc`;
      } else if (tone === 'friendly') {
        fallbackText = `Chào ${debtorName} nhé,\n\nMình gửi tin nhắn này để cập nhật chút thông tin công nợ nhẹ nhàng giữa hai bên nhé. \n\nHiện tại khoản nợ số tiền: ${amountStr} có lịch hẹn thanh toán vào ngày ${dueDate}.\n\nNếu ${debtorName} có thời gian rảnh thì sắp xếp thanh toán giúp mình qua hình thức chuyển khoản nhé. Nếu đang bận hoặc có khó khăn gì cứ nhắn trước cho mình hay nha. \n\nChúc bạn một ngày làm việc thật nhiều niềm vui và may mắn!\nCảm ơn ${debtorName} rất nhiều!`;
      } else {
        fallbackText = `⚠️ THÔNG BÁO NHẮC NỢ QUÁ HẠN KHẨN CẤP\n\nKính gửi anh/chị ${debtorName},\n\nChúng tôi gửi thông báo này liên quan đến khoản công nợ chưa được tất toán:\n- Số tiền: ${amountStr}\n- Hạn thanh toán đã qua: ${dueDate}\n\nKhoản nợ này hiện đã chuyển sang trạng thái QUÁ HẠN. Đề nghị anh/chị kiểm tra và thực hiện thanh toán ngay trong ngày hôm nay để tránh ảnh hưởng đến lịch sử giao dịch và kế hoạch hợp tác tiếp theo giữa hai bên.\n\nAnh/chị vui lòng chụp lại biên lai chuyển khoản phản hồi lại liên hệ này.\n\nTrân trọng,\nMai Công Việc`;
      }
    } else {
      // Payable fallback
      if (tone === 'polite') {
        fallbackText = `Chào anh/chị kế toán/thủ quỹ,\n\nTôi gửi thông tin đối chiếu khoản cần chi trả sắp tới cho đối tác ${debtorName}:\n- Số tiền đề xuất chi: ${amountStr}\n- Hạn thanh toán: ${dueDate}\n\nKính mong phòng ban tài chính rà soát số dư và sắp xếp thực hiện lệnh chi trả đúng hạn để duy trì quan hệ đối tác tin cậy.\n\nXin cảm ơn anh/chị rất nhiều.`;
      } else if (tone === 'friendly') {
        fallbackText = `Alo alo, phòng Tài chính kế toán ơi,\n\nNhắc khéo bộ phận mình lịch chi trả nợ mua hàng cho đối tác ${debtorName} nhé:\n- Số tiền: ${amountStr}\n- Hạn chót: ${dueDate}\n\nMọi người làm lệnh chi sớm giúp kịp tiến độ bên giao nhận nha. Cảm ơn cả nhà nhiều nhiều!`;
      } else {
        fallbackText = `⚠️ YÊU CẦU DUYỆT CHI TRẢ GẤP\n\nKính gửi Ban Giám đốc và Phòng Kế toán,\n\nYêu cầu rà soát và thực hiện chi trả khoản nợ sắp đến hạn / quá hạn cho đối tác ${debtorName}:\n- Số tiền cần trả: ${amountStr}\n- Hạn chót thanh toán: ${dueDate}\n\nViệc chậm trễ thanh toán có thể dẫn đến phạt hợp đồng hoặc ảnh hưởng nghiêm trọng đến uy tín cung ứng vật tư của doanh nghiệp chúng ta. Đề nghị duyệt chi gấp.\n\nTrân trọng.`;
      }
    }

    if (customDetail) {
      fallbackText += `\n\n* Lưu ý: ${customDetail}`;
    }

    return res.json({ 
      draft: fallbackText, 
      isFallback: true, 
      statusInfo: "Gemini API đang chạy ở chế độ mô phỏng hoặc chưa kích hoạt khóa." 
    });
  }
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Import Vite dynamics in dev mode
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Mai Công Việc Backend] Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Fullstack server:", err);
});
