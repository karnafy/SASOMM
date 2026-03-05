import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  initSupabase,
  AuthProvider,
  useAuth,
  useProjects,
  useSuppliers,
  useDebts,
  useMutations,
  AppScreen,
  Currency,
  MainCategory,
  Project,
} from '@monn/shared';

import { colors } from './theme';
import LoadingScreen from './components/LoadingScreen';
import BottomNav from './components/BottomNav';

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

// Initialize Supabase with Expo env vars
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

initSupabase(supabaseUrl, supabaseAnonKey);

const CONVERSION_RATES: Record<Currency, number> = {
  'ILS': 1,
  'USD': 1 / 3.75,
  'EUR': 1 / 4.05,
};

// Main App Content (requires auth)
function AppContent() {
  const { user, signOut } = useAuth();
  const userId = user?.id;
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
  } = useMutations(userId);

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [historyStack, setHistoryStack] = useState<{ screen: AppScreen; id?: string; txType?: 'expense' | 'income' }[]>([]);
  const [globalCurrency, setGlobalCurrency] = useState<Currency>('ILS');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MainCategory | null>(null);
  const [isScanIntent, setIsScanIntent] = useState(false);
  const [initialTxType, setInitialTxType] = useState<'expense' | 'income'>('expense');
  const [returnToScreen, setReturnToScreen] = useState<AppScreen | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const convertAmount = useCallback(
    (amount: number, from: Currency = 'ILS', to: Currency = globalCurrency) => {
      if (from === to) return amount;
      const inILS = from === 'ILS' ? amount : amount / CONVERSION_RATES[from];
      return inILS * CONVERSION_RATES[to];
    },
    [globalCurrency]
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

      if (screen === AppScreen.ADD_SUPPLIER) {
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
      setIsSaving(true);
      try {
        await saveTransaction(type, projectId, {
          amount, currency, description, category, supplierId,
          receiptImages, paymentMethod, includesVat,
        }, id, originalType);

        await Promise.all([refetchProjects(), refetchSuppliers()]);

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
      } catch (error) {
        console.error('Error saving transaction:', error);
        Alert.alert('שגיאה', 'שגיאה בשמירה. נסה שוב.');
      } finally {
        setIsSaving(false);
      }
    },
    [saveTransaction, refetchProjects, refetchSuppliers, selectedSupplierId]
  );

  // Handler: Create Project
  const handleCreateProject = useCallback(
    async (name: string, budget: number, category: string, mainCategory: MainCategory = 'other') => {
      setIsSaving(true);
      try {
        const budgetInILS = budget / CONVERSION_RATES[globalCurrency];
        const newProject = await createProject({ name, budget: budgetInILS, category, mainCategory });
        await refetchProjects();

        if (newProject) {
          setSelectedProjectId(newProject.id);
          setCurrentScreen(AppScreen.PROJECT_DETAIL);
        }
      } catch (error) {
        console.error('Error creating project:', error);
        Alert.alert('שגיאה', 'שגיאה ביצירת פרויקט. נסה שוב.');
      } finally {
        setIsSaving(false);
      }
    },
    [createProject, refetchProjects, globalCurrency]
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
          setSelectedSupplierId(newSupplier.id);
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
    async (projectId: string, newBudget: number) => {
      try {
        const budgetInILS = newBudget / CONVERSION_RATES[globalCurrency];
        await updateProject(projectId, { budget: budgetInILS });
        await refetchProjects();
      } catch (error) {
        console.error('Error updating budget:', error);
      }
    },
    [updateProject, refetchProjects, globalCurrency]
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

  // Computed totals
  const totals = useMemo(() => {
    const totalIncome = projects.reduce((sum, p) => sum + (p.income || 0), 0);
    const totalExpenses = projects.reduce((sum, p) => sum + p.spent, 0);
    return {
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
        return <Dashboard {...commonProps} projects={projects} suppliers={suppliers} totals={totals as any} setGlobalCurrency={setGlobalCurrency} onLogout={handleLogout} />;
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
            autoCapture={isScanIntent}
            initialType={initialTxType}
            preselectedSupplierId={selectedSupplierId}
          />
        );
      case AppScreen.EDIT_ACTIVITY:
        return <AddExpense {...commonProps} projects={projects} suppliers={suppliers} onSave={handleTransactionSave} editActivity={activeActivity as any} />;
      case AppScreen.ADD_PROJECT:
        return <AddProject {...commonProps} onSave={handleCreateProject} />;
      case AppScreen.EDIT_PROJECT:
        return (
          <AddProject
            {...commonProps}
            project={activeProject}
            onSave={async (name, budget, cat, mainCat) => {
              const budgetInILS = budget / CONVERSION_RATES[globalCurrency];
              await updateProject(activeProject.id, { name, budget: budgetInILS, category: cat, mainCategory: mainCat });
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
        return <ActivityDetail {...commonProps} expense={activeActivity as any} suppliers={suppliers} project={projectOfActivity} onDeleteProject={handleDeleteProject} />;
      case AppScreen.SUPPLIER_DETAIL:
        return <SupplierDetail {...commonProps} supplier={activeSupplier} projects={projects} onUpdateSupplier={handleUpdateSupplier} />;
      case AppScreen.PERSONAL_AREA:
        return <PersonalArea {...commonProps} />;
      case AppScreen.REPORTS_CENTER:
        return <ReportsCenter {...commonProps} projects={projects} suppliers={suppliers} />;
      case AppScreen.SETTINGS:
        return <Settings {...commonProps} setGlobalCurrency={setGlobalCurrency} />;
      case AppScreen.DEBTS:
        return <Debts {...commonProps} projects={projects} debts={debts} onSaveDebt={saveDebt} onDeleteDebt={deleteDebt} />;
      default:
        return <Dashboard {...commonProps} projects={projects} suppliers={suppliers} totals={totals as any} setGlobalCurrency={setGlobalCurrency} onLogout={handleLogout} />;
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
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neuBg,
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
