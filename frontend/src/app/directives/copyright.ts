import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appCopyright]'
})
export class CopyrightDirective {

  constructor(el: ElementRef) { 
    const currentYear = new Date().getFullYear();
    const targetEl = el.nativeElement as HTMLElement;
    targetEl.classList.add('copyright');
    targetEl.textContent = `Copyright ©${currentYear} Todos los derechos reservados.`;
  
  }
}
