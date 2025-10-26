import { Component, inject } from '@angular/core';
import { CopyrightDirective } from '../../directives/copyright';
import { AuthService } from '../../auth/auth.service';
import { TelefonoPipe } from '../../pipes/telefono.pipe';

@Component({
  selector: 'app-footer',
  imports: [CopyrightDirective, TelefonoPipe],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  auth = inject(AuthService);


}
