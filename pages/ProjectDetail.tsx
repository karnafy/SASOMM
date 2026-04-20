import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen, Project, Currency, Supplier, MainCategory, MAIN_CATEGORIES } from '@monn/shared';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, radii, spacing } from '../theme';
import { GradientHeader } from '../components/ui/GradientHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { DarkCard } from '../components/ui/DarkCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { TransactionRow } from '../components/ui/TransactionRow';

interface ProjectDetailProps {
  onNavigate: (screen: AppScreen, id?: string, scan?: boolean, txType?: 'expense' | 'income') => void;
  goBack: () => void;
  project: Project;
  suppliers: Supplier[];
  onUpdateBudget: (projectId: string, newBudget: number) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onUpdateProject: (project: Project) => Promise<void>;
  onAddNote: (projectId: string, note: string, images?: string[]) => Promise<void>;
  globalCurrency: Currency;
  convertAmount: (amount: number, from?: Currency, to?: Currency) => number;
}

const currencySymbols: Record<Currency, string> = {
  ILS: '\u20AA',
  USD: '$',
  EUR: '\u20AC',
};

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const CATEGORY_ICONS: Record<string, IconName> = {
  projects: 'work',
  personal: 'person',
  other: 'category',
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({
  onNavigate,
  goBack,
  project,
  suppliers = [],
  onUpdateBudget,
  onDeleteProject,
  onUpdateProject,
  onAddNote,
  globalCurrency,
  convertAmount,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [tempBudget, setTempBudget] = useState(
    convertAmount(project.budget).toFixed(0)
  );
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openImagePreview = (images: string[], startIndex = 0) => {
    if (!images?.length) return;
    setPreviewImages(images);
    setPreviewIndex(startIndex);
  };

  const totalIncome = (project.incomes || []).reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = project.spent;
  const remaining = project.budget - totalExpenses;
  const percentUsed =
    project.budget > 0 ? Math.round((totalExpenses / project.budget) * 100) : 0;

  useEffect(() => {
    setTempBudget(convertAmount(project.budget).toFixed(0));
  }, [project.budget, globalCurrency, convertAmount]);

  // --- Computed data ---

  const allActivities = useMemo(() => {
    const expenses = project.expenses.map((e) => ({ ...e, type: 'expense' as const }));
    const incomes = (project.incomes || []).map((i) => ({ ...i, type: 'income' as const }));
    const history = (project.history || []).map((h) => ({ ...h }));

    const combined = [...expenses, ...incomes, ...history];
    const seenIds = new Set<string>();
    const unique = combined.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });

    return unique.sort((a, b) => {
      const parseDate = (item: typeof a) => {
        // Prefer created_at for accurate sorting (includes time component)
        const item_any = item as any;
        if (item_any.created_at) {
          const caDate = new Date(item_any.created_at);
          if (!isNaN(caDate.getTime())) return caDate.getTime();
        }

        const dStr = item.date;
        if (!dStr) return 0;

        // ISO timestamp (e.g. "2026-03-15T15:09:13.293+00:00")
        if (dStr.includes('T')) {
          const isoDate = new Date(dStr);
          if (!isNaN(isoDate.getTime())) return isoDate.getTime();
        }

        // DD.MM.YYYY format
        const dotParts = dStr.split('.');
        if (dotParts.length === 3) {
          const [day, month, year] = dotParts.map(Number);
          return new Date(year, month - 1, day).getTime();
        }

        // YYYY-MM-DD format
        const isoDate = new Date(dStr);
        if (!isNaN(isoDate.getTime())) return isoDate.getTime();

        return 0;
      };
      return parseDate(b) - parseDate(a);
    });
  }, [project.expenses, project.incomes, project.history]);

  const displayedActivities = showAllActivities
    ? allActivities
    : allActivities.slice(0, 5);

  const linkedSuppliers = useMemo(() => {
    const supplierIds = new Set<string>();
    project.expenses.forEach((e) => e.supplierId && supplierIds.add(e.supplierId));
    (project.incomes || []).forEach((i) => i.supplierId && supplierIds.add(i.supplierId));
    return suppliers.filter((s) => supplierIds.has(s.id));
  }, [project.expenses, project.incomes, suppliers]);

  // Calculate report data
  const reportData = useMemo(() => {
    const expensesBySupplier: Record<string, { name: string; total: number; count: number }> = {};
    const incomesBySupplier: Record<string, { name: string; total: number; count: number }> = {};
    const expensesByDate: Record<string, number> = {};
    const incomesByDate: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    project.expenses.forEach((e) => {
      const supplierName = e.supplierId
        ? suppliers.find((s) => s.id === e.supplierId)?.name || 'לא ידוע'
        : 'ללא ספק';
      if (!expensesBySupplier[supplierName])
        expensesBySupplier[supplierName] = { name: supplierName, total: 0, count: 0 };
      expensesBySupplier[supplierName].total += e.amount;
      expensesBySupplier[supplierName].count++;

      expensesByDate[e.date] = (expensesByDate[e.date] || 0) + e.amount;

      const cat = e.tag || 'כללי';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + e.amount;
    });

    (project.incomes || []).forEach((i) => {
      const supplierName = i.supplierId
        ? suppliers.find((s) => s.id === i.supplierId)?.name || 'לא ידוע'
        : 'ללא ספק';
      if (!incomesBySupplier[supplierName])
        incomesBySupplier[supplierName] = { name: supplierName, total: 0, count: 0 };
      incomesBySupplier[supplierName].total += i.amount;
      incomesBySupplier[supplierName].count++;

      incomesByDate[i.date] = (incomesByDate[i.date] || 0) + i.amount;
    });

    const notes = (project.history || []).filter((h) => h.type === 'note');

    return {
      expensesBySupplier: Object.values(expensesBySupplier).sort((a, b) => b.total - a.total),
      incomesBySupplier: Object.values(incomesBySupplier).sort((a, b) => b.total - a.total),
      expensesByDate,
      incomesByDate,
      expensesByCategory: Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]),
      notes,
      totalExpenses: project.spent,
      totalIncome: totalIncome,
      balance: remaining,
      budget: project.budget,
    };
  }, [project, suppliers, totalIncome, remaining]);

  // --- Handlers ---

  const handleSaveBudget = () => {
    if (onUpdateBudget) {
      const newBudget = parseFloat(tempBudget) || 0;
      onUpdateBudget(project.id, newBudget);
    }
    setIsEditingBudget(false);
  };

  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return null;
    return suppliers.find((s) => s.id === supplierId)?.name || null;
  };

  const handleAddNote = () => {
    if ((noteText.trim() || noteImages.length > 0) && onAddNote) {
      onAddNote(project.id, noteText.trim(), noteImages.length > 0 ? noteImages : undefined);
      setNoteText('');
      setNoteImages([]);
      setIsAddingNote(false);
    }
  };

  const handleAddNoteImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('שגיאה', 'נדרשת הרשאה לגישה לגלריה');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets
        .filter((asset) => asset.base64)
        .map((asset) => `data:image/jpeg;base64,${asset.base64}`);
      setNoteImages((prev) => [...prev, ...newImages]);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const BOM = '\uFEFF';
      const date = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');

      let csv = `דוח פרויקט: ${project.name}\n`;
      csv += `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}\n\n`;

      csv += `=== סיכום כללי ===\n`;
      csv += `תקציב,${project.budget}\n`;
      csv += `סה"כ הוצאות,${project.spent}\n`;
      csv += `סה"כ הכנסות,${totalIncome}\n`;
      csv += `יתרה,${remaining}\n`;
      csv += `אחוז ניצול,${percentUsed}%\n\n`;

      csv += `=== הוצאות לפי ספק ===\n`;
      csv += `ספק,סכום,מספר עסקאות\n`;
      reportData.expensesBySupplier.forEach((s) => {
        csv += `"${s.name}",${s.total},${s.count}\n`;
      });
      csv += `\n`;

      csv += `=== הכנסות לפי ספק ===\n`;
      csv += `ספק,סכום,מספר עסקאות\n`;
      reportData.incomesBySupplier.forEach((s) => {
        csv += `"${s.name}",${s.total},${s.count}\n`;
      });
      csv += `\n`;

      csv += `=== הוצאות לפי קטגוריה ===\n`;
      csv += `קטגוריה,סכום\n`;
      reportData.expensesByCategory.forEach(([cat, amount]) => {
        csv += `"${cat}",${amount}\n`;
      });
      csv += `\n`;

      csv += `=== כל העסקאות ===\n`;
      csv += `תאריך,סוג,תיאור,קטגוריה,סכום,ספק,שיטת תשלום\n`;
      project.expenses.forEach((e) => {
        const supplierName = e.supplierId
          ? suppliers.find((s) => s.id === e.supplierId)?.name || ''
          : '';
        csv += `"${e.date}","הוצאה","${e.title}","${e.tag}",${e.amount},"${supplierName}","${e.paymentMethod || ''}"\n`;
      });
      (project.incomes || []).forEach((i) => {
        const supplierName = i.supplierId
          ? suppliers.find((s) => s.id === i.supplierId)?.name || ''
          : '';
        csv += `"${i.date}","הכנסה","${i.title}","${i.tag}",${i.amount},"${supplierName}","${i.paymentMethod || ''}"\n`;
      });
      csv += `\n`;

      if (reportData.notes.length > 0) {
        csv += `=== הערות ===\n`;
        csv += `תאריך,הערה\n`;
        reportData.notes.forEach((n) => {
          csv += `"${n.date}","${n.title}"\n`;
        });
      }

      const fileName = `דוח_${project.name.replace(/[/\\?%*:|"<>]/g, '_')}_${date}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const file = new File(Paths.cache, fileName);
        await file.write(BOM + csv);
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'text/csv',
            dialogTitle: 'שיתוף דוח CSV',
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          Alert.alert('שגיאה', 'שיתוף קבצים אינו זמין במכשיר זה');
        }
      }

      setShowReportModal(false);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('שגיאה', 'שגיאה בייצוא הדוח');
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const maxExpense = Math.max(...reportData.expensesByCategory.map(([, v]) => v), 1);

      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <title>דוח פרויקט - ${project.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; background: #f5f5f5; color: #333; }
            .report { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #00D9D9; }
            .header h1 { color: #00D9D9; font-size: 28px; margin-bottom: 8px; }
            .header p { color: #666; font-size: 14px; }
            .summary { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 30px; flex-wrap: wrap; }
            .summary-card { flex: 1; min-width: 150px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 12px; text-align: center; }
            .summary-card.budget { border-top: 4px solid #00D9D9; }
            .summary-card.expense { border-top: 4px solid #ef4444; }
            .summary-card.income { border-top: 4px solid #22c55e; }
            .summary-card.balance { border-top: 4px solid #3b82f6; }
            .summary-card label { font-size: 12px; color: #666; display: block; margin-bottom: 4px; }
            .summary-card .value { font-size: 24px; font-weight: bold; }
            .summary-card.expense .value { color: #ef4444; }
            .summary-card.income .value { color: #22c55e; }
            .summary-card.balance .value { color: ${remaining >= 0 ? '#22c55e' : '#ef4444'}; }
            .section { margin-bottom: 30px; }
            .section h2 { font-size: 18px; color: #333; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
            .progress-container { background: #e9ecef; border-radius: 10px; height: 24px; overflow: hidden; margin-bottom: 8px; }
            .progress-bar { height: 100%; background: linear-gradient(90deg, #00D9D9, #0891B2); border-radius: 10px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: white; font-size: 12px; font-weight: bold; }
            .chart-bar { display: flex; align-items: center; margin-bottom: 12px; }
            .chart-bar .label { width: 120px; font-size: 13px; color: #333; }
            .chart-bar .bar-container { flex: 1; height: 24px; background: #e9ecef; border-radius: 6px; overflow: hidden; margin: 0 12px; }
            .chart-bar .bar { height: 100%; background: linear-gradient(90deg, #00D9D9, #0891B2); border-radius: 6px; }
            .chart-bar .value { width: 80px; text-align: left; font-weight: bold; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { padding: 12px; text-align: right; border-bottom: 1px solid #eee; font-size: 13px; }
            th { background: #f8f9fa; font-weight: 600; color: #333; }
            .expense-row { color: #ef4444; }
            .income-row { color: #22c55e; }
            .notes-section { background: #fffbeb; padding: 20px; border-radius: 12px; border: 1px solid #fcd34d; }
            .note-item { padding: 12px 0; border-bottom: 1px dashed #fcd34d; }
            .note-item:last-child { border-bottom: none; }
            .note-date { font-size: 11px; color: #666; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <h1>דוח פרויקט: ${project.name}</h1>
              <p>קטגוריה: ${project.category} | תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}</p>
            </div>

            <div class="summary">
              <div class="summary-card budget">
                <label>תקציב</label>
                <div class="value">${currencySymbols[globalCurrency]}${convertAmount(project.budget).toLocaleString()}</div>
              </div>
              <div class="summary-card expense">
                <label>הוצאות</label>
                <div class="value">${currencySymbols[globalCurrency]}${convertAmount(project.spent).toLocaleString()}</div>
              </div>
              <div class="summary-card income">
                <label>הכנסות</label>
                <div class="value">${currencySymbols[globalCurrency]}${convertAmount(totalIncome).toLocaleString()}</div>
              </div>
              <div class="summary-card balance">
                <label>יתרה</label>
                <div class="value">${remaining < 0 ? '-' : ''}${currencySymbols[globalCurrency]}${convertAmount(Math.abs(remaining)).toLocaleString()}</div>
              </div>
            </div>

            <div class="section">
              <h2>התקדמות תקציב</h2>
              <div class="progress-container">
                <div class="progress-bar" style="width: ${Math.min(100, percentUsed)}%">${percentUsed}%</div>
              </div>
              <p style="font-size: 13px; color: #666;">נוצלו ${percentUsed}% מהתקציב</p>
            </div>

            ${
              reportData.expensesByCategory.length > 0
                ? `
            <div class="section">
              <h2>הוצאות לפי קטגוריה</h2>
              ${reportData.expensesByCategory
                .map(
                  ([cat, amount]) => `
                <div class="chart-bar">
                  <span class="label">${cat}</span>
                  <div class="bar-container">
                    <div class="bar" style="width: ${(amount / maxExpense) * 100}%"></div>
                  </div>
                  <span class="value">${currencySymbols[globalCurrency]}${convertAmount(amount).toLocaleString()}</span>
                </div>
              `
                )
                .join('')}
            </div>
            `
                : ''
            }

            ${
              reportData.expensesBySupplier.length > 0
                ? `
            <div class="section">
              <h2>הוצאות לפי ספק</h2>
              <table>
                <thead><tr><th>ספק</th><th>סכום</th><th>עסקאות</th></tr></thead>
                <tbody>
                  ${reportData.expensesBySupplier
                    .map(
                      (s) => `
                    <tr>
                      <td>${s.name}</td>
                      <td class="expense-row">${currencySymbols[globalCurrency]}${convertAmount(s.total).toLocaleString()}</td>
                      <td>${s.count}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
            `
                : ''
            }

            ${
              reportData.incomesBySupplier.length > 0
                ? `
            <div class="section">
              <h2>הכנסות לפי ספק</h2>
              <table>
                <thead><tr><th>ספק</th><th>סכום</th><th>עסקאות</th></tr></thead>
                <tbody>
                  ${reportData.incomesBySupplier
                    .map(
                      (s) => `
                    <tr>
                      <td>${s.name}</td>
                      <td class="income-row">${currencySymbols[globalCurrency]}${convertAmount(s.total).toLocaleString()}</td>
                      <td>${s.count}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
            `
                : ''
            }

            <div class="section">
              <h2>פירוט עסקאות</h2>
              <table>
                <thead><tr><th>תאריך</th><th>סוג</th><th>תיאור</th><th>קטגוריה</th><th>ספק</th><th>סכום</th></tr></thead>
                <tbody>
                  ${project.expenses
                    .map(
                      (e) => `
                    <tr>
                      <td>${e.date}</td>
                      <td>הוצאה</td>
                      <td>${e.title}</td>
                      <td>${e.tag}</td>
                      <td>${e.supplierId ? suppliers.find((s) => s.id === e.supplierId)?.name || '-' : '-'}</td>
                      <td class="expense-row">-${currencySymbols[globalCurrency]}${convertAmount(e.amount).toLocaleString()}</td>
                    </tr>
                  `
                    )
                    .join('')}
                  ${(project.incomes || [])
                    .map(
                      (i) => `
                    <tr>
                      <td>${i.date}</td>
                      <td>הכנסה</td>
                      <td>${i.title}</td>
                      <td>${i.tag}</td>
                      <td>${i.supplierId ? suppliers.find((s) => s.id === i.supplierId)?.name || '-' : '-'}</td>
                      <td class="income-row">+${currencySymbols[globalCurrency]}${convertAmount(i.amount).toLocaleString()}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>

            ${
              reportData.notes.length > 0
                ? `
            <div class="section">
              <h2>הערות</h2>
              <div class="notes-section">
                ${reportData.notes
                  .map(
                    (n) => `
                  <div class="note-item">
                    <div class="note-date">${n.date}</div>
                    <div>${n.title}</div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
            `
                : ''
            }

            <div class="footer">
              <p>דוח זה הופק על ידי SASOMM - ניהול פיננסי חכם</p>
            </div>
          </div>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (!win) {
          Alert.alert('שגיאה', 'חוסם חלונות קופצים מונע את פתיחת הדוח');
          return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
        setTimeout(() => {
          try {
            win.focus();
            win.print();
          } catch {
            // user can print manually
          }
        }, 500);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'שיתוף דוח PDF',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('שגיאה', 'שיתוף קבצים אינו זמין במכשיר זה');
        }
      }

      setShowReportModal(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('שגיאה', 'שגיאה בייצוא הדוח');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'מחיקה',
      `האם אתה בטוח שברצונך למחוק את הפרויקט "${project.name}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => onDeleteProject?.(project.id),
        },
      ]
    );
  };

  const handleChangeCategory = (newCategory: MainCategory) => {
    if (onUpdateProject && newCategory !== project.mainCategory) {
      onUpdateProject({ ...project, mainCategory: newCategory });
    }
    setShowCategoryModal(false);
    setShowMenu(false);
  };

  const formatAmount = (amount: number): string => {
    return convertAmount(amount).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  };

  const getProjectStatus = (): 'ok' | 'warning' | 'over' => {
    if (project.status === 'over') return 'over';
    if (project.status === 'warning') return 'warning';
    return 'ok';
  };

  const getProgressStatus = (): 'ok' | 'warning' | 'over' => {
    return getProjectStatus();
  };

  // --- Menu items ---

  const menuItems = [
    {
      label: 'עריכה',
      icon: 'edit' as IconName,
      onPress: () => {
        setShowMenu(false);
        onNavigate(AppScreen.EDIT_PROJECT, project.id);
      },
    },
    {
      label: 'העבר קטגוריה',
      icon: 'drive-file-move' as IconName,
      onPress: () => {
        setShowCategoryModal(true);
      },
    },
    {
      label: 'הפק דוח',
      icon: 'summarize' as IconName,
      color: colors.primary,
      onPress: () => {
        setShowMenu(false);
        setShowReportModal(true);
      },
    },
    {
      label: 'מחיקה',
      icon: 'delete' as IconName,
      color: colors.error,
      onPress: () => {
        setShowMenu(false);
        handleDelete();
      },
    },
  ];

  const projectIconName: IconName =
    (CATEGORY_ICONS[project.mainCategory || ''] as IconName) || 'folder';

  // --- Render ---

  return (
    <View style={styles.container}>
      {/* Image Preview Modal */}
      <Modal
        visible={previewImages !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImages(null)}
      >
        <Pressable
          style={styles.previewOverlay}
          onPress={() => setPreviewImages(null)}
        >
          <View style={styles.previewInner}>
            {previewImages && previewImages[previewIndex] ? (
              <Image
                source={{ uri: previewImages[previewIndex] }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : null}
            {previewImages && previewImages.length > 1 ? (
              <View style={styles.previewNav}>
                <TouchableOpacity
                  style={styles.previewNavBtn}
                  onPress={() =>
                    setPreviewIndex((i) =>
                      i <= 0 ? previewImages.length - 1 : i - 1
                    )
                  }
                >
                  <MaterialIcons
                    name="chevron-right"
                    size={28}
                    color={colors.white}
                  />
                </TouchableOpacity>
                <Text style={styles.previewCounter}>
                  {previewIndex + 1} / {previewImages.length}
                </Text>
                <TouchableOpacity
                  style={styles.previewNavBtn}
                  onPress={() =>
                    setPreviewIndex((i) =>
                      i >= previewImages.length - 1 ? 0 : i + 1
                    )
                  }
                >
                  <MaterialIcons
                    name="chevron-left"
                    size={28}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.previewClose}
              onPress={() => setPreviewImages(null)}
            >
              <MaterialIcons name="close" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuPositioner}>
            <View style={styles.menuCard}>
              {menuItems.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={item.color || colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      item.color ? { color: item.color } : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCategoryModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>העבר לקטגוריה</Text>
            <View style={styles.categoryList}>
              {(Object.entries(MAIN_CATEGORIES) as [MainCategory, string][]).map(
                ([key, label]) => {
                  const isSelected = project.mainCategory === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.categoryItem,
                        isSelected
                          ? styles.categoryItemSelected
                          : styles.categoryItemDefault,
                      ]}
                      onPress={() => handleChangeCategory(key)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons
                        name={CATEGORY_ICONS[key] || 'category'}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryItemText,
                          isSelected && { color: colors.primary },
                        ]}
                      >
                        {label}
                      </Text>
                      {isSelected && (
                        <MaterialIcons
                          name="check"
                          size={20}
                          color={colors.primary}
                          style={styles.categoryCheck}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCategoryModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>ביטול</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report Export Modal */}
      <Modal visible={showReportModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowReportModal(false)}
        >
          <Pressable style={styles.reportModalCard} onPress={() => {}}>
            {/* Header */}
            <View style={styles.reportModalHeader}>
              <View style={styles.reportModalIconContainer}>
                <MaterialIcons name="summarize" size={32} color={colors.primary} />
              </View>
              <Text style={styles.reportModalTitle}>הפקת דוח פרויקט</Text>
              <Text style={styles.reportModalSubtitle}>בחר את פורמט הדוח הרצוי</Text>
            </View>

            {/* Export Options */}
            <View style={styles.reportOptions}>
              {/* CSV Option */}
              <TouchableOpacity
                style={styles.reportOptionButton}
                onPress={exportToCSV}
                activeOpacity={0.8}
              >
                <View style={[styles.reportOptionIcon, { backgroundColor: colors.success + '1A' }]}>
                  <MaterialIcons name="table-view" size={24} color={colors.success} />
                </View>
                <View style={styles.reportOptionText}>
                  <Text style={styles.reportOptionTitle}>ייצוא ל-CSV</Text>
                  <Text style={styles.reportOptionDesc}>טבלת נתונים לאקסל</Text>
                </View>
                <MaterialIcons name="chevron-left" size={24} color={colors.textTertiary} />
              </TouchableOpacity>

              {/* PDF Option */}
              <TouchableOpacity
                style={styles.reportOptionButton}
                onPress={exportToPDF}
                activeOpacity={0.8}
              >
                <View style={[styles.reportOptionIcon, { backgroundColor: colors.error + '1A' }]}>
                  <MaterialIcons name="picture-as-pdf" size={24} color={colors.error} />
                </View>
                <View style={styles.reportOptionText}>
                  <Text style={styles.reportOptionTitle}>ייצוא ל-PDF</Text>
                  <Text style={styles.reportOptionDesc}>דוח מעוצב עם גרפים</Text>
                </View>
                <MaterialIcons name="chevron-left" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Report Info */}
            <View style={styles.reportInfoBox}>
              <Text style={styles.reportInfoTitle}>הדוח כולל:</Text>
              {[
                'סיכום תקציב, הוצאות והכנסות',
                'פילוח לפי ספקים וקטגוריות',
                'גרפים ודיאגרמות (PDF)',
                'פירוט כל העסקאות וההערות',
              ].map((item, idx) => (
                <View key={idx} style={styles.reportInfoItem}>
                  <MaterialIcons name="check-circle" size={16} color={colors.success} />
                  <Text style={styles.reportInfoText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowReportModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>ביטול</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Gradient Zone ── */}
        <GradientHeader>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => goBack()}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-forward" size={22} color={colors.white} />
            </TouchableOpacity>

            <Text style={styles.headerLabel}>פרויקט</Text>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowMenu(true)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="more-horiz" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Project identity */}
          <View style={styles.projectIdentity}>
            <View style={styles.projectIconWrap}>
              <MaterialIcons name={projectIconName} size={28} color={colors.primary} />
            </View>
            <Text style={styles.projectName} numberOfLines={2}>
              {project.name}
            </Text>
            <View style={styles.projectMeta}>
              <Text style={styles.projectCategory}>{project.category}</Text>
              <StatusBadge status={getProjectStatus()} size="sm" />
            </View>
          </View>

          {/* GlassCard: Budget summary */}
          <GlassCard style={styles.summaryGlassCard}>
            {/* Budget row */}
            <View style={styles.budgetSection}>
              <View style={styles.budgetLabelRow}>
                <Text style={styles.budgetLabel}>תקציב</Text>
                <TouchableOpacity
                  onPress={() => setIsEditingBudget(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="edit" size={14} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
              {isEditingBudget ? (
                <View style={styles.budgetEditRow}>
                  <TextInput
                    value={tempBudget}
                    onChangeText={setTempBudget}
                    onBlur={handleSaveBudget}
                    onSubmitEditing={handleSaveBudget}
                    keyboardType="numeric"
                    style={styles.budgetInput}
                    autoFocus
                    selectTextOnFocus
                  />
                </View>
              ) : (
                <Text style={styles.budgetAmount}>
                  {currencySymbols[globalCurrency]}
                  {formatAmount(project.budget)}
                </Text>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>הוצאות</Text>
              <Text style={[styles.statValue, { color: colors.error }]}>
                -{currencySymbols[globalCurrency]}
                {formatAmount(totalExpenses)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>הכנסות</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                +{currencySymbols[globalCurrency]}
                {formatAmount(totalIncome)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>יתרה</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: remaining >= 0 ? colors.success : colors.error },
                ]}
              >
                {remaining < 0 && '-'}
                {currencySymbols[globalCurrency]}
                {formatAmount(Math.abs(remaining))}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressWrap}>
              <ProgressBar
                percentage={percentUsed}
                status={getProgressStatus()}
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>{percentUsed}% נוצל</Text>
            </View>
          </GlassCard>
        </GradientHeader>

        {/* ── Dark Zone ── */}
        <View style={styles.darkZone}>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <DarkCard
              style={styles.actionButton}
              onPress={() => onNavigate(AppScreen.ADD_EXPENSE, undefined, false, 'expense')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.error + '1A' }]}>
                <MaterialIcons name="remove-circle" size={22} color={colors.error} />
              </View>
              <Text style={styles.actionButtonText}>הוסף הוצאה</Text>
            </DarkCard>
            <DarkCard
              style={styles.actionButton}
              onPress={() => onNavigate(AppScreen.ADD_INCOME, undefined, false, 'income')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.success + '1A' }]}>
                <MaterialIcons name="add-circle" size={22} color={colors.success} />
              </View>
              <Text style={styles.actionButtonText}>הוסף הכנסה</Text>
            </DarkCard>
          </View>

          {/* Linked Suppliers */}
          {linkedSuppliers.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="ספקים משויכים" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suppliersScroll}
              >
                {linkedSuppliers.map((supplier) => (
                  <DarkCard
                    key={supplier.id}
                    style={styles.supplierChip}
                    onPress={() => onNavigate(AppScreen.SUPPLIER_DETAIL, supplier.id)}
                  >
                    <View style={styles.supplierAvatar}>
                      {supplier.avatar ? (
                        <Image
                          source={{ uri: supplier.avatar }}
                          style={styles.supplierAvatarImage}
                        />
                      ) : (
                        <MaterialIcons
                          name="person"
                          size={20}
                          color={colors.textTertiary}
                        />
                      )}
                    </View>
                    <View>
                      <Text style={styles.supplierName}>{supplier.name}</Text>
                      <Text
                        style={[
                          styles.supplierAmount,
                          {
                            color:
                              supplier.status === 'credit'
                                ? colors.success
                                : supplier.status === 'debt'
                                ? colors.error
                                : colors.textTertiary,
                          },
                        ]}
                      >
                        {currencySymbols[globalCurrency]}
                        {convertAmount(supplier.amount).toLocaleString()}
                      </Text>
                    </View>
                  </DarkCard>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Activities Section */}
          <View style={styles.section}>
            <View style={styles.activityHeader}>
              <SectionHeader title="היסטוריית פעילות" />
              <View style={styles.activityHeaderActions}>
                {/* Add Photo Button */}
                <TouchableOpacity
                  style={styles.noteActionButton}
                  onPress={() => {
                    setIsAddingNote(true);
                    setTimeout(() => handleAddNoteImage(), 100);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add-a-photo" size={18} color={colors.primary} />
                  <Text style={styles.noteButtonText}>תמונה</Text>
                </TouchableOpacity>
                {/* Add Note Button */}
                <TouchableOpacity
                  style={styles.noteActionButton}
                  onPress={() => setIsAddingNote(true)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="edit-note" size={18} color={colors.primary} />
                  <Text style={styles.noteButtonText}>הערה</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Add Note Form */}
            {isAddingNote && (
              <DarkCard style={styles.noteForm}>
                <TextInput
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="כתוב הערה..."
                  placeholderTextColor={colors.textTertiary}
                  style={styles.noteInput}
                  multiline
                  autoFocus
                  textAlignVertical="top"
                />
                {/* Note Images Grid */}
                <View style={styles.noteImagesRow}>
                  {noteImages.map((img, idx) => (
                    <View key={idx} style={styles.noteImageThumbnail}>
                      <Image source={{ uri: img }} style={styles.noteImageThumb} />
                      <TouchableOpacity
                        style={styles.noteImageRemove}
                        onPress={() => setNoteImages((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <MaterialIcons name="close" size={12} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.noteImageAddButton}
                    onPress={handleAddNoteImage}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add-a-photo" size={24} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.noteFormActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setIsAddingNote(false);
                      setNoteText('');
                      setNoteImages([]);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.noteCancelText}>ביטול</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddNote}
                    disabled={!noteText.trim() && noteImages.length === 0}
                    style={[
                      styles.noteSaveButton,
                      !noteText.trim() && noteImages.length === 0 && styles.noteSaveButtonDisabled,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.noteSaveText}>שמור</Text>
                  </TouchableOpacity>
                </View>
              </DarkCard>
            )}

            {/* Activity List */}
            <DarkCard style={styles.activityListCard}>
              {displayedActivities.length > 0 ? (
                displayedActivities.map((item) => {
                  const isIncome = item.type === 'income';
                  const isExpense = item.type === 'expense';
                  const isNote = item.type === 'note';
                  const isBudget = item.type === 'budget_change';
                  const supplierName =
                    isIncome || isExpense
                      ? getSupplierName((item as any).supplierId)
                      : null;
                  const itemImages: string[] = (item as any).receiptImages || [];
                  const itemTitle = (item as any).title || '';
                  const isImageOnly =
                    isNote && itemImages.length > 0 && !itemTitle.trim();

                  const getActivityIcon = (): {
                    name: IconName;
                    color: string;
                  } => {
                    if (isIncome)
                      return { name: 'arrow-downward', color: colors.success };
                    if (isExpense)
                      return { name: 'arrow-upward', color: colors.error };
                    if (isBudget)
                      return { name: 'account-balance-wallet', color: colors.warning };
                    return { name: 'description', color: colors.primary };
                  };

                  const actIcon = getActivityIcon();

                  if (isIncome || isExpense) {
                    const amountStr = `${isIncome ? '+' : '-'}${currencySymbols[globalCurrency]}${formatAmount((item as any).amount)}`;
                    const metaStr = `${item.date}${supplierName ? ` \u2022 ${supplierName}` : ''}`;
                    const isoTs = (item as any).date || '';
                    let timeStr = '';
                    if (isoTs && typeof isoTs === 'string' && isoTs.includes('T')) {
                      const d = new Date(isoTs);
                      if (!isNaN(d.getTime())) {
                        timeStr = d.toLocaleTimeString('he-IL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      }
                    }
                    const dateTimeStr = timeStr ? `${item.date} \u2022 ${timeStr}` : item.date;
                    const itemImgs: string[] = (item as any).receiptImages || [];
                    return (
                      <TransactionRow
                        key={item.id}
                        icon={actIcon.name}
                        iconColor={actIcon.color}
                        title={item.title || ''}
                        meta={metaStr}
                        amount={amountStr}
                        isIncome={isIncome}
                        supplier={supplierName || undefined}
                        dateTime={dateTimeStr}
                        typeLabel={isIncome ? 'הכנסה' : 'הוצאה'}
                        typeColor={isIncome ? colors.success : colors.error}
                        attachmentCount={itemImgs.length}
                        firstAttachmentUri={itemImgs[0]}
                        onAttachmentPress={() => openImagePreview(itemImgs, 0)}
                        onPress={() => onNavigate(AppScreen.ACTIVITY_DETAIL, item.id)}
                      />
                    );
                  }

                  // Notes / budget history rows
                  return (
                    <View key={item.id} style={styles.historyRow}>
                      {/* Icon / Thumbnail */}
                      {isImageOnly && itemImages.length > 0 ? (
                        <View style={styles.activityThumbnail}>
                          <Image
                            source={{ uri: itemImages[0] }}
                            style={styles.activityThumbnailImage}
                          />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.activityIcon,
                            { backgroundColor: actIcon.color + '1A' },
                          ]}
                        >
                          <MaterialIcons
                            name={actIcon.name}
                            size={18}
                            color={actIcon.color}
                          />
                        </View>
                      )}

                      {/* Text */}
                      <View style={styles.activityTextContainer}>
                        <Text style={styles.activityTitle} numberOfLines={1}>
                          {isImageOnly ? 'תמונה' : item.title}
                        </Text>
                        {supplierName ? (
                          <Text style={styles.activitySupplier} numberOfLines={1}>
                            {supplierName}
                          </Text>
                        ) : null}
                        <Text style={styles.activityMeta}>
                          {(() => {
                            const isoTs = (item as any).date || '';
                            if (isoTs && typeof isoTs === 'string' && isoTs.includes('T')) {
                              const d = new Date(isoTs);
                              if (!isNaN(d.getTime())) {
                                const time = d.toLocaleTimeString('he-IL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });
                                const dateOnly = d.toLocaleDateString('he-IL');
                                return `${dateOnly} \u2022 ${time}`;
                              }
                            }
                            return item.date;
                          })()}
                        </Text>
                        {isImageOnly && itemImages.length > 1 && (
                          <Text style={styles.activityMoreImages}>
                            +{itemImages.length - 1} תמונות נוספות
                          </Text>
                        )}
                      </View>

                      {/* Image gallery indicator for notes with text + images */}
                      {isNote && itemImages.length > 0 && !isImageOnly && (
                        <View style={styles.imageGalleryIndicator}>
                          {itemImages.slice(0, 2).map((img: string, idx: number) => (
                            <View key={idx} style={styles.miniImageWrap}>
                              <Image
                                source={{ uri: img }}
                                style={styles.miniImage}
                              />
                            </View>
                          ))}
                          {itemImages.length > 2 && (
                            <View style={styles.miniImageMore}>
                              <Text style={styles.miniImageMoreText}>
                                +{itemImages.length - 2}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyActivities}>
                  <MaterialIcons name="history" size={32} color={colors.textTertiary} />
                  <Text style={styles.emptyActivitiesText}>אין פעילות עדיין</Text>
                </View>
              )}
            </DarkCard>

            {/* Show More / Less */}
            {allActivities.length > 5 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllActivities(!showAllActivities)}
                activeOpacity={0.7}
              >
                <Text style={styles.showMoreText}>
                  {showAllActivities
                    ? 'הצג פחות'
                    : `הצג הכל (${allActivities.length})`}
                </Text>
                <MaterialIcons
                  name={showAllActivities ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Top bar inside gradient
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },

  // Project identity block
  projectIdentity: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  projectIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  projectName: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  projectCategory: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.regular,
    writingDirection: 'rtl',
  },

  // GlassCard summary
  summaryGlassCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.xl,
  },
  budgetSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  budgetLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  budgetLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: fonts.medium,
  },
  budgetEditRow: {
    alignItems: 'center',
  },
  budgetInput: {
    width: 140,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.textPrimary,
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  budgetAmount: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
  },

  // Stats Rows
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statDivider: {
    height: 1,
    backgroundColor: colors.subtleBorder,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: fonts.regular,
    writingDirection: 'rtl',
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },

  // Progress Bar
  progressWrap: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  progressBar: {
    height: 6,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'left',
    fontFamily: fonts.regular,
  },

  // Overlay / Menu
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuPositioner: {
    position: 'absolute',
    top: 120,
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'flex-start',
  },
  menuCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    padding: spacing.sm,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },

  // Category Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    width: '100%',
    maxWidth: 360,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    writingDirection: 'rtl',
  },
  categoryList: {
    gap: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  categoryItemSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '40',
  },
  categoryItemDefault: {
    backgroundColor: colors.bgTertiary,
  },
  categoryItemText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    flex: 1,
  },
  categoryCheck: {
    marginLeft: 'auto',
  },
  modalCancelButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textTertiary,
    fontFamily: fonts.semibold,
    fontSize: 14,
    writingDirection: 'rtl',
  },

  // Dark Zone
  darkZone: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actionButton: {
    flex: 1,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    flexShrink: 1,
  },

  // Section
  section: {
    gap: spacing.md,
  },

  // Linked Suppliers
  suppliersScroll: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  supplierChip: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  supplierAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  supplierAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  supplierName: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  supplierAmount: {
    fontSize: 12,
    marginTop: 2,
  },

  // Activity Section Header
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityHeaderActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 14,
  },
  noteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  noteButtonText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
    writingDirection: 'rtl',
  },

  // Note Form
  noteForm: {
    padding: spacing.lg,
  },
  noteInput: {
    height: 96,
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  noteImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  noteImageThumbnail: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  noteImageThumb: {
    width: '100%',
    height: '100%',
  },
  noteImageRemove: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteImageAddButton: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  noteCancelText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontFamily: fonts.semibold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    writingDirection: 'rtl',
  },
  noteSaveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  noteSaveButtonDisabled: {
    opacity: 0.5,
  },
  noteSaveText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.semibold,
    writingDirection: 'rtl',
  },

  // Activity List Card
  activityListCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  // History rows (notes, budget changes)
  historyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityThumbnail: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.bgTertiary,
  },
  activityThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  activityTextContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  activityTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInner: {
    width: '90%',
    maxWidth: 640,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: 520,
    borderRadius: 16,
  },
  previewNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
  },
  previewNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCounter: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  previewClose: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activitySupplier: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 3,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  activityMeta: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  activityMoreImages: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: fonts.semibold,
    marginTop: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },

  // Image gallery indicator
  imageGalleryIndicator: {
    flexDirection: 'row',
  },
  miniImageWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.bgSecondary,
    marginLeft: -8,
  },
  miniImage: {
    width: '100%',
    height: '100%',
  },
  miniImageMore: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.primary + '33',
    borderWidth: 2,
    borderColor: colors.bgSecondary,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniImageMoreText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
  },

  // Empty activities
  emptyActivities: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyActivitiesText: {
    fontSize: 14,
    color: colors.textTertiary,
    writingDirection: 'rtl',
  },

  // Show more button
  showMoreButton: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  showMoreText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },

  // Report Modal
  reportModalCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    width: '100%',
    maxWidth: 360,
    padding: spacing.xl,
  },
  reportModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  reportModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radii['2xl'],
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  reportModalTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    writingDirection: 'rtl',
  },
  reportModalSubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  reportOptions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  reportOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii['2xl'],
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  reportOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportOptionText: {
    flex: 1,
  },
  reportOptionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  reportOptionDesc: {
    fontSize: 12,
    color: colors.textTertiary,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  },
  reportInfoBox: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reportInfoTitle: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  reportInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  reportInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    flex: 1,
    textAlign: 'right',
  },
});

export default ProjectDetail;
