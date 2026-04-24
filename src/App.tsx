import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppContentShell } from "./components/AppContentShell";
import { ScrollToTop } from "./components/ScrollToTop";
import { ThemeProvider } from "./context/ThemeContext";
import { TransactionsProvider } from "./context/TransactionsContext";
import { FilteredTransactionsPage } from "./pages/FilteredTransactionsPage";
import { HomePage } from "./pages/HomePage";
import { InvestmentsPage } from "./pages/InvestmentsPage";
import { MenuPage } from "./pages/MenuPage";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <TransactionsProvider>
          <AppContentShell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/receitas" element={<FilteredTransactionsPage mode="income" />} />
              <Route path="/despesas" element={<FilteredTransactionsPage mode="expense" />} />
              <Route path="/investimentos" element={<InvestmentsPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppContentShell>
        </TransactionsProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
