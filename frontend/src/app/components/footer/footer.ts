import { Component } from '@angular/core';
import { CopyrightDirective } from '../../directives/copyright';

@Component({
  selector: 'app-footer',
  imports: [CopyrightDirective],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {

}
