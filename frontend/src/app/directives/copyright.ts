import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appCopyright]'
})
export class CopyrightDirective {

  constructor(el: ElementRef) { 
    const currentYear = new Date().getFullYear();
    const targetEl = HTMLElement = el.nativeElement;
    targetEl.classlist.add('copyright');
    targetEl.textContent = `Copyright ©${currentYear} Todos los derechos reservados.`;
  }

}
