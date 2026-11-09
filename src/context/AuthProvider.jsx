import { AuthContext } from './AuthContext';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { authService } from '../services/authService';

const reducer = (state, action) => {
  switch (action.type) {
    case 'restored':
    case 'signedIn':
      return { status: 'ready', user: action.user };
    case 'signedOut':
      return { status: 'ready', user: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { status: 'loading', user: null });

  useEffect(() => {
    authService.restore().then((user) => dispatch({ type: 'restored', user })).catch(() => dispatch({ type: 'signedOut' }));
  }, []);

  const login = useCallback(async (credentials) => {
    const user = await authService.login(credentials);
    dispatch({ type: 'signedIn', user });
    return user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    dispatch({ type: 'signedOut' });
  }, []);

  const refresh = useCallback(async () => {
    const user = await authService.restore();
    dispatch({ type: 'signedIn', user });
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout, refresh, register: authService.register }),
    [state, login, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
