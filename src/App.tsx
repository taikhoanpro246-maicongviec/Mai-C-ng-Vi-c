/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Calendar, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Download, 
  Sparkles, 
  Bell, 
  Filter, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  X, 
  Check, 
  RotateCcw, 
  FileSpreadsheet,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Info,
  Menu
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Debt, DebtStatus, DebtType, PaymentHistory, ActivityLog, DebtStats } from "./types";
import { INITIAL_DEBTS, CATEGORIES, INITIAL_LOGS } from "./data";

export default function App() {
  // --- STATE ---
  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem('mai_cong_viec_debts');
    return saved ? JSON.parse(saved) : INITIAL_DEBTS;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('mai_cong_viec_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [payments, setPayments] = useState<PaymentHistory[]>(() => {
    const saved = localStorage.getItem('mai_cong_viec_payments');
    if (saved) return JSON.parse(saved);
    // Create initial payment logs from initial paid values to populate payments
    const initialPayments: PaymentHistory[] = [];
    INITIAL_DEBTS.forEach((d, i) => {
      if (d.paidAmount > 0) {
        initialPayments.push({
          id: `pay-init-${i}`,
          debtId: d.id,
          debtorName: d.debtorName,
          amount: d.paidAmount,
          paymentDate: d.startDate,
          paymentMethod: "Chuyển khoản",
          note: "Ghi nhận trả nợ ban đầu"
        });
      }
    });
    return initialPayments;
  });

  // UI state
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'receivables' | 'payables' | 'reminders' | 'logs'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản');
  const [paymentNote, setPaymentNote] = useState('');
  
  // AI Reminder state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedDebtForAI, setSelectedDebtForAI] = useState<Debt | null>(null);
  const [aiTone, setAiTone] = useState<'polite' | 'friendly' | 'urgent'>('friendly');
  const [aiCustomNote, setAiCustomNote] = useState('');
  const [aiPromptResponse, setAiPromptResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  // Forms state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState<DebtType>('receivables' === currentTab ? 'receivable' : 'payable');
  const [formAmount, setFormAmount] = useState('');
  const [formPaidAmount, setFormPaidAmount] = useState('0');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formNote, setFormNote] = useState('');

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [isExcelSuccessOpen, setIsExcelSuccessOpen] = useState(false);
  const [exportedFilename, setExportedFilename] = useState('');

  // Online Cloud Storage States
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Today marker for due checking (2026-05-27 in Vietnamese time context)
  const TODAY_STR = '2026-05-27';

  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 18) {
      return 'CHÀO BUỔI CHIỀU, MAI! 🌤️';
    } else if (hour >= 18 || hour < 5) {
      return 'CHÀO BUỔI TỐI, MAI! 🌙';
    }
    return 'CHÀO BUỔI SÁNG, MAI! ☀️';
  };

  // Fetch initial online data from server
  useEffect(() => {
    const fetchOnlineData = async () => {
      setSyncStatus('loading');
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const remote = await res.json();
          if (remote && remote.debts && remote.logs && remote.payments) {
            setDebts(remote.debts);
            setLogs(remote.logs);
            setPayments(remote.payments);
            setIsDataLoaded(true);
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
          }
        } else {
          setSyncStatus('error');
          setIsDataLoaded(true); // Fallback to localStorage initial values if fetch fails
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu từ máy chủ:", err);
        setSyncStatus('error');
        setIsDataLoaded(true); // Fallback to localStorage initial values on network error
      }
    };
    fetchOnlineData();
  }, []);

  // Sync to LocalStorage AND Cloud Backend with atomic debounce matching user action
  useEffect(() => {
    if (!isDataLoaded) return; // Guard to prevent overwriting with initial placeholder values

    localStorage.setItem('mai_cong_viec_debts', JSON.stringify(debts));
    localStorage.setItem('mai_cong_viec_logs', JSON.stringify(logs));
    localStorage.setItem('mai_cong_viec_payments', JSON.stringify(payments));

    const saveToServer = async () => {
      setSyncStatus('loading');
      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ debts, logs, payments })
        });
        if (res.ok) {
          setSyncStatus('success');
          setTimeout(() => setSyncStatus('idle'), 2000);
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        console.error("Lỗi khi đồng bộ dữ liệu lên máy chủ:", err);
        setSyncStatus('error');
      }
    };

    const timer = setTimeout(() => {
      saveToServer();
    }, 1000);

    return () => clearTimeout(timer);
  }, [debts, logs, payments, isDataLoaded]);

  // Synchronize form type on current tab change if applicable
  useEffect(() => {
    if (!editingDebt) {
      if (currentTab === 'receivables') setFormType('receivable');
      if (currentTab === 'payables') setFormType('payable');
    }
  }, [currentTab, editingDebt]);

  // --- LOGICAL HELPERS ---
  const addLog = (type: 'create' | 'update' | 'delete' | 'payment', message: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type,
      message
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const isOverdue = (debt: Debt): boolean => {
    if (debt.status === 'paid') return false;
    return debt.dueDate < TODAY_STR;
  };

  const getDaysOverdueOrRemaining = (dueDateStr: string): { days: number; type: 'overdue' | 'remaining' | 'today' } => {
    const due = new Date(dueDateStr);
    const today = new Date(TODAY_STR);
    
    // Normalize time parts
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { days: 0, type: 'today' };
    if (diffDays < 0) return { days: Math.abs(diffDays), type: 'overdue' };
    return { days: diffDays, type: 'remaining' };
  };

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // --- STATS CALCULATIONS ---
  const stats = useMemo((): DebtStats => {
    let totalReceivable = 0;
    let totalReceivablePaid = 0;
    let totalPayable = 0;
    let totalPayablePaid = 0;
    let overdueCount = 0;
    let totalOverdueAmount = 0;

    debts.forEach(d => {
      const remaining = d.amount - d.paidAmount;
      if (d.type === 'receivable') {
        totalReceivable += d.amount;
        totalReceivablePaid += d.paidAmount;
        if (isOverdue(d)) {
          overdueCount++;
          totalOverdueAmount += remaining;
        }
      } else {
        totalPayable += d.amount;
        totalPayablePaid += d.paidAmount;
        if (isOverdue(d)) {
          overdueCount++;
          totalOverdueAmount += remaining;
        }
      }
    });

    return {
      totalReceivable,
      totalReceivablePaid,
      totalReceivableRemaining: totalReceivable - totalReceivablePaid,
      totalPayable,
      totalPayablePaid,
      totalPayableRemaining: totalPayable - totalPayablePaid,
      overdueCount,
      totalOverdueAmount
    };
  }, [debts]);

  // List of overdue debts specifically (for alarming indicators)
  const overdueDebts = useMemo(() => {
    return debts.filter(d => isOverdue(d)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [debts]);

  // Upcoming debts in next 7 days
  const upcomingDebts = useMemo(() => {
    return debts.filter(d => {
      if (d.status === 'paid') return false;
      const { days, type } = getDaysOverdueOrRemaining(d.dueDate);
      return type === 'remaining' && days <= 7;
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [debts]);

  // Filtered Debt lists depending on tab
  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      // Filter by tab/type
      if (currentTab === 'receivables' && d.type !== 'receivable') return false;
      if (currentTab === 'payables' && d.type !== 'payable') return false;
      if (currentTab === 'dashboard') {
        // Dashboard can show everything inside detailed breakdowns
      }

      // Filter by search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = d.debtorName.toLowerCase().includes(searchLower) || 
                          d.debtorPhone.includes(searchTerm) || 
                          (d.note && d.note.toLowerCase().includes(searchLower)) ||
                          d.category.toLowerCase().includes(searchLower);
      if (!matchSearch) return false;

      // Filter by status dropdown
      if (statusFilter === 'unpaid' && d.status !== 'unpaid') return false;
      if (statusFilter === 'partially_paid' && d.status !== 'partially_paid') return false;
      if (statusFilter === 'paid' && d.status !== 'paid') return false;
      if (statusFilter === 'overdue' && !isOverdue(d)) return false;

      // Filter by category
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;

      return true;
    }).sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [debts, currentTab, searchTerm, statusFilter, categoryFilter]);

  // --- CRUD FUNCTIONS ---
  const handleOpenAddModal = (type?: DebtType) => {
    setEditingDebt(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormType(type ? type : (currentTab === 'payables' ? 'payable' : 'receivable'));
    setFormAmount('');
    setFormPaidAmount('0');
    setFormStartDate(TODAY_STR);
    const inTwoWeeks = new Date();
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
    setFormDueDate(inTwoWeeks.toISOString().split('T')[0]);
    setFormCategory(CATEGORIES[0]);
    setFormNote('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setFormName(debt.debtorName);
    setFormPhone(debt.debtorPhone);
    setFormEmail(debt.debtorEmail || '');
    setFormType(debt.type);
    setFormAmount(debt.amount.toString());
    setFormPaidAmount(debt.paidAmount.toString());
    setFormStartDate(debt.startDate);
    setFormDueDate(debt.dueDate);
    setFormCategory(debt.category);
    setFormNote(debt.note || '');
    setIsAddModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAmount || !formDueDate) {
      alert("Vui lòng điền đầy đủ: Tên đối tác, Số tiền nợ và Hạn thanh toán.");
      return;
    }

    const amountNum = parseFloat(formAmount);
    const paidNum = parseFloat(formPaidAmount) || 0;

    if (amountNum < 0 || paidNum < 0) {
      alert("Số tiền không được âm.");
      return;
    }
    if (paidNum > amountNum) {
      alert("Số tiền đã thanh toán không được lớn hơn tổng số tiền nợ gốc.");
      return;
    }

    let resolvedStatus: DebtStatus = 'unpaid';
    if (paidNum === amountNum) resolvedStatus = 'paid';
    else if (paidNum > 0) resolvedStatus = 'partially_paid';

    if (editingDebt) {
      // Edit
      const updatedDebts = debts.map(d => {
        if (d.id === editingDebt.id) {
          return {
            ...d,
            debtorName: formName.trim(),
            debtorPhone: formPhone.trim(),
            debtorEmail: formEmail.trim() || undefined,
            type: formType,
            amount: amountNum,
            paidAmount: paidNum,
            startDate: formStartDate,
            dueDate: formDueDate,
            status: resolvedStatus,
            category: formCategory,
            note: formNote.trim() || undefined
          };
        }
        return d;
      });
      setDebts(updatedDebts);
      addLog('update', `Đã cập nhật công nợ cho: ${formName.trim()} (${formType === 'receivable' ? 'Phải thu' : 'Phải trả'} - ${formatVND(amountNum)})`);
    } else {
      // Add new
      const newDebt: Debt = {
        id: `debt-${Date.now()}`,
        debtorName: formName.trim(),
        debtorPhone: formPhone.trim(),
        debtorEmail: formEmail.trim() || undefined,
        type: formType,
        amount: amountNum,
        paidAmount: paidNum,
        startDate: formStartDate,
        dueDate: formDueDate,
        status: resolvedStatus,
        category: formCategory,
        note: formNote.trim() || undefined
      };
      setDebts([newDebt, ...debts]);
      addLog('create', `Đã thêm mới công nợ: ${formName.trim()} (${formType === 'receivable' ? 'Phải thu' : 'Phải trả'} - ${formatVND(amountNum)})`);

      // Record payments as well if initial payment is logged
      if (paidNum > 0) {
        const newPayment: PaymentHistory = {
          id: `pay-${Date.now()}`,
          debtId: newDebt.id,
          debtorName: newDebt.debtorName,
          amount: paidNum,
          paymentDate: formStartDate,
          paymentMethod: "Chuyển khoản",
          note: "Ghi nhận trả nợ ban đầu lúc tạo mới"
        };
        setPayments(prev => [newPayment, ...prev]);
      }
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteDebt = (id: string) => {
    const debtToDelete = debts.find(d => d.id === id);
    if (!debtToDelete) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn khoản công nợ của "${debtToDelete.debtorName}" không? Hành động này sẽ xóa cả lịch sử thanh toán.`)) {
      setDebts(debts.filter(d => d.id !== id));
      setPayments(payments.filter(p => p.debtId !== id));
      addLog('delete', `Đã xóa vĩnh viễn công nợ của: ${debtToDelete.debtorName} (${formatVND(debtToDelete.amount)})`);
    }
  };

  // --- RECORD PAYMENT ---
  const handleOpenPaymentModal = (debt: Debt) => {
    setSelectedDebtForPayment(debt);
    const maxRemaining = debt.amount - debt.paidAmount;
    setPaymentAmount(maxRemaining.toString());
    setPaymentMethod('Chuyển khoản');
    setPaymentNote('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment || !paymentAmount) return;

    const payValue = parseFloat(paymentAmount);
    const maxRemaining = selectedDebtForPayment.amount - selectedDebtForPayment.paidAmount;

    if (payValue <= 0) {
      alert("Số tiền thanh toán phải lớn hơn 0 ₫");
      return;
    }
    if (payValue > maxRemaining) {
      alert(`Số tiền vượt quá dư nợ còn lại (${formatVND(maxRemaining)}). Vui lòng kiểm tra lại.`);
      return;
    }

    const updatedPaidAmount = selectedDebtForPayment.paidAmount + payValue;
    let newStatus: DebtStatus = 'partially_paid';
    if (updatedPaidAmount === selectedDebtForPayment.amount) {
      newStatus = 'paid';
    }

    // Update debt object
    setDebts(prev => prev.map(d => {
      if (d.id === selectedDebtForPayment.id) {
        return {
          ...d,
          paidAmount: updatedPaidAmount,
          status: newStatus
        };
      }
      return d;
    }));

    // Generate payment history log
    const newPayment: PaymentHistory = {
      id: `pay-${Date.now()}`,
      debtId: selectedDebtForPayment.id,
      debtorName: selectedDebtForPayment.debtorName,
      amount: payValue,
      paymentDate: TODAY_STR,
      paymentMethod,
      note: paymentNote.trim() || undefined
    };
    setPayments(prev => [newPayment, ...prev]);

    addLog('payment', `Đã ghi nhận thanh toán ${formatVND(payValue)} từ ${selectedDebtForPayment.debtorName} qua ${paymentMethod}.`);
    setIsPaymentModalOpen(false);
  };

  // --- AI REMINDER MAKER ---
  const handleOpenAIModal = (debt: Debt) => {
    setSelectedDebtForAI(debt);
    setAiTone('friendly');
    setAiCustomNote('');
    setAiPromptResponse('');
    setAiCopied(false);
    setAiStatus('');
    setIsAIModalOpen(true);
  };

  const generateAIReminder = async () => {
    if (!selectedDebtForAI) return;
    setIsAiLoading(true);
    setAiPromptResponse('');
    setAiStatus('Đang gửi truy vấn để AI chọn lọc từ ngữ và khởi tạo văn bản...');

    try {
      const response = await fetch('/api/ai-reminder-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debtorName: selectedDebtForAI.debtorName,
          amount: selectedDebtForAI.amount - selectedDebtForAI.paidAmount,
          dueDate: selectedDebtForAI.dueDate,
          type: selectedDebtForAI.type,
          tone: aiTone,
          customDetail: aiCustomNote
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi máy chủ phát sinh trong quá trình soạn thảo.");
      }

      const data = await response.json();
      setAiPromptResponse(data.draft);
      if (data.isFallback) {
        setAiStatus(data.statusInfo);
      } else {
        setAiStatus('Tin nhắn lập thảo thành công từ đại trí tuệ nhân tạo Gemini 3.5 Flash!');
      }
    } catch (error: any) {
      console.error(error);
      setAiStatus('Gặp sự cố kết nối. Đang kích hoạt bộ giải pháp dự phòng khẩn cấp...');
      // Static fallback immediately on absolute failure
      const remaining = selectedDebtForAI.amount - selectedDebtForAI.paidAmount;
      const amtStr = formatVND(remaining);
      setAiPromptResponse(`[Kênh Nhắc Nợ Mai Công Việc - Thân thiện]\nChào ${selectedDebtForAI.debtorName} ơi! Nhắc nhẹ bạn về số nợ trị giá ${amtStr} đến ngày thanh toán ${selectedDebtForAI.dueDate}. Nhờ bạn thu xếp chuyển khoản giúp mình nha. Cảm ơn nhiều nha!`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyAIResponse = () => {
    if (!aiPromptResponse) return;
    navigator.clipboard.writeText(aiPromptResponse);
    setAiCopied(true);
    setTimeout(() => setAiCopied(false), 2000);
  };

  // --- EXCEL/CSV MONTHLY EXPORT ---
  const handleExportMonthlyExcel = () => {
    // We will build a multi-section spreadsheet embedded in a clean CSV file
    // To make sure Excel opens it beautifully, we prepend with BOM \uFEFF for UTF-8
    
    const BOM = "\uFEFF";
    let csvContent = "";

    // 1. Header & Metadata
    csvContent += "CÔNG TY/DOANH NGHIỆP;BÁO CÁO CÔNG NỢ CHI TIẾT THÁNG - ỨNG DỤNG MAI CÔNG VIỆC\r\n";
    csvContent += `Thời gian xuất báo cáo;${TODAY_STR}\r\n`;
    csvContent += `Tổng hợp nợ phải thu cuối kỳ;${formatVND(stats.totalReceivableRemaining).replace('₫', 'VND')}\r\n`;
    csvContent += `Tổng hợp nợ phải trả cuối kỳ;${formatVND(stats.totalPayableRemaining).replace('₫', 'VND')}\r\n`;
    csvContent += `Số lượng khoản nợ quá hạn cảnh báo đỏ;${stats.overdueCount}\r\n`;
    csvContent += "\r\n";

    // 2. Section: PHẢI THU (Receivables)
    csvContent += "I. PHÂN LỚP NỢ PHẢI THU CỦA KHÁCH HÀNG (RECEIVABLES)\r\n";
    csvContent += "Mã công nợ;Tên khách hàng;Số điện thoại;Phân loại;Ngày phát sinh;Ngày hạn nợ;Tổng nợ gốc (VND);Đã thanh toán (VND);Dư nợ còn lại (VND);Trạng thái;Đánh giá cảnh báo\r\n";
    
    const receivables = debts.filter(d => d.type === 'receivable');
    receivables.forEach(d => {
      const remaining = d.amount - d.paidAmount;
      const daysInfo = getDaysOverdueOrRemaining(d.dueDate);
      let alertMsg = "An toàn";
      if (isOverdue(d)) {
        alertMsg = `Cảnh báo đỏ: Quá hạn ${daysInfo.days} ngày`;
      } else if (d.status !== 'paid' && daysInfo.type === 'remaining' && daysInfo.days <= 7) {
        alertMsg = `Cận kề hạn: Còn ${daysInfo.days} ngày`;
      } else if (d.status === 'paid') {
        alertMsg = "Đã tất toán";
      }

      const statusMap = {
        'unpaid': 'Chưa thanh toán',
        'partially_paid': 'Trả một phần',
        'paid': 'Đã hoàn tất thanh toán'
      }[d.status];

      csvContent += `${d.id};"${d.debtorName}";"${d.debtorPhone}";"${d.category}";${d.startDate};${d.dueDate};${d.amount};${d.paidAmount};${remaining};"${statusMap}";"${alertMsg}"\r\n`;
    });
    csvContent += "\r\n";

    // 3. Section: PHẢI TRẢ (Payables)
    csvContent += "II. DANH SÁCH CHI TIẾT NỢ PHẢI TRẢ NHÀ CUNG CẤP (PAYABLES)\r\n";
    csvContent += "Mã công nợ;Nhà cung cấp/Đối tác;Số điện thoại;Phân loại;Ngày phát sinh;Ngày hạn nợ;Giá trị hóa đơn (VND);Đã thanh toán (VND);Còn lại cần chi (VND);Trạng thái;Đánh giá khẩn cấp\r\n";
    
    const payables = debts.filter(d => d.type === 'payable');
    payables.forEach(d => {
      const remaining = d.amount - d.paidAmount;
      const daysInfo = getDaysOverdueOrRemaining(d.dueDate);
      let alertMsg = "Bình thường";
      if (isOverdue(d)) {
        alertMsg = `Cảnh báo đỏ: Mình quá hạn trả ${daysInfo.days} ngày!`;
      } else if (d.status !== 'paid' && daysInfo.type === 'remaining' && daysInfo.days <= 7) {
        alertMsg = `Khẩn chi: Hạn còn ${daysInfo.days} ngày nữa!`;
      } else if (d.status === 'paid') {
        alertMsg = "Đã trả xong";
      }

      const statusMap = {
        'unpaid': 'Chưa trả',
        'partially_paid': 'Đã trả một phần',
        'paid': 'Đã trả hết'
      }[d.status];

      csvContent += `${d.id};"${d.debtorName}";"${d.debtorPhone}";"${d.category}";${d.startDate};${d.dueDate};${d.amount};${d.paidAmount};${remaining};"${statusMap}";"${alertMsg}"\r\n`;
    });

    const fileString = BOM + csvContent;
    const blob = new Blob([fileString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create high-fidelity download anchor
    const dateFormatted = new Date().toISOString().split('T')[0];
    const filename = `Mai_Cong_Viec_Bao_Cao_Cong_No_${dateFormatted}.csv`;
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedFilename(filename);
    setIsExcelSuccessOpen(true);
    addLog('update', `Đã xuất báo cáo công nợ toàn diện dạng Excel/CSV Tháng thành công: ${filename}`);
  };

  // --- CHART DATA PREPARATIONS ---
  // Category charts
  const categoryChartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    debts.forEach(d => {
      const remaining = d.amount - d.paidAmount;
      categoryTotals[d.category] = (categoryTotals[d.category] || 0) + remaining;
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value
    })).filter(item => item.value > 0);
  }, [debts]);

  const COLORS = ['#10b981', '#34d399', '#059669', '#047857', '#065f46', '#22c55e', '#66bb6a', '#43a047', '#2e7d32'];

  // Bar chart: Receivables vs Payables (Paid vs Pending compare)
  const financeChartData = useMemo(() => {
    return [
      {
        name: 'Nợ Phải Thu (KH nợ mình)',
        'Đã Thu': stats.totalReceivablePaid,
        'Chưa Thu': stats.totalReceivableRemaining,
      },
      {
        name: 'Nợ Phải Trả (Mình nợ)',
        'Đã Trả': stats.totalPayablePaid,
        'Chưa Trả': stats.totalPayableRemaining,
      }
    ];
  }, [stats]);

  // --- STATISTIC GRAPHIC BAR COMPONENT ---
  const renderSimpleProgressBar = (paid: number, total: number) => {
    const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    return (
      <div className="w-full mt-1">
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
          <span>Tiến độ thanh toán:</span>
          <span className="font-semibold text-emerald-700">{pct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-gray-800 antialiased selection:bg-emerald-100 selection:text-emerald-900" id="main-app-container">
      
      {/* Sidebar - responsive layout */}
      <aside className="w-68 bg-emerald-900 text-emerald-50 flex flex-col shrink-0 hidden md:flex border-r border-emerald-950/20 shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-emerald-800/50">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/50 font-black text-xl text-emerald-950">🍀</div>
          <div>
            <span className="font-extrabold text-lg tracking-tight block leading-tight uppercase">MAI CÔNG VIỆC</span>
            <span className="text-[10px] text-emerald-300 font-mono tracking-wider uppercase block">Quản Trị Công Nợ v2.5</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Tổng quan Dashboard', icon: '📊' },
            { id: 'receivables', label: 'Phải Thu Khách Hàng', icon: '👥', badge: debts.filter(d => d.type === 'receivable').length },
            { id: 'payables', label: 'Phải Trả Đối Tác', icon: '🏦', badge: debts.filter(d => d.type === 'payable').length },
            { id: 'reminders', label: 'Cảnh Báo & Nhắc Nợ', icon: '🚨', badge: stats.overdueCount },
            { id: 'logs', label: 'Nhật Ký Biến Động', icon: '📑' },
          ].map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id as any);
                  setSearchTerm(''); // reset search terms on tab switch
                }}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-200 text-left font-semibold text-sm cursor-pointer
                  ${isActive 
                    ? 'bg-emerald-800 text-white shadow-inner shadow-black/10' 
                    : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-base ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.id === 'reminders' ? 'bg-rose-550 text-white animate-pulse' : 'bg-emerald-700 text-emerald-100'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-emerald-800/40">
          <button 
            onClick={() => handleOpenAddModal()}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1 cursor-pointer"
          >
            <span>🍀 THÊM CÔNG VIỆC</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Dynamic Responsive header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu trigger + logo replacement */}
            <div className="md:hidden relative shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-200 transition-all cursor-pointer select-none active:scale-95 shadow-sm"
                title="Menu"
              >
                <Menu className="h-4.5 w-4.5 text-slate-600" />
              </button>

              {isMobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)}></div>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-150 py-2 z-50 animate-fadeIn text-slate-800">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">CHUYỂN MỤC</span>
                    </div>
                    {[
                      { id: 'dashboard', icon: '📊', label: 'Tổng Quan' },
                      { id: 'receivables', icon: '👥', label: 'Khách Nợ (Phải Thu)' },
                      { id: 'payables', icon: '🏦', label: 'Cty Nợ (Phải Trả)' },
                      { id: 'reminders', icon: '🚨', label: 'Nhắc Nợ & Báo Đỏ' },
                      { id: 'logs', icon: '📑', label: 'Nhật Ký Giao Dịch' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setCurrentTab(tab.id as any);
                          setSearchTerm('');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold transition-all cursor-pointer
                          ${currentTab === tab.id 
                            ? 'bg-emerald-50 text-emerald-800' 
                            : 'hover:bg-slate-50 text-slate-600'
                          }`}
                      >
                        <span className="text-sm shrink-0">{tab.icon}</span>
                        <span className="truncate">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-[11px] xs:text-xs sm:text-sm md:text-2xl font-black text-slate-800 tracking-tight uppercase truncate max-w-[170px] xs:max-w-[210px] sm:max-w-[340px] md:max-w-none">
                {currentTab === 'dashboard' ? getGreetingText() :
                 currentTab === 'receivables' ? 'THEO DÕI NỢ PHẢI THU 📈' :
                 currentTab === 'payables' ? 'DANH SÁCH NỢ PHẢI TRẢ 📉' :
                 currentTab === 'reminders' ? 'LỊCH NHẰC & BAO ĐỎ KHẢN CẤP 🚨' : 'SỔ NHẬT KÝ GIAO DỊCH VÀ THANH TOÁN 📝'}
              </h1>
              <p className="text-slate-500 text-[10px] sm:text-xs font-medium sm:block hidden">
                {stats.overdueCount > 0 
                  ? `Hôm nay có ${stats.overdueCount} khoản nợ cảnh báo đỏ cần xử lý dứt điểm.`
                  : "Hôm nay dòng tiền hiện tại cực kỳ ổn định & hanh thông."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            {/* Notification alert bell */}
            <div className="relative">
              <button 
                id="notification-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-emerald-750 hover:bg-slate-100 border border-slate-200 transition-all focus:outline-none cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {stats.overdueCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center animate-bounce text-white border border-white">
                    {stats.overdueCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden z-50 transition-all duration-300">
                  <div className="p-4 bg-red-50 text-red-100 font-bold text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-red-800">
                      <AlertCircle className="h-4 w-4 animate-pulse text-red-500" />
                      HẠN NỢ CẢNH BÁO ĐỎ ({stats.overdueCount})
                    </span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-650 font-bold text-xs cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {overdueDebts.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-400">
                        Không có khoản công nợ nào quá hạn tuyệt vời! 🎉
                      </div>
                    ) : (
                      overdueDebts.map(debt => {
                        const remaining = debt.amount - debt.paidAmount;
                        const { days } = getDaysOverdueOrRemaining(debt.dueDate);
                        return (
                          <div 
                            key={debt.id} 
                            className="p-3.5 hover:bg-rose-50/10 cursor-pointer transition-colors"
                            onClick={() => {
                              setCurrentTab(debt.type === 'receivable' ? 'receivables' : 'payables');
                              setSearchTerm(debt.debtorName);
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex justify-between text-xs font-bold text-gray-900">
                              <span className="truncate max-w-[150px]">{debt.debtorName}</span>
                              <span className="text-red-600 font-mono font-black">{formatVND(remaining)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                              <span>{debt.category}</span>
                              <span className="text-red-600 font-semibold bg-red-50 px-1.5 py-0.5 rounded text-[10px]">Trễ {days} ngày</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 text-center font-bold text-xs border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setCurrentTab('reminders');
                        setShowNotifications(false);
                      }}
                      className="text-emerald-700 hover:underline cursor-pointer"
                    >
                      Đến trung tâm lịch nhắc nợ →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Sync Status Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-202 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold select-none transition-all">
              <span className={`w-2 h-2 rounded-full ${
                syncStatus === 'loading' ? 'bg-amber-500 animate-pulse' :
                syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500'
              }`}></span>
              <span className="hidden xs:inline">
                {syncStatus === 'loading' ? 'Đang đồng bộ...' :
                 syncStatus === 'error' ? 'Lỗi kết nối' : 'Đã lưu đám mây'}
              </span>
              <span className="xs:hidden">
                {syncStatus === 'loading' ? 'Mây...' :
                 syncStatus === 'error' ? 'Lỗi' : 'Đã lưu'}
              </span>
            </div>

            {/* User Badge */}
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-black shadow-sm shrink-0">
              M
            </div>
          </div>
        </header>

        {/* Scrollable Content Workspace Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50 space-y-8">
        


        {/* --- VIEW 1: DASHBOARD --- */}
        {currentTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn" id="dashboard-view-panel">
            
            {/* CORE KPI BENTO GRID */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* CARD 1: TOTAL RECEIVABLE REMAINING */}
              <div id="stat-card-total-receivables" className="bg-white hover:shadow-md transition-shadow duration-350 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 -mr-5 -mt-5 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-200/50 animate-pulse">
                  <TrendingUp className="h-16 w-16" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 font-bold block">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Khoản nợ Phải Thu</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-gray-900 block font-mono">
                      {formatVND(stats.totalReceivableRemaining)}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 block">
                      Đã thu về: <strong className="text-emerald-700">{formatVND(stats.totalReceivablePaid)}</strong> trên tổng gốc {formatVND(stats.totalReceivable)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-emerald-700">
                  <span className="font-semibold">Thu hồi thành công {stats.totalReceivable > 0 ? Math.round((stats.totalReceivablePaid / stats.totalReceivable) * 100) : 0}%</span>
                  <button onClick={() => setCurrentTab('receivables')} className="hover:underline flex items-center">Xem bảng nợ <ChevronRight className="h-3 w-3 inline ml-0.5" /></button>
                </div>
              </div>

              {/* CARD 2: TOTAL PAYABLE REMAINING */}
              <div id="stat-card-total-payables" className="bg-white hover:shadow-md transition-shadow duration-350 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 -mr-5 -mt-5 bg-orange-50 rounded-full flex items-center justify-center text-orange-200/30">
                  <TrendingDown className="h-16 w-16" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-lg bg-orange-50 text-orange-700 font-bold block">
                      <TrendingDown className="h-5 w-5 animate-bounce" />
                    </span>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Khoản nợ Phải Trả</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-gray-900 block font-mono">
                      {formatVND(stats.totalPayableRemaining)}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 block">
                      Đã thanh toán: <strong className="text-orange-700">{formatVND(stats.totalPayablePaid)}</strong> trên tổng gốc {formatVND(stats.totalPayable)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-orange-700">
                  <span className="font-semibold">Đã hoàn trả dứt điểm {stats.totalPayable > 0 ? Math.round((stats.totalPayablePaid / stats.totalPayable) * 100) : 0}%</span>
                  <button onClick={() => setCurrentTab('payables')} className="hover:underline flex items-center">Xem phân công <ChevronRight className="h-3 w-3 inline ml-0.5" /></button>
                </div>
              </div>

              {/* CARD 3: CRITICAL OVERDUE POOL (BÁO ĐỎ !) */}
              <div id="stat-card-overdues" className="bg-white hover:shadow-md transition-shadow duration-350 rounded-2xl p-5 border border-red-100 bg-gradient-to-br from-red-50/20 to-white flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 -mr-5 -mt-5 bg-red-50 rounded-full flex items-center justify-center text-red-200/50">
                  <AlertCircle className="h-16 w-16 text-red-100" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-lg bg-red-100 text-red-700 font-bold block animate-pulse">
                      <AlertCircle className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-red-700/80 uppercase tracking-widest block font-bold leading-none">CẢNH BÁO QUÁ HẠN</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-red-600 block font-mono">
                      {stats.overdueCount} Khoản Nợ Đỏ
                    </span>
                    <span className="text-xs text-red-700/80 mt-1 block font-semibold">
                      Tổng tiền tắc nghẽn: {formatVND(stats.totalOverdueAmount)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-red-100 flex items-center justify-between text-xs text-red-700">
                  <span className="font-semibold animate-pulse block">🚨 Yêu cầu nhắc thanh toán gấp!</span>
                  <button onClick={() => setCurrentTab('reminders')} className="hover:underline flex items-center font-bold">Xem báo đỏ <ChevronRight className="h-3 w-3 inline ml-0.5" /></button>
                </div>
              </div>

              {/* CARD 4: EXPORT REPORT BLOCK */}
              <div id="stat-card-excel-export" className="bg-emerald-600 p-5 rounded-2xl shadow-lg flex flex-col justify-between text-center relative overflow-hidden text-white">
                <div className="absolute right-0 top-0 h-20 w-20 -mr-4 -mt-4 bg-emerald-500 rounded-full flex items-center justify-center opacity-30">
                  <Download className="h-10 w-10 text-emerald-100" />
                </div>
                <div>
                  <div className="text-emerald-100 text-[10px] font-bold uppercase tracking-wider mb-1">Báo cáo tháng 05/2026</div>
                  <div className="text-lg font-bold text-white mt-1 leading-tight">Xuất Dữ Liệu Công Nợ</div>
                  <p className="text-[11px] text-emerald-100/80 mt-2 font-medium">Trích xuất bảng nợ đầy đủ chi tiết dạng Excel/CSV.</p>
                </div>
                <div className="mt-4">
                  <button 
                    onClick={handleExportMonthlyExcel}
                    className="w-full bg-white text-emerald-700 hover:bg-emerald-50 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    📗 Xuất Báo Cáo Excel
                  </button>
                </div>
              </div>
            </div>

            {/* CHARTS CONTAINER (TWO COLUMNS GRID) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" id="charts-main-section">
              
              {/* COMPONENT 1: COMPARE RECEIVABLES VS PAYABLES BAR CHART */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm col-span-1 lg:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm tracking-wide">So Sánh Nợ Phải Thu & Phải Trả</h3>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-semibold">Tỷ số thanh khoản an toàn</span>
                </div>
                <div className="h-64 mt-4 text-xs font-medium">
                  {debts.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">Không có dữ liệu vẽ đồ thị.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={financeChartData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${(v/1000000).toFixed(0)}Tr`} />
                        <ChartTooltip 
                          formatter={(value: any) => [formatVND(Number(value)), '']}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                        />
                        <Legend />
                        <Bar dataKey="Đã Thu" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Chưa Thu" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Đã Trả" stackId="b" fill="#f87171" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Chưa Trả" stackId="b" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* COMPONENT 2: PIE CHART OF DEBT VARIATION */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm tracking-wide">Cơ Cấu Nợ Theo Danh Mục</h3>
                  <span className="text-[11px] bg-slate-100 text-gray-600 px-2 py-1 rounded-full font-mono">Dư nợ tồn lại</span>
                </div>
                <div className="h-64 mt-4 flex items-center justify-center relative">
                  {categoryChartData.length === 0 ? (
                    <div className="text-gray-400 text-xs">Không có dư nợ cần phân nhóm.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip formatter={(value: any) => formatVND(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {/* Central Text with Leaf Emoji */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl">🍀</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mai Công Việc</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1 overflow-y-auto max-h-32 divide-y divide-gray-50 pr-1">
                  {categoryChartData.map((d, index) => (
                    <div key={d.name} className="flex items-center justify-between text-xs py-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="text-gray-500 font-medium">{d.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatVND(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RECENT BAD DEBT WARNINGS & UPCOMING LISTS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              
              {/* LEFT: CRITICAL OVERDUE POOL */}
              <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between pb-4 border-b border-red-50">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <h3 className="font-bold text-red-900 text-sm tracking-wide">Trọng Điểm Quá Hạn Cảnh Báo Đỏ (Dọn Ngay!)</h3>
                  </div>
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 font-bold rounded-full">{overdueDebts.length} Khoản</span>
                </div>

                <div className="divide-y divide-gray-100 mt-4 overflow-y-auto max-h-80 pr-2">
                  {overdueDebts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      Tuyệt vời! Hoàn toàn không có khoản nợ nào cảnh báo đỏ quá hạn. Mọi mối quan hệ an toàn.
                    </div>
                  ) : (
                    overdueDebts.map(debt => {
                      const remaining = debt.amount - debt.paidAmount;
                      const { days } = getDaysOverdueOrRemaining(debt.dueDate);
                      return (
                        <div key={debt.id} className="py-3 flex items-center justify-between hover:bg-red-50/20 px-1 rounded-lg transition-colors">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900 text-xs sm:text-sm truncate">{debt.debtorName}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${debt.type === 'receivable' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-850'}`}>
                                {debt.type === 'receivable' ? 'Phải Thu' : 'Phải Trả'}
                              </span>
                            </div>
                            <div className="flex items-center text-[11px] text-gray-400 mt-0.5 space-x-3">
                              <span className="font-mono">{debt.category}</span>
                              <span className="text-red-500 font-medium">Hạn: {debt.dueDate}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end space-y-1">
                            <span className="text-xs sm:text-sm font-black text-red-600 font-mono">{formatVND(remaining)}</span>
                            <span className="text-[10px] bg-red-100 font-semibold text-red-700 rounded px-1 flex items-center gap-1 animate-pulse">
                              <AlertCircle className="h-3 w-3" /> Quá {days} Ngày
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {overdueDebts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => setCurrentTab('reminders')}
                      className="w-full text-center text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                    >
                      Kích hoạt trình nhắc AI & tin nhắn tự động tại đây →
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT: UPCOMING DEBTS IN NEXT 7 DAYS */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <Calendar className="h-4.5 w-4.5" />
                    <h3 className="font-bold text-gray-900 text-sm tracking-wide">Khoản Công Nợ Sắp Đến Hạn (7 ngày tới)</h3>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-100/50 px-2 py-0.5 font-bold rounded-full">{upcomingDebts.length} Khoản</span>
                </div>

                <div className="divide-y divide-gray-100 mt-4 overflow-y-auto max-h-80 pr-2">
                  {upcomingDebts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      Không có công nợ cận ngày đến hạn. Bạn đang quản lý tốt dòng thời gian!
                    </div>
                  ) : (
                    upcomingDebts.map(debt => {
                      const remaining = debt.amount - debt.paidAmount;
                      const { days } = getDaysOverdueOrRemaining(debt.dueDate);
                      return (
                        <div key={debt.id} className="py-3 flex items-center justify-between hover:bg-emerald-50/20 px-1 rounded-lg transition-colors">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900 text-xs sm:text-sm truncate">{debt.debtorName}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${debt.type === 'receivable' ? 'bg-emerald-100 text-emerald-850' : 'bg-orange-100 text-orange-900'}`}>
                                {debt.type === 'receivable' ? 'Phải thu' : 'Phải trả'}
                              </span>
                            </div>
                            <div className="flex items-center text-[11px] text-gray-500 mt-0.5 space-x-3">
                              <span className="font-medium text-emerald-700">{debt.category}</span>
                              <span className="text-gray-400">Hạn chót: {debt.dueDate}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end space-y-1">
                            <span className="text-xs sm:text-sm font-black text-gray-900 font-mono">{formatVND(remaining)}</span>
                            <span className="text-[10px] bg-emerald-50 font-bold text-emerald-700 rounded px-1.5 py-0.5">
                              {days === 0 ? ("Đến hạn hôm nay") : (`Còn ${days} ngày nữa`)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 text-center">
                  <span className="text-[11px] text-gray-400 block italic">Phân bố dòng tiền được điều tiết an toàn dựa trên hạn thu chi.</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* --- VIEW 2 & 3: MAIN LIST TABLES (RECEIVABLES & PAYABLES) --- */}
        {(currentTab === 'receivables' || currentTab === 'payables') && (
          <div className="space-y-6 animate-fadeIn" id="list-tables-panel">
            
            {/* SEARCH AND FILTER WORKSPACE HEADER */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:space-x-4">
              
              {/* Search String */}
              <div className="flex-1 min-w-0 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input 
                  type="text"
                  placeholder="Tìm đối tác, SĐT, ghi chú..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Advanced Controls Dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Status selection filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-400 font-bold uppercase hidden md:inline">Trạng thái:</span>
                  <select 
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-250 py-1.5 px-3 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="unpaid">Chưa thanh toán</option>
                    <option value="partially_paid">Thanh toán một phần</option>
                    <option value="paid">Đã tất toán xong</option>
                    <option value="overdue">⚠️ Quá hạn (báo đỏ)</option>
                  </select>
                </div>

                {/* Category selection filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-400 font-bold uppercase hidden md:inline">Phân Nhóm:</span>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-250 py-1.5 px-3 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Tất cả phân loại</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Reset filters */}
                {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                    title="Xóa bộ lọc"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}

                {/* Add debt button */}
                <button
                  id="tab-add-debt-btn"
                  onClick={() => handleOpenAddModal(currentTab === 'receivables' ? 'receivable' : 'payable')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 shadow-md rounded-lg flex items-center gap-1.5 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm {currentTab === 'receivables' ? 'Khoản Thu' : 'Khoản Chi'}
                </button>
              </div>

            </div>

            {/* DYNAMIC LIST VIEW AND ACTION CARDS */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              {filteredDebts.length === 0 ? (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <FileText className="h-10 w-10 text-slate-350" />
                  <p className="font-semibold text-sm">Không tìm thấy bản ghi công nợ nào phù hợp.</p>
                  <p className="text-xs">Bấm "Thêm" hoặc xóa bộ lọc tìm kiếm để khởi tạo hồ sơ.</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto min-w-full">
                  <table className="min-w-full divide-y divide-gray-150 align-middle text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-3 text-[11px] font-black uppercase text-gray-500 tracking-wider">Đối tác & Liên hệ</th>
                        <th className="px-6 py-3 text-[11px] font-black uppercase text-gray-500 tracking-wider">Phân loại & Chi tiết</th>
                        <th className="px-6 py-3 text-[11px] font-black uppercase text-gray-500 tracking-wider">Mốc thời gian</th>
                        <th className="px-6 py-3 text-[11px] font-black uppercase text-gray-500 tracking-wider">Giá trị nợ</th>
                        <th className="px-6 py-3 text-[11px] font-black uppercase text-gray-500 tracking-wider">Dư nợ còn lại</th>
                        <th className="px-6 py-3 text-[11px] font-black uppercase text-gray-500 tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-[11px] font-black uppercase text-gray-500 tracking-wider text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredDebts.map((debt) => {
                        const remaining = debt.amount - debt.paidAmount;
                        const overdue = isOverdue(debt);
                        const daysInfo = getDaysOverdueOrRemaining(debt.dueDate);

                        return (
                          <tr 
                            key={debt.id} 
                            className={`hover:bg-slate-50/50 transition-colors ${overdue ? 'bg-red-50/10' : ''}`}
                          >
                            {/* Debtor Info */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black border transition
                                  ${debt.type === 'receivable' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-orange-50 text-orange-700 border-orange-100'
                                  }`}
                                >
                                  {debt.debtorName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{debt.debtorName}</div>
                                  <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                                    <Phone className="h-3 w-3 text-slate-400" /> {debt.debtorPhone || "Chưa lưu SĐT"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category and Notes */}
                            <td className="px-6 py-4">
                              <div className="text-xs text-gray-700 font-bold">{debt.category}</div>
                              {debt.note ? (
                                <div className="text-[11px] text-gray-400 mt-1 max-w-xs truncate" title={debt.note}>
                                  {debt.note}
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-300 italic">Không có ghi chú</span>
                              )}
                            </td>

                            {/* Dates */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-xs text-gray-500">
                                Phát sinh: <span className="font-mono">{debt.startDate}</span>
                              </div>
                              <div className="text-xs mt-1">
                                Hạn nợ: <span className={`font-mono font-bold ${overdue ? 'text-red-650' : 'text-slate-600'}`}>{debt.dueDate}</span>
                              </div>
                            </td>

                            {/* Original Debt values */}
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                              <div className="text-gray-950 font-medium">Tổng: {formatVND(debt.amount)}</div>
                              <div className="text-emerald-700 mt-0.5">Đã trả: {formatVND(debt.paidAmount)}</div>
                            </td>

                            {/* Remaining balance + due indicators (báo đỏ) */}
                            <td className="px-6 py-4 whitespace-nowrap font-mono">
                              <div className={`text-sm font-black ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatVND(remaining)}
                              </div>
                              <div className="mt-1">
                                {overdue ? (
                                  <span className="text-[9px] bg-red-100 text-red-700 font-black px-1.5 py-0.5 rounded uppercase animate-pulse">
                                    Trễ {daysInfo.days} ngày 🚨
                                  </span>
                                ) : debt.status === 'paid' ? (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                    Hoàn tất
                                  </span>
                                ) : daysInfo.type === 'remaining' && daysInfo.days <= 7 ? (
                                  <span className="text-[9px] bg-orange-100 text-orange-700 font-black px-1.5 py-0.5 rounded">
                                    Còn {daysInfo.days} ngày ⏳
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-sky-50 text-sky-700 font-medium px-1.5  py-0.5 rounded">
                                    An toàn
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status label color codes */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black tracking-wide uppercase
                                ${debt.status === 'paid' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : debt.status === 'partially_paid'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {debt.status === 'paid' 
                                  ? 'Đã Tất Toán' 
                                  : debt.status === 'partially_paid'
                                    ? 'Trả một phần'
                                    : 'Chưa thanh toán'
                                }
                              </span>
                            </td>

                            {/* Action items inline */}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                              <div className="flex items-center justify-end space-x-2">
                                
                                {debt.status !== 'paid' && (
                                  <>
                                    {/* Record payment */}
                                    <button
                                      onClick={() => handleOpenPaymentModal(debt)}
                                      className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition flex items-center gap-1"
                                      title="Thanh toán"
                                    >
                                      <CheckCircle className="h-3 w-3" /> Thu/Trả nợ
                                    </button>

                                    {/* AI reminder composing */}
                                    <button
                                      onClick={() => handleOpenAIModal(debt)}
                                      className="p-1 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition flex items-center gap-1 font-bold shadow-sm"
                                      title="AI soạn tin nhắn nhắc nợ"
                                    >
                                      <Sparkles className="h-3 w-3 text-purple-600 animate-spin" /> AI Nhắc
                                    </button>
                                  </>
                                )}

                                {/* Edit Action */}
                                <button
                                  onClick={() => handleOpenEditModal(debt)}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>

                                {/* Delete action */}
                                <button
                                  onClick={() => handleDeleteDebt(debt.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                                  title="Xóa công nợ vĩnh viễn"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>

                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="block md:hidden divide-y divide-slate-100 bg-white">
                  {filteredDebts.map((debt) => {
                    const remaining = debt.amount - debt.paidAmount;
                    const overdue = isOverdue(debt);
                    const daysInfo = getDaysOverdueOrRemaining(debt.dueDate);
                    const isReceivable = debt.type === 'receivable';

                    return (
                      <div 
                        key={debt.id} 
                        className={`p-4 space-y-3.5 transition-colors ${overdue ? 'bg-red-50/10' : 'hover:bg-slate-50/50'}`}
                      >
                        {/* Avatar, Username and Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-black border transition shrink-0
                              ${isReceivable 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-orange-50 text-orange-700 border-orange-100'
                              }`}
                            >
                              {debt.debtorName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate">{debt.debtorName}</h4>
                              <p className="text-[11px] text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400 shrink-0" /> 
                                <span className="truncate">{debt.debtorPhone || "Chưa lưu SĐT"}</span>
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider
                              ${debt.status === 'paid' 
                                ? 'bg-emerald-100 text-emerald-850' 
                                : debt.status === 'partially_paid'
                                  ? 'bg-amber-100 text-amber-850'
                                  : overdue ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {debt.status === 'paid' 
                                ? 'Đã Tất Toán' 
                                : debt.status === 'partially_paid'
                                  ? 'Trả một phần'
                                  : overdue ? 'Quá hạn ⚠️' : 'Chưa Trả'
                              }
                            </span>
                            {overdue && (
                              <span className="text-[9px] font-bold text-red-650 bg-red-50 px-1 py-0.5 rounded font-mono shrink-0">
                                Trễ {daysInfo.days} ngày 🚨
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mid Row details & purpose */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] py-2 bg-slate-50/70 rounded-xl px-3 border border-slate-100/30">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Phân Phối:</span>
                            <span className="font-bold text-slate-700 block truncate">{debt.category}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Hạn chót:</span>
                            <span className={`font-mono font-bold block ${overdue ? 'text-red-700' : 'text-slate-600'}`}>{debt.dueDate}</span>
                          </div>
                          <div className="col-span-2 pt-1.5 mt-0.5 border-t border-slate-200/40 flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Phát sinh: {debt.startDate}</span>
                            <span>{!overdue && daysInfo.days !== undefined ? (daysInfo.days === 0 ? 'Đến hạn hôm nay' : `Còn ${daysInfo.days} ngày`) : ''}</span>
                          </div>
                        </div>

                        {/* Financial Amounts with visual hierarchy */}
                        <div className="grid grid-cols-3 gap-1 pt-1 text-center divide-x divide-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Gốc ban đầu:</span>
                            <span className="font-semibold text-xs text-slate-800 font-mono">{formatVND(debt.amount)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Đã góp thanh toán:</span>
                            <span className="font-semibold text-xs text-emerald-700 font-mono">{formatVND(debt.paidAmount)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 font-black block uppercase tracking-wider">Còn lại:</span>
                            <span className={`font-bold text-xs font-mono ${remaining > 0 ? (isReceivable ? 'text-emerald-800' : 'text-orange-800') : 'text-slate-400'}`}>
                              {formatVND(remaining)}
                            </span>
                          </div>
                        </div>

                        {/* Note block inside card */}
                        {debt.note && (
                          <div className="text-[11px] text-slate-500 bg-slate-100/40 rounded-lg p-2 italic">
                            💬 Ghi chú: {debt.note}
                          </div>
                        )}

                        {/* Touch-Friendly Action Controls Row */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 text-xs">
                          {debt.status !== 'paid' && (
                            <>
                              <button 
                                onClick={() => handleOpenAIModal(debt)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold border border-purple-100 transition shadow-sm"
                                title="AI soạn tin nhắn"
                              >
                                <Sparkles className="h-3 w-3 animate-pulse" />
                                <span>AI Nhắc</span>
                              </button>
                              <button 
                                onClick={() => handleOpenPaymentModal(debt)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md"
                                title="Trả bớt nợ"
                              >
                                <span>Thu/Trả</span>
                              </button>
                            </>
                          )}
                          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-150">
                            <button 
                              onClick={() => handleOpenEditModal(debt)}
                              className="p-2 hover:bg-slate-150 rounded-lg text-slate-500 hover:text-slate-850"
                              title="Sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-2 hover:bg-rose-50 rounded-lg text-red-500 hover:text-red-750"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          </div>
        )}

        {/* --- VIEW 4: DUE CALENDAR & REMINDER CENTRE (BAO DO!) --- */}
        {currentTab === 'reminders' && (
          <div className="space-y-6 animate-fadeIn" id="overdues-view-panel">
            
            <div className="bg-white p-5 rounded-2xl border border-red-50 shadow-sm">
              <h3 className="text-base font-black text-gray-900 tracking-wide flex items-center gap-1.5 border-b border-gray-100 pb-3">
                <AlertCircle className="h-5 w-5 text-red-500 animate-bounce" />
                Hệ thống Giám Sát Đến Hạn & Báo Đỏ Khẩn Cấp
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Hệ thống lọc tự động toàn bộ danh mục công nợ của <strong>"Mai Công Việc"</strong> và tự động gom nhóm những khoản nợ đã <strong>Quá Hạn (Báo đỏ rực rỡ)</strong> hoặc cực kỳ <strong>Sắp Đến Hạn (Thời gian dưới 7 ngày)</strong> để nhanh chóng thực hiện thu hồi tài chính.
              </p>
            </div>

            {/* SEPARATE OVERDUE (BÁO ĐỎ) */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-black text-red-600 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                QUÁ HẠN CHƯA TẤT TOÁN ({overdueDebts.length} KHOẢN CÔNG NỢ)
              </h4>

              {overdueDebts.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 text-xs">
                  Không có các khoản công nợ đỏ quá hạn. Công việc cực kỳ hanh thông! 🍀
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {overdueDebts.map(debt => {
                    const remaining = debt.amount - debt.paidAmount;
                    const { days } = getDaysOverdueOrRemaining(debt.dueDate);
                    return (
                      <div 
                        key={debt.id} 
                        className="bg-white rounded-2xl p-5 border-l-4 border-l-red-500 border-y border-r border-slate-100 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                              TRỄ {days} NGÀY
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${debt.type === 'receivable' ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-850'}`}>
                              {debt.type === 'receivable' ? 'KH Nợ Mình' : 'Mình Nợ KH'}
                            </span>
                          </div>
                          
                          <h5 className="font-bold text-base text-gray-900 mt-2">{debt.debtorName}</h5>
                          
                          <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                            <p className="flex justify-between"><span>Số điện thoại:</span> <strong className="text-slate-700 font-mono">{debt.debtorPhone}</strong></p>
                            <p className="flex justify-between"><span>Hạn thanh toán:</span> <strong className="text-slate-700 font-mono">{debt.dueDate}</strong></p>
                            <p className="flex justify-between"><span>Dư nợ gốc:</span> <strong className="text-slate-700 font-mono">{formatVND(debt.amount)}</strong></p>
                            <p className="flex justify-between"><span>Còn nợ chưa trả:</span> <strong className="text-red-600 font-black font-mono text-sm">{formatVND(remaining)}</strong></p>
                          </div>

                          {renderSimpleProgressBar(debt.paidAmount, debt.amount)}
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <button 
                            onClick={() => handleOpenAIModal(debt)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-3 rounded-lg shadow flex items-center gap-1.5 transition ml-auto"
                          >
                            <Sparkles className="h-3.5 w-3.5" /> AI Soạn Văn Bản Nhắc Nợ Tinh Tế
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SEPARATE APPROACHING DUE (SẮP ĐẾN HẠN) */}
            <div className="space-y-4 pt-4">
              <h4 className="text-xs uppercase tracking-widest font-black text-amber-600 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                CẬN HẠN TRONG 7 NGÀY TỚI ({upcomingDebts.length} KHOẢN CÔNG NỢ)
              </h4>

              {upcomingDebts.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 text-xs">
                  Không có công nợ nào cần thu chi gấp trong tuần tới. Dòng tiền an toàn.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {upcomingDebts.map(debt => {
                    const remaining = debt.amount - debt.paidAmount;
                    const { days } = getDaysOverdueOrRemaining(debt.dueDate);
                    return (
                      <div 
                        key={debt.id} 
                        className="bg-white rounded-2xl p-5 border-l-4 border-l-amber-500 border-y border-r border-slate-100 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {days === 0 ? ("Hạn chót ngày HÔM NAY") : (`Còn ${days} ngày nữa`)}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${debt.type === 'receivable' ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-850'}`}>
                              {debt.type === 'receivable' ? 'KH Nợ Mình' : 'Mình Nợ KH'}
                            </span>
                          </div>
                          
                          <h5 className="font-bold text-base text-gray-900 mt-2">{debt.debtorName}</h5>
                          
                          <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                            <p className="flex justify-between"><span>Số điện thoại:</span> <strong className="text-slate-700 font-mono">{debt.debtorPhone}</strong></p>
                            <p className="flex justify-between"><span>Hạn thanh toán:</span> <strong className="text-slate-705 font-mono">{debt.dueDate}</strong></p>
                            <p className="flex justify-between"><span>Còn nợ chưa trả:</span> <strong className="text-slate-900 font-bold font-mono">{formatVND(remaining)}</strong></p>
                          </div>

                          {renderSimpleProgressBar(debt.paidAmount, debt.amount)}
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <button 
                            onClick={() => handleOpenAIModal(debt)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition ml-auto"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-bounce" /> Lên mẫu tin nhắn
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- VIEW 5: ACTIVITY LOGS --- */}
        {currentTab === 'logs' && (
          <div className="space-y-6 animate-fadeIn" id="logs-view-panel">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm tracking-wide">Nhật Ký Giao Dịch & Biến Động Nợ</h3>
                <button 
                  onClick={() => {
                    if (window.confirm("Bạn muốn xóa sạch toàn bộ nhật ký sự kiện giao dịch này không?")) {
                      setLogs([]);
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold"
                >
                  Xóa sạch nhật ký giao dịch
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {logs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    Chưa có hoạt động biến động nào được lưu trữ.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 pl-4 space-y-6">
                    {logs.map((log) => {
                      let typeColor = 'bg-blue-100 text-blue-800';
                      if (log.type === 'create') typeColor = 'bg-emerald-100 text-emerald-800';
                      if (log.type === 'payment') typeColor = 'bg-purple-100 text-purple-800';
                      if (log.type === 'delete') typeColor = 'bg-red-100 text-red-800';

                      return (
                        <div key={log.id} className="relative">
                          {/* Dot marker */}
                          <span className="absolute -left-6.5 top-1 bg-white border-2 border-slate-350 h-3.5 w-3.5 rounded-full inline-block"></span>
                          <div>
                            <span className="text-[10px] font-mono text-gray-400 block">{log.timestamp}</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${typeColor}`}>
                                {log.type}
                              </span>
                              <p className="text-xs font-semibold text-gray-800">{log.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* List of direct payments */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mt-6">
              <h3 className="font-bold text-gray-900 text-sm tracking-wide border-b pb-3 border-gray-100">Chi Tiết Lịch Sử Trả Tiền</h3>
              <div className="mt-4">
                {payments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Chưa có bản ghi thanh toán tiền trực tiếp nào.</div>
                ) : (
                  <>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-150 align-middle text-left font-mono text-xs">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-4 py-2 font-bold text-gray-500">Mã GD</th>
                            <th className="px-4 py-2 font-bold text-gray-550">Người trả nợ</th>
                            <th className="px-4 py-2 font-bold text-gray-550">Phương thức</th>
                            <th className="px-4 py-2 font-bold text-gray-550">Ngày trả</th>
                            <th className="px-4 py-2 font-bold text-gray-550">Số tiền trả</th>
                            <th className="px-4 py-2 font-bold text-gray-550 text-right">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {payments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 text-slate-400">{p.id}</td>
                              <td className="px-4 py-2.5 font-sans font-bold text-gray-900">{p.debtorName}</td>
                              <td className="px-4 py-2.5">{p.paymentMethod}</td>
                              <td className="px-4 py-2.5">{p.paymentDate}</td>
                              <td className="px-4 py-2.5 text-emerald-750 font-bold">{formatVND(p.amount)}</td>
                              <td className="px-4 py-2.5 text-right font-sans text-gray-400 italic max-w-xs truncate" title={p.note}>{p.note || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View */}
                    <div className="block md:hidden divide-y divide-slate-100 font-sans text-xs">
                      {payments.map(p => (
                        <div key={p.id} className="py-3 space-y-2 hover:bg-slate-50/50 px-1 rounded-lg transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[9px] font-mono text-slate-400 block">GD: {p.id}</span>
                              <span className="font-bold text-gray-900 text-sm">{p.debtorName}</span>
                            </div>
                            <span className="text-emerald-750 font-extrabold text-sm font-mono shrink-0">{formatVND(p.amount)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold font-mono text-slate-600 shrink-0">{p.paymentMethod}</span>
                              <span className="text-slate-400 font-mono shrink-0">{p.paymentDate}</span>
                            </div>
                            {p.note && (
                              <span className="text-slate-400 italic truncate max-w-[130px]" title={p.note}>
                                💬 {p.note}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {/* FOOTER METRICS AND CREDITS */}
        <footer className="border-t border-slate-200 text-slate-450 text-xs py-10 mt-16" id="app-footer-credit">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-2.5">
            <p className="font-bold text-emerald-800 tracking-tight">
              🍀 Ứng Dụng Quản Lý Công Nợ "Mai Công Việc" — Người Bạn Đồng Hành Đắc Lực Của Bạn 🍀
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-md mx-auto">
              Hệ thống hỗ trợ quản trị, lên lịch thanh toán, báo cáo Excel và AI khôn khéo tinh tế. Hoạt động an toàn, dữ liệu độc bản lưu giữ tức thì trên thiết bị của bạn.
            </p>
            {/* Footer details removed */}
          </div>
        </footer>

        </div>
      </main>

      {/* --- MODAL 1: ADD OR EDIT DEBT FORM --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true" id="add-debt-modal">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsAddModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-50 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100">
              
              <div className="bg-emerald-700 px-6 py-4 text-white flex justify-between items-center">
                <h3 className="text-base font-bold tracking-tight">
                  {editingDebt ? 'Cập Nhật Hồ Sơ Công Nợ 🍀' : 'Tạo hồ sơ'}
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-emerald-100 hover:text-white transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDebt} className="p-6 space-y-4">
                
                {/* DEBT TYPE PICKER */}
                <div>
                  <label className="block text-xs font-black text-slate-450 uppercase mb-2">Loại công nợ</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormType('receivable')}
                      className={`py-2.5 px-4 text-xs font-black rounded-xl border text-center transition
                        ${formType === 'receivable' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-10 animate-pulse' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      👍 Khách nợ
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('payable')}
                      className={`py-2.5 px-4 text-xs font-black rounded-xl border text-center transition
                        ${formType === 'payable' 
                          ? 'bg-orange-50/70 text-orange-800 border-orange-400 ring-2 ring-orange-5' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      👎 Cty nợ
                    </button>
                  </div>
                </div>

                {/* Debtor Name */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Tên đối tác *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn Hải, Đại Lý Sông Đà"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Contact options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-1">Thư điện tử (Email)</label>
                    <input
                      type="email"
                      placeholder="hainguyen@doitac.vn"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Category Picker */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Phân Nhóm Mục Đích</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Amount options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-1">Tổng Số Tiền Nợ Hợp Đồng *</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        placeholder="Số tiền gốc VND"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        className="w-full text-sm font-mono border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 font-bold">₫</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-1">Đã trả trước đợt đầu</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Mặc định là 0"
                        value={formPaidAmount}
                        onChange={(e) => setFormPaidAmount(e.target.value)}
                        disabled={!!editingDebt} // Disable paid update inside main create window to avoid conflict, update via Thu/Chi payment action button
                        className="w-full text-sm font-mono border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 text-slate-500"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 font-bold">₫</span>
                    </div>
                    {editingDebt && <span className="text-[10px] text-gray-400 block mt-1">Cập nhật lịch sử nợ bằng nút 'Thanh Toán' ngoài bảng</span>}
                  </div>
                </div>

                {/* Timeline dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-1">Ngày ghi nhận nợ</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-1 text-red-650">Hạn chót thanh toán *</label>
                    <input
                      type="date"
                      required
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full text-sm border border-red-200 bg-red-50/5 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-red-900 font-black"
                    />
                  </div>
                </div>

                {/* Additional details */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Mô tả / Chi tiết cam kết</label>
                  <textarea
                    rows={2}
                    placeholder="Thông tin hàng hóa, lịch sử giao hẹn..."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Buttons controls */}
                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-md"
                  >
                    {editingDebt ? 'LƯU THAY ĐỔI' : 'Tạo'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: GHI NHẬN THANH TOÁN (PAYMENT RECORD) --- */}
      {isPaymentModalOpen && selectedDebtForPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true" id="record-payment-modal">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsPaymentModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-50 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-slate-105">
              
              <div className="bg-emerald-800 px-6 py-4 text-white flex justify-between items-center">
                <h3 className="text-base font-bold tracking-tight">
                  Thu Hồi / Chi Trả Tiền Công Nợ 💰
                </h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-emerald-100 hover:text-white transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs">
                <p>Đối tượng giao dịch: <strong>{selectedDebtForPayment.debtorName}</strong></p>
                <p className="mt-1">Dư nợ còn lại hiện tại: <strong className="text-sm font-mono font-black">{formatVND(selectedDebtForPayment.amount - selectedDebtForPayment.paidAmount)}</strong></p>
              </div>

              <form onSubmit={handleSavePayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Số tiền thanh toán đợt này *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      placeholder="Nhập số tiền"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full text-base font-mono font-black border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 font-bold">₫</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Không thể vượt quá dư nợ còn lại của tối tác.</span>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Phương thức thanh toán</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Chuyển khoản', 'Tiền mặt', 'Ví điện tử'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`text-xs py-2 px-1 border rounded-lg text-center transition
                          ${paymentMethod === method 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' 
                            : 'bg-white border-slate-200 text-slate-500'}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Ghi chú thanh toán</label>
                  <textarea
                    rows={2}
                    placeholder="Chuyển khoản đợt 2, thanh toán trực tiếp tại xưởng lẻ..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-3 py-2 text-xs font-bold text-slate-500"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    XÁC NHẬN GHI NHẬN
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: DESIGNED GEMINI AI REMINDER MAKER --- */}
      {isAIModalOpen && selectedDebtForAI && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true" id="ai-reminder-modal">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsAIModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative z-50 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-slate-100">
              
              <div className="bg-purple-800 px-6 py-4 text-white flex justify-between items-center bg-gradient-to-r from-purple-800 to-purple-700">
                <h3 className="text-base font-bold tracking-tight flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 animate-spin" />
                  Trình Nhắc Nợ Thông Minh Bằng AI 🍀
                </h3>
                <button onClick={() => setIsAIModalOpen(false)} className="text-purple-100 hover:text-white transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 bg-purple-50 border-b border-purple-100 text-xs text-purple-900">
                <span className="font-bold">Đối tượng tiếp nhận tin nhắn: </span> 
                {selectedDebtForAI.debtorName} ({selectedDebtForAI.debtorPhone}) — Số nợ tồn: <strong>{formatVND(selectedDebtForAI.amount - selectedDebtForAI.paidAmount)}</strong> (Hạn chót: {selectedDebtForAI.dueDate})
              </div>

              <div className="p-6 space-y-4">
                
                {/* Tone Selectors */}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Chọn Giọng Điệu Đoạn Đối Thoại</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'polite', label: '🤝 Lịch Sự Trọng Thị', desc: 'Dành cho đối tác lớn' },
                      { id: 'friendly', label: '😊 Nhẹ Nhàng Thân Thiết', desc: 'Dành cho đồng nghiệp/bạn bè' },
                      { id: 'urgent', label: '⚠️ Khẩn Cấp Báo Đỏ', desc: 'Nhấn mạnh quá hạn phạt' },
                    ].map(tone => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setAiTone(tone.id as any)}
                        className={`p-2.5 text-xs border rounded-xl flex flex-col items-center justify-between text-center transition
                          ${aiTone === tone.id 
                            ? 'bg-purple-100 border-purple-500 text-purple-800 font-bold ring-2 ring-purple-5' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        <span className="font-black block">{tone.label}</span>
                        <span className="text-[9px] text-gray-400 font-medium block mt-1">{tone.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional instructions */}
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">Ghi chú bối cảnh phụ trợ (Không bắt buộc)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giảm 5% nếu trả gấp, có hỗ trợ trả góp qua ViettelPay..."
                    value={aiCustomNote}
                    onChange={(e) => setAiCustomNote(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                  />
                </div>

                {/* Button Action Trigger */}
                <div>
                  <button
                    type="button"
                    onClick={generateAIReminder}
                    disabled={isAiLoading}
                    className="w-full py-3 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-300 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                  >
                    {isAiLoading ? (
                      <span className="flex items-center gap-1">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        AI Đang Nhào Nặn Từ Ngữ Tinh Tế...
                      </span>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-purple-200" />
                        Tự Động Tạo Văn Bản Nhắc Nợ Bằng AI
                      </>
                    )}
                  </button>
                  {aiStatus && <p className="text-[10px] text-purple-750 text-center mt-2.5 font-bold italic">{aiStatus}</p>}
                </div>

                {/* Draft Output Box */}
                {aiPromptResponse && (
                  <div className="space-y-2 mt-4 animate-fadeIn">
                    <div className="flex justify-between items-center text-xs text-gray-400 uppercase font-black">
                      <span>Nội dung đã hoàn chỉnh:</span>
                      <button
                        onClick={handleCopyAIResponse}
                        className="text-purple-700 hover:underline hover:text-purple-800 transition flex items-center gap-1 font-bold lowercase"
                      >
                        {aiCopied ? <span className="text-emerald-700 font-black">Coppy thành công ! ✔</span> : 'Sao chép một chạm 📋'}
                      </button>
                    </div>
                    
                    <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-all border border-slate-800 max-h-60 overflow-y-auto shadow-inner">
                      {aiPromptResponse}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border text-[10px] text-gray-400 flex items-start gap-1.5 leading-snug">
                      <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        Lời khuyên của Mai Công Việc: Ấn sao chép và trực tiếp gửi qua Zalo/Viber thương thảo để khách nợ không cảm thấy bị áp lực, tăng hòa khí và nhận khoản giải ngân sớm nhất!
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons controls */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAIModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500"
                  >
                    ĐÓNG LẠI
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- EXCEL MONTHLY REPORT SUCCESS NOTIFICATION MODAL --- */}
      {isExcelSuccessOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="excel-success-modal">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsExcelSuccessOpen(false)}></div>
            
            <div className="relative z-50 inline-block align-middle bg-white rounded-2xl p-6 text-left overflow-hidden shadow-2xl transform transition-all max-w-sm w-full border border-slate-150">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <FileSpreadsheet className="h-6 w-6 animate-bounce" />
                </div>
                <h3 className="text-base font-black text-gray-900">Báo Cáo Xuất Thành Công!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bảng báo cáo tháng Excel/CSV của "Mai Công Việc" đã được kết xuất và tải xuống trình duyệt của bạn thành công:
                </p>
                <p className="text-[11px] font-mono bg-slate-100 py-1.5 px-3 rounded-lg text-slate-700 max-w-full truncate font-bold">
                  {exportedFilename}
                </p>
                <p className="text-[10px] text-gray-400">
                  Phù hợp định dạng Excel quốc tế, mở trực tiếp với hỗ trợ tiếng Việt có dấu.
                </p>
                
                <button
                  onClick={() => setIsExcelSuccessOpen(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                >
                  RẤT TUYỆT VỜI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
