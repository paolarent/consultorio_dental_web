import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  usuario = signal<any>(null);

  constructor(private auth: AuthService) {
    this.auth.usuario$.subscribe(user => this.usuario.set(user));
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  logout() {
    this.auth.logout().subscribe(() => this.usuario.set(null));
  }
}


