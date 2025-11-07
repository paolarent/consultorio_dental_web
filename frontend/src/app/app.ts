import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  //protected readonly title = signal('Paola :)');
  private auth = inject(AuthService);

  ngOnInit() {
    this.auth.initAuthCheck();
  }
}
