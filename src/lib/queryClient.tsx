/**
 * React Query (TanStack Query) конфигурация для LUME
 * Централизованное управление кэшем и запросами
 */

import { QueryClient, QueryClientProvider, QueryClientConfig } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Опционально для dev

// ==================== Конфигурация ====================

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Время жизни кэша (ранее cacheTime)
      gcTime: 10 * 60 * 1000, // 10 минут
      
      // Время до считания данных устаревшими
      staleTime: 5 * 60 * 1000, // 5 минут
      
      // Количество повторных попыток при ошибке
      retry: 1,
      
      // Повторные попытки только на определённые ошибки
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch при переключении на вкладку
      refetchOnWindowFocus: false,
      
      // Refetch при reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Количество повторных попыток для мутаций
      retry: 0,
    },
  },
};

// ==================== Query Client ====================

export const queryClient = new QueryClient(queryClientConfig);

// ==================== Query Client Provider ====================

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools для отладки (раскомментировать для dev) */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
};

// ==================== Query Keys ====================

/**
 * Централизованные ключи для query кэша
 * Использование: queryKeys.chats.all() -> ['chats']
 */
export const queryKeys = {
  
  // Чаты (личные сообщения)
  chats: {
    all: () => ['chats'] as const,
    list: () => [...queryKeys.chats.all(), 'list'] as const,
    messages: (userId: string) => [...queryKeys.chats.all(), 'messages', userId] as const,
  },
  
  // Профиль пользователя
  profile: {
    all: () => ['profile'] as const,
    current: () => [...queryKeys.profile.all(), 'current'] as const,
    user: (userId: string) => [...queryKeys.profile.all(), 'user', userId] as const,
  },
  
  // Посты
  posts: {
    all: () => ['posts'] as const,
    list: (type?: 'feed' | 'recommended' | 'following' | `user:${string}`) => 
      [...queryKeys.posts.all(), 'list', type || 'feed'] as const,
    detail: (postId: string) => [...queryKeys.posts.all(), 'detail', postId] as const,
    comments: (postId: string) => [...queryKeys.posts.detail(postId), 'comments'] as const,
  },
  
  // Верификация
  verification: {
    all: () => ['verification'] as const,
    requests: () => [...queryKeys.verification.all(), 'requests'] as const,
    status: (userId: string) => [...queryKeys.verification.all(), 'status', userId] as const,
  },
};

// ==================== Helpers ====================

/**
 * Инвалидировать кэш чатов
 */
export const invalidateChats = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.chats.all() });
};

/**
 * Обновить данные в кэше без перезапроса
 */
export const updateQueryData = <T,>(
  queryKey: readonly unknown[],
  updater: (oldData: T | undefined) => T | undefined
) => {
  queryClient.setQueryData(queryKey, updater);
};

// ==================== Custom Hooks ====================

/**
 * Хук для получения текущего состояния query
 */
export const useQueryState = <T,>(queryKey: readonly unknown[]) => {
  return queryClient.getQueryData<T>(queryKey);
};

/**
 * Хук для установки данных в кэш
 */
export const useSetQueryData = () => {
  return (queryKey: readonly unknown[], data: unknown) => {
    queryClient.setQueryData(queryKey, data);
  };
};
