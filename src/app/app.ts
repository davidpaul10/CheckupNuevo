import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';
import { ThemeService } from './services/theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected authService = inject(AuthService);
  protected themeService = inject(ThemeService);
  private router = inject(Router);

  isDrawerOpen = signal(false);
  isLoginPage = signal(false);

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isLoginPage.set(event.urlAfterRedirects.includes('/login'));
        this.isDrawerOpen.set(false);
      }
    });
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update(v => !v);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  logout(): void {
    this.closeDrawer();
    this.authService.logout();
  }
}
