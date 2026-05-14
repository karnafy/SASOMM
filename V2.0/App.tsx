import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from '@expo-google-fonts/open-sans';
import {
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
  OpenSans_800ExtraBold,
} from '@expo-google-fonts/open-sans';
import {
  initSupabase,
  initI18n,
  AuthProvider,
  useAuth,
  useProjects,
  useSuppliers,
  useDebts,
  useMutations,
  useExchangeRates,
  AppScreen,
  Currency,
  MainCategory,
  Project,
  generateMissingRecurringOccurrences,
} from '@monn/shared';

import { colors } from './theme';
import LoadingScreen from './components/LoadingScreen';
import BottomNav from './components/BottomNav';
import TopHeader from './components/TopHeader';

// Import pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AddExpense from './pages/AddExpense';
import AddProject from './pages/AddProject';
import AddSupplier from './pages/AddSupplier';
import Contacts from './pages/Contacts';
import SupplierDetail from './pages/SupplierDetail';
import ActivityDetail from './pages/ActivityDetail';
import CategoryProjects from './pages/CategoryProjects';
import PersonalArea from './pages/PersonalArea';
import ReportsCenter from './pages/ReportsCenter';
import Settings from './pages/Settings';
import Debts from './pages/Debts';
import RecurringTemplates from './pages/RecurringTemplates';
import SendReminder from './pages/SendReminder';

// Initialize Supabase with Expo env vars
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

initSupabase(supabaseUrl, supabaseAnonKey);

const CURRENCY_STORAGE_KEY = 'sasomm.currency';
const SUPPORTED_CURRENCIES: Currency[] = ['ILS', 'USD', 'EUR'];

// Set default font for all Text components
const TextAny = Text as any;
const originalDefaultProps = TextAny.defaultProps;
TextAny.defaultProps = {
  ...originalDefaultProps,
  style: { fontFamily: 'OpenSans_400Regular' },
};

// Main App Content (requires auth)
function AppContent() {
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const { rates: CONVERSION_RATES } = useExchangeRates();
  const userName = user?.email?.split('@')[0] || '';
  const scrollRef = useRef<ScrollView>(null);

  const { projects, loading: projectsLoading, refetch: refetchProjects } = useProjects(userId);
  const { suppliers, loading: suppliersLoading, refetch: refetchSuppliers } = useSuppliers(userId);
  const { debts, loading: debtsLoading, saveDebt, deleteDebt } = useDebts(userId);

  const {
    saveTransaction,
    createProject,
    updateProject,
    deleteProject,
    addNoteToProject,
    createSupplier,
    updateSupplier,
    saveRecurringTemplate,
    applyRecurringEdit,
    pauseRecurringTemplate,
    deleteRecurringTemplate,
    deleteTransaction,
  } = useMutations(userId);

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [historyStack, setHistoryStack] = useState<{ screen: AppScreen; id?: string; txType?: 'expense' | 'income' }[]>([]);
  const [globalCurrency, setGlobalCurrencyState] = useState<Currency>('ILS');

  useEffect(() => {
    AsyncStorage.getItem(CURRENCY_STORAGE_KEY)
      .then((saved) => {
        if (saved && SUPPORTED_CURRENCIES.includes(saved as Currency)) {
          setGlobalCurrencyState(saved as Currency);
        }
      })
      .catch(() => {
        // first launch or storage unavailable — keep default
      });
  }, []);

  const setGlobalCurrency = useCallback((next: Currency) => {
    setGlobalCurrencyState(next);
    AsyncStorage.setItem(CURRENCY_STORAGE_KEY, next).catch(() => {
      // storage write failed — state still updates in memory
    });
  }, []);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MainCategory | null>(null);
  const [isScanIntent, setIsScanIntent] = useState(false);
  const [initialTxType, setInitialTxType] = useState<'expense' | 'income'>('expense');
  const [returnToScreen, setReturnToScreen] = useState<AppScreen | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const expenseFormDraftRef = useRef<any>(null);

  const convertAmount = useCallback(
    (amount: number, from: Currency = 'ILS', to: Currency = globalCurrency) => {
      if (from === to) return amount;
      const inILS = from === 'ILS' ? amount : amount / CONVERSION_RATES[from];
      return inILS * CONVERSION_RATES[to];
    },
    [globalCurrency, CONVERSION_RATES]
  );

  const navigate = useCallback(
    (screen: AppScreen, id?: string, scan?: boolean, txType?: 'expense' | 'income') => {
      if (screen !== currentScreen) {
        setHistoryStack((prev) => [
          ...prev,
          {
            screen: currentScreen,
            id:
              currentScreen === AppScreen.PROJECT_DETAIL ? selectedProjectId || undefined :
              currentScreen === AppScreen.SUPPLIER_DETAIL ? selectedSupplierId || undefined :
              (currentScreen === AppScreen.ACTIVITY_DETAIL || currentScreen === AppScreen.EDIT_ACTIVITY) ? selectedExpenseId || undefined :
              currentScreen === AppScreen.CATEGORY_PROJECTS ? selectedCategory || undefined :
              undefined,
            txType: initialTxType,
          },
        ]);
      }

      if (id) {
        if (screen === AppScreen.PROJECT_DETAIL) setSelectedProjectId(id);
        if (screen === AppScreen.SUPPLIER_DETAIL) setSelectedSupplierId(id);
        if (screen === AppScreen.ACTIVITY_DETAIL || screen === AppScreen.EDIT_ACTIVITY) setSelectedExpenseId(id);
        if (screen === AppScreen.ADD_EXPENSE || screen === AppScreen.ADD_INCOME) setSelectedSupplierId(id);
        if (screen === AppScreen.CATEGORY_PROJECTS) setSelectedCategory(id as MainCategory);
      } else {
        if (screen === AppScreen.ADD_EXPENSE || screen === AppScreen.ADD_INCOME) setSelectedSupplierId(null);
      }

      if (screen === AppScreen.ADD_SUPPLIER || screen === AppScreen.ADD_PROJECT) {
        setReturnToScreen(currentScreen);
      }

      setIsScanIntent(!!scan);
      if (txType) setInitialTxType(txType);
      else if (screen === AppScreen.ADD_INCOME) setInitialTxType('income');
      else setInitialTxType('expense');

      setCurrentScreen(screen);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [currentScreen, selectedProjectId, selectedSupplierId, selectedExpenseId, selectedCategory, initialTxType]
  );

  const goBack = useCallback(() => {
    if (historyStack.length === 0) {
      setCurrentScreen(AppScreen.DASHBOARD);
      return;
    }

    const prev = historyStack[historyStack.length - 1];
    setHistoryStack((prevStack) => prevStack.slice(0, -1));

    if (prev.id) {
      if (prev.screen === AppScreen.PROJECT_DETAIL) setSelectedProjectId(prev.id);
      if (prev.screen === AppScreen.SUPPLIER_DETAIL) setSelectedSupplierId(prev.id);
      if (prev.screen === AppScreen.ACTIVITY_DETAIL || prev.screen === AppScreen.EDIT_ACTIVITY) setSelectedExpenseId(prev.id);
      if (prev.screen === AppScreen.CATEGORY_PROJECTS) setSelectedCategory(prev.id as MainCategory);
    }

    if (prev.txType) setInitialTxType(prev.txType);

    setCurrentScreen(prev.screen);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [historyStack]);

  // Handler: Save Transaction
  const handleTransactionSave = useCallback(
    async (
      type: 'expense' | 'income',
      projectId: string,
      amount: number,
      currency: Currency,
      description: string,
      category: string,
      supplierId?: string,
      receiptImages?: string[],
      paymentMethod?: string,
      includesVat?: boolean,
      id?: string,
      originalType?: 'expense' | 'income'
    ) => {
      const showError = (msg: string) => {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(msg);
        } else {
          Alert.alert('שגיאה', msg);
        }
      };
      console.log('[handleTransactionSave] START v2', { type, projectId, amount, currency, userId, editId: id });
      if (typeof window !== 'undefined' && (window as any).__SASOMM_TRACE__) {
        window.alert(`SAVE START:\nuserId=${userId || 'MISSING'}\nproject=${projectId}\namount=${amount}\ntype=${type}`);
      }
      if (!userId) {
        showError('אינך מחובר (userId חסר). התחבר מחדש דרך התפריט.');
        return;
      }
      setIsSaving(true);
      try {
        await saveTransaction(type, projectId, {
          amount, currency, description, category, supplierId,
          receiptImages, paymentMethod, includesVat,
        }, id, originalType);
        console.log('[handleTransactionSave] saveTransaction RESOLVED');

        await Promise.all([refetchProjects(), refetchSuppliers()]);
        console.log('[handleTransactionSave] refetch DONE — navigating');

        if (id) {
          setSelectedExpenseId(id);
          setCurrentScreen(AppScreen.ACTIVITY_DETAIL);
        } else if (selectedSupplierId) {
          setCurrentScreen(AppScreen.SUPPLIER_DETAIL);
        } else if (projectId) {
          setSelectedProjectId(projectId);
          setCurrentScreen(AppScreen.PROJECT_DETAIL);
        } else {
          setCurrentScreen(AppScreen.DASHBOARD);
        }
      } catch (error: any) {
        const msg = error?.message || error?.error_description || JSON.stringify(error);
        console.error('[handleTransactionSave] FAILED', error);
        showError(`שמירה נכשלה: ${msg}`);
      } finally {
        setIsSaving(false);
      }
    },
    [saveTransaction, refetchProjects, refetchSuppliers, selectedSupplierId, userId]
  );

  // Handler: Create Project
  const handleCreateProject = useCallback(
    async (
      name: string,
      budget: number,
      currency: Currency,
      category: string,
      mainCategory: MainCategory = 'other'
    ) => {
      setIsSaving(true);
      try {
        // Store budget AS-IS in the user's chosen currency.
        // Avoids drift when exchange rates change between save and display.
        const newProject = await createProject({
          name,
          budget,
          budgetCurrency: currency,
          category,
          mainCategory,
        });
        await refetchProjects();

        if (newProject && (returnToScreen === AppScreen.ADD_EXPENSE || returnToScreen === AppScreen.ADD_INCOME)) {
          // Returning to expense form — update draft with new project and restore
          if (expenseFormDraftRef.current) {
            expenseFormDraftRef.current.selectedProjectId = newProject.id;
          }
          setSelectedProjectId(newProject.id);
          setHistoryStack((prev) => prev.slice(0, -1));
          setCurrentScreen(returnToScreen);
          setReturnToScreen(null);
        } else if (newProject) {
          setSelectedProjectId(newProject.id);
          setCurrentScreen(AppScreen.PROJECT_DETAIL);
          setReturnToScreen(null);
        }
      } catch (error) {
        console.error('Error creating project:', error);
        Alert.alert('שגיאה', 'שגיאה ביצירת פרויקט. נסה שוב.');
      } finally {
        setIsSaving(false);
      }
    },
    [createProject, refetchProjects, returnToScreen]
  );

  // Handler: Delete Project
  const handleDeleteProject = useCallback(
    async (id: string) => {
      try {
        await deleteProject(id);
        await refetchProjects();
        setCurrentScreen(AppScreen.DASHBOARD);
      } catch (error) {
        console.error('Error deleting project:', error);
        Alert.alert('שגיאה', 'שגיאה במחיקת פרויקט.');
      }
    },
    [deleteProject, refetchProjects]
  );

  // Handler: Create Supplier
  const handleCreateSupplier = useCallback(
    async (name: string, category: string, phone: string, avatar?: string) => {
      setIsSaving(true);
      try {
        const newSupplier = await createSupplier({ name, category, phone, avatar });
        await refetchSuppliers();

        if (returnToScreen === AppScreen.ADD_EXPENSE || returnToScreen === AppScreen.ADD_INCOME) {
          // Returning to expense form — update draft with new supplier and restore
          if (expenseFormDraftRef.current) {
            expenseFormDraftRef.current.selectedSupplierId = newSupplier.id;
          }
          setSelectedSupplierId(newSupplier.id);
          setHistoryStack((prev) => prev.slice(0, -1));
          setCurrentScreen(returnToScreen);
        } else {
          setCurrentScreen(AppScreen.SUPPLIERS);
        }
        setReturnToScreen(null);
      } catch (error) {
        console.error('Error creating supplier:', error);
        Alert.alert('שגיאה', 'שגיאה ביצירת ספק. נסה שוב.');
      } finally {
        setIsSaving(false);
      }
    },
    [createSupplier, refetchSuppliers, returnToScreen]
  );

  // Handler: Update Project
  const handleUpdateProject = useCallback(
    async (updatedProject: Project) => {
      try {
        await updateProject(updatedProject.id, {
          name: updatedProject.name,
          budget: updatedProject.budget,
          category: updatedProject.category,
          mainCategory: updatedProject.mainCategory,
          icon: updatedProject.icon,
        });
        await refetchProjects();
      } catch (error) {
        console.error('Error updating project:', error);
      }
    },
    [updateProject, refetchProjects]
  );

  // Handler: Update Budget
  const handleUpdateBudget = useCallback(
    async (projectId: string, newBudget: number, currency: Currency) => {
      try {
        // Store budget AS-IS in the chosen currency; no rate conversion.
        await updateProject(projectId, { budget: newBudget, budgetCurrency: currency });
        await refetchProjects();
      } catch (error) {
        console.error('Error updating budget:', error);
      }
    },
    [updateProject, refetchProjects]
  );

  // Handler: Add Note
  const handleAddNote = useCallback(
    async (projectId: string, note: string, images?: string[]) => {
      try {
        await addNoteToProject(projectId, note, images);
        await refetchProjects();
      } catch (error) {
        console.error('Error adding note:', error);
      }
    },
    [addNoteToProject, refetchProjects]
  );

  // Handler: Update Supplier
  const handleUpdateSupplier = useCallback(
    async (updatedSupplier: any) => {
      try {
        await updateSupplier(updatedSupplier.id, {
          name: updatedSupplier.name,
          category: updatedSupplier.category,
          phone: updatedSupplier.phone,
          avatar: updatedSupplier.avatar,
        });
        await refetchSuppliers();
      } catch (error) {
        console.error('Error updating supplier:', error);
      }
    },
    [updateSupplier, refetchSuppliers]
  );

  const handleLogout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  // Catch-up: generate any missing recurring occurrences for the user.
  // Runs once per session (when userId becomes available). Failures are logged
  // but never block UI — the app keeps working even if generation fails.
  const recurringRanRef = useRef<string | null>(null);
  useEffect(() => {
    if (!userId) return;
    if (recurringRanRef.current === userId) return;
    recurringRanRef.current = userId;
    (async () => {
      try {
        const result = await generateMissingRecurringOccurrences(userId);
        if (result.rowsInserted > 0) {
          await refetchProjects();
        }
        if (result.errors.length > 0) {
          console.warn('Recurring generator errors:', result.errors);
        }
      } catch (err) {
        console.warn('Recurring generator failed (non-blocking):', err);
      }
    })();
  }, [userId, refetchProjects]);

  // Computed totals — budgets are normalized to ILS via each project's own currency.
  const totals = useMemo(() => {
    const totalBudget = projects.reduce(
      (sum, p) => sum + convertAmount(p.budget, p.budgetCurrency || 'ILS', 'ILS'),
      0
    );
    const totalIncome = projects.reduce((sum, p) => sum + (p.income || 0), 0);
    const totalExpenses = projects.reduce((sum, p) => sum + p.spent, 0);
    return {
      budget: convertAmount(totalBudget),
      income: convertAmount(totalIncome),
      expenses: convertAmount(totalExpenses),
      net: convertAmount(totalIncome - totalExpenses),
    };
  }, [projects, convertAmount]);

  if (projectsLoading || suppliersLoading) {
    return <LoadingScreen />;
  }

  const renderScreen = () => {
    const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
    const activeSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
    const allActivities = projects.flatMap((p) => [
      ...p.expenses.map((e) => ({ ...e, projectName: p.name, projectId: p.id, type: 'expense' as const })),
      ...(p.incomes || []).map((i) => ({ ...i, projectName: p.name, projectId: p.id, type: 'income' as const })),
      ...(p.history || []).map((h) => ({ ...h, projectName: p.name, projectId: p.id })),
    ]);
    const activeActivity = allActivities.find((a) => a.id === selectedExpenseId) || allActivities[0];

    const commonProps = { onNavigate: navigate, goBack, globalCurrency, convertAmount };

    switch (currentScreen) {
      case AppScreen.DASHBOARD:
        return <Dashboard {...commonProps} projects={projects} suppliers={suppliers} totals={totals as any} setGlobalCurrency={setGlobalCurrency} onLogout={handleLogout} userName={userName} />;
      case AppScreen.SUPPLIERS:
        return <Contacts {...commonProps} suppliers={suppliers} />;
      case AppScreen.ADD_EXPENSE:
      case AppScreen.ADD_INCOME:
        return (
          <AddExpense
            {...commonProps}
            projects={projects}
            suppliers={suppliers}
            onSave={handleTransactionSave}
            onSaveRecurring={async (template) => {
              await saveRecurringTemplate(template);
              const result = await generateMissingRecurringOccurrences(userId!);
              if (result.rowsInserted > 0) await refetchProjects();
              if (template.projectId) {
                setSelectedProjectId(template.projectId);
                setCurrentScreen(AppScreen.PROJECT_DETAIL);
              } else {
                setCurrentScreen(AppScreen.DASHBOARD);
              }
            }}
            autoCapture={isScanIntent}
            initialType={initialTxType}
            preselectedSupplierId={selectedSupplierId}
            preselectedProjectId={selectedProjectId}
            formDraft={expenseFormDraftRef.current}
            onSaveDraft={(draft: any) => { expenseFormDraftRef.current = draft; }}
          />
        );
      case AppScreen.EDIT_ACTIVITY:
        return (
          <AddExpense
            {...commonProps}
            projects={projects}
            suppliers={suppliers}
            onSave={handleTransactionSave}
            editActivity={activeActivity as any}
            onSaveRecurring={async (template) => {
              await saveRecurringTemplate(template);
              const result = await generateMissingRecurringOccurrences(userId!);
              if (result.rowsInserted > 0) await refetchProjects();
            }}
            onApplyRecurringEdit={async (templateId, type, scope, cursorDate, updates) => {
              const u: any = { ...updates };
              if (u.amount !== undefined && u.currency) {
                u.amount = u.amount / CONVERSION_RATES[u.currency as Currency];
                u.currency = 'ILS';
              }
              await applyRecurringEdit(templateId, type, scope, cursorDate, u);
              await refetchProjects();
            }}
            onPauseTemplate={async (templateId) => {
              await pauseRecurringTemplate(templateId, false);
              await refetchProjects();
            }}
          />
        );
      case AppScreen.ADD_PROJECT:
        return <AddProject {...commonProps} projects={projects} onSave={handleCreateProject} preselectedMainCategory={selectedCategory || undefined} />;
      case AppScreen.EDIT_PROJECT:
        return (
          <AddProject
            {...commonProps}
            projects={projects}
            project={activeProject}
            onSave={async (name, budget, currency, cat, mainCat) => {
              await updateProject(activeProject.id, {
                name,
                budget,
                budgetCurrency: currency,
                category: cat,
                mainCategory: mainCat,
              });
              await refetchProjects();
              setCurrentScreen(AppScreen.PROJECT_DETAIL);
            }}
          />
        );
      case AppScreen.ADD_SUPPLIER:
        return <AddSupplier {...commonProps} onSave={handleCreateSupplier} returnTo={returnToScreen} />;
      case AppScreen.PROJECTS:
        return <Projects {...commonProps} projects={projects} />;
      case AppScreen.CATEGORY_PROJECTS:
        return <CategoryProjects {...commonProps} projects={projects} selectedCategory={selectedCategory || 'projects'} />;
      case AppScreen.PROJECT_DETAIL:
        return (
          <ProjectDetail
            {...commonProps}
            project={activeProject}
            suppliers={suppliers}
            onUpdateBudget={handleUpdateBudget}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
            onAddNote={handleAddNote}
          />
        );
      case AppScreen.ACTIVITY_DETAIL:
        const projectOfActivity = projects.find((p) => p.id === activeActivity?.projectId);
        return (
          <ActivityDetail
            {...commonProps}
            expense={activeActivity as any}
            suppliers={suppliers}
            project={projectOfActivity}
            onDeleteProject={handleDeleteProject}
            onDeleteTransaction={async (type, transactionId, projectId) => {
              await deleteTransaction(type, transactionId, projectId);
              await refetchProjects();
              await refetchSuppliers();
            }}
          />
        );
      case AppScreen.SUPPLIER_DETAIL:
        return <SupplierDetail {...commonProps} supplier={activeSupplier} projects={projects} onUpdateSupplier={handleUpdateSupplier} />;
      case AppScreen.PERSONAL_AREA:
        return <PersonalArea {...commonProps} />;
      case AppScreen.REPORTS_CENTER:
        return <ReportsCenter {...commonProps} projects={projects} suppliers={suppliers} />;
      case AppScreen.SETTINGS:
        return <Settings {...commonProps} setGlobalCurrency={setGlobalCurrency} />;
      case AppScreen.SEND_REMINDER:
        return <SendReminder {...commonProps} projects={projects} debts={debts} suppliers={suppliers} />;
      case AppScreen.DEBTS:
        return <Debts {...commonProps} projects={projects} debts={debts} suppliers={suppliers} onSaveDebt={saveDebt} onDeleteDebt={deleteDebt} />;
      case AppScreen.ADD_DEBT:
        return <Debts {...commonProps} projects={projects} debts={debts} onSaveDebt={saveDebt} onDeleteDebt={deleteDebt} autoOpenAdd />;
      case AppScreen.RECURRING_TEMPLATES:
        return (
          <RecurringTemplates
            {...commonProps}
            projects={projects}
            suppliers={suppliers}
            onPause={async (id, isActive) => {
              await pauseRecurringTemplate(id, isActive);
            }}
            onDelete={async (id, alsoDeleteRows) => {
              await deleteRecurringTemplate(id, { deleteGeneratedRows: alsoDeleteRows });
              await refetchProjects();
            }}
          />
        );
      default:
        return <Dashboard {...commonProps} projects={projects} suppliers={suppliers} totals={totals as any} setGlobalCurrency={setGlobalCurrency} onLogout={handleLogout} userName={userName} />;
    }
  };

  const hideBottomNav = [
    AppScreen.ADD_EXPENSE, AppScreen.ADD_INCOME, AppScreen.ADD_PROJECT,
    AppScreen.ADD_SUPPLIER, AppScreen.EDIT_PROJECT, AppScreen.EDIT_ACTIVITY,
  ].includes(currentScreen);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isSaving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingCard}>
            <Text style={styles.savingText}>שומר...</Text>
          </View>
        </View>
      )}
      <TopHeader onNavigate={navigate} onLogout={handleLogout} />
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderScreen()}
      </ScrollView>
      {!hideBottomNav && <BottomNav currentScreen={currentScreen} onNavigate={navigate} />}
    </SafeAreaView>
  );
}

// App Wrapper with Auth
function AppInner() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Auth />;
  return <AppContent />;
}

// Root App
export default function App() {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    OpenSans_800ExtraBold,
  });
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true)).catch(() => setI18nReady(true));
  }, []);

  if (!fontsLoaded || !i18nReady) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  savingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
