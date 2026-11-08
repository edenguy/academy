import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProviders } from './providers';
import { Shell } from './Shell';
import { HomePage } from '@/features/home/HomePage';
import { LessonPage } from '@/features/lesson/LessonPage';

export function AppRouter() {
  return (
    <HashRouter>
      <AppProviders>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="lesson/:lessonId" element={<LessonPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppProviders>
    </HashRouter>
  );
}
