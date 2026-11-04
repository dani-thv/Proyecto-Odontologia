import { createContext, useContext, useState, type ReactNode } from "react";
import type { UserAccount } from "@/types";
import { authenticateUser, getStoredUser, setStoredUser, SYSTEM_USERS } from "@/constants/auth";

export interface AccountContextValue {
  account: UserAccount | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const AccountContext = createContext<AccountContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  initialAccount?: UserAccount | null;
}

export function AccountProvider({ children, initialAccount }: ProviderProps) {
  const [account, setAccount] = useState<UserAccount | null>(() => {
    if (initialAccount !== undefined) return initialAccount;
    return getStoredUser();
  });

  const login = (username: string, password: string) => {
    const user = authenticateUser(username, password);
    if (user) {
      setAccount(user);
      setStoredUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setAccount(null);
    setStoredUser(null);
  };

  return (
    <AccountContext.Provider value={{ account, login, logout }}>
      {children}
    </AccountContext.Provider>
  );
}

/** Hook para acceder a la cuenta activa y métodos de sesión */
export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    // Retorno seguro por si se invoca fuera del provider en tests no inicializados
    return {
      account: SYSTEM_USERS[0]!,
      login: () => false,
      logout: () => {},
    };
  }
  return context;
};
