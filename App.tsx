
import React, { useState, useEffect, useMemo } from 'react';
import { Entry, Category, ViewMode, StatFilter, Payment } from './types';
import { CATEGORIES } from './constants';
import { getBalance, getStatus } from './utils/helpers';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TableView from './components/TableView';
import EntryModal from './components/EntryModal';
import PaymentModal from './components/PaymentModal';
import ConfirmModal from './components/ConfirmModal';
import HistoryModal from './components/HistoryModal';
import GeminiAssistant from './components/GeminiAssistant';

const STORAGE_KEY = 'parchi_pro_v11';

const App: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<ViewMode>(Category.ChaqueReceivables);
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal states
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [entryToPay, setEntryToPay] = useState<Entry | null>(null);
  const [entryToConfirm, setEntryToConfirm] = useState<Entry | null>(null);
  const [entryHistory, setEntryHistory] = useState<Entry | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);

  // Initialization
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = (newEntry: Partial<Entry>) => {
    const entry: Entry = {
      id: Date.now().toString(),
      category: Category.ChaqueReceivables,
      date: new Date().toISOString().split('T')[0],
      refNo: '',
      partyName: '',
      bankName: '',
      bankAccountNum: '',
      desc: '',
      totalAmount: 0,
      dueDate: '',
      status: 'Pending',
      payments: [],
      ...newEntry
    } as Entry;

    setEntries(prev => [entry, ...prev]);
  };

  const handleUpdateEntry = (updatedEntry: Entry) => {
    setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleAddPayment = (entryId: string, payment: Payment) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        const updatedPayments = [...entry.payments, payment];
        return { ...entry, payments: updatedPayments };
      }
      return entry;
    }));
  };

  const handleConfirmUnknown = (entryId: string, details: { confirmedBy: string; partyName: string; date: string }) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          status: 'Confirmed' as const,
          confirmedBy: details.confirmedBy,
          partyName: details.partyName,
          date: details.date
        };
      }
      return entry;
    }));
  };

  const filteredEntries = useMemo(() => {
    let result = entries;

    // View filter
    if (view !== 'dashboard') {
      result = result.filter(e => e.category === view);
    }

    // Month filter
    if (monthFilter !== 'all') {
      const now = new Date();
      let start: Date, end: Date;
      if (monthFilter === 'current') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else { // last
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      }
      result = result.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    }

    // Stat card filter
    if (activeStatFilter && view !== 'dashboard') {
      result = result.filter(e => {
        const balance = getBalance(e);
        const status = getStatus(e);
        if (activeStatFilter === 'total') return true;
        if (activeStatFilter === 'paid') return status === 'Paid';
        if (activeStatFilter === 'pending') return balance > 0 && status !== 'Overdue' && status !== 'Confirmed';
        if (activeStatFilter === 'overdue') return balance > 0 && (status === 'Overdue' || status === 'Active' || status === 'Confirmed');
        return true;
      });
    }

    return result;
  }, [entries, view, monthFilter, activeStatFilter]);

  return (
    <div className="flex h-full w-full bg-slate-50 relative overflow-hidden">
      <Sidebar
        currentView={view}
        onViewChange={(v) => { setView(v); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onAddEntry={() => { setEditingEntry(null); setShowEntryModal(true); }}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Print Header */}
        <div className="hidden print:block mb-8 text-center">
            <h1 className="text-3xl font-black text-slate-900 uppercase">Parchi Manager Report</h1>
            <p className="text-slate-500 mt-2 font-bold">{view === 'dashboard' ? 'Overview' : view} &bull; {new Date().toLocaleDateString()}</p>
        </div>

        <header className="no-print bg-white/70 glass border-b px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MenuIcon />
            </button>
            <h1 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight uppercase">
              {view === 'dashboard' ? 'Executive Summary' : view}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {view !== 'dashboard' && (
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="bg-slate-50 border rounded-xl px-3 py-2 text-sm font-semibold focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer"
              >
                <option value="all">All Records</option>
                <option value="current">Current Month</option>
                <option value="last">Previous Month</option>
              </select>
            )}
            <GeminiAssistant onEntryParsed={handleAddEntry} />
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-200"
            >
              <PrintIcon />
              <span>Print Report</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 pb-20">
          {view === 'dashboard' ? (
            <Dashboard entries={entries} onNavigate={setView} />
          ) : (
            <TableView
              entries={filteredEntries}
              category={view as Category}
              activeStatFilter={activeStatFilter}
              onStatFilterChange={setActiveStatFilter}
              onEdit={entry => { setEditingEntry(entry); setShowEntryModal(true); }}
              onPay={setEntryToPay}
              onConfirm={setEntryToConfirm}
              onDelete={handleDeleteEntry}
              onHistory={setEntryHistory}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {showEntryModal && (
        <EntryModal
          entry={editingEntry}
          onClose={() => setShowEntryModal(false)}
          onSave={editingEntry ? handleUpdateEntry : handleAddEntry}
          defaultCategory={view !== 'dashboard' ? (view as Category) : Category.ChaqueReceivables}
        />
      )}

      {entryToPay && (
        <PaymentModal
          entry={entryToPay}
          onClose={() => setEntryToPay(null)}
          onSave={handleAddPayment}
        />
      )}

      {entryToConfirm && (
        <ConfirmModal
          entry={entryToConfirm}
          onClose={() => setEntryToConfirm(null)}
          onSave={handleConfirmUnknown}
        />
      )}

      {entryHistory && (
        <HistoryModal
          entry={entryHistory}
          onClose={() => setEntryHistory(null)}
        />
      )}

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => { setEditingEntry(null); setShowEntryModal(true); }}
        className="no-print lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-40"
      >
        <PlusIcon />
      </button>
    </div>
  );
};

// Icons (SVG Components)
const MenuIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
);
const PlusIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
);
const PrintIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" /></svg>
);

export default App;
