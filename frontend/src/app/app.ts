import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  //protected readonly title = signal('Paola :)');
    private auth = inject(AuthService);
    private router = inject(Router);

    ngOnInit() {
    const publicRoutes = ['/login', '/login/paciente', '/login/forgot-password', '/login/restore-password'];

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (!publicRoutes.some(route => event.url.startsWith(route))) {
        this.auth.getMe().subscribe({
          next: () => {},
          error: () => this.auth.clearSession()
        });
      }
    });
  }
}
