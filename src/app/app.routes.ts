import { Routes } from '@angular/router';
import { authGuard } from './core/guards/authGuard';
import { LayoutComponent } from './shared/ui/layout/layout';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/authRoutes').then(m => m.authRoutes)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('./features/home/homeRoutes').then(m => m.homeRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];