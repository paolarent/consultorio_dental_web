import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-nav-exp',
  imports: [],
  templateUrl: './nav-exp.html',
  styleUrl: './nav-exp.css'
})
export class NavExp {
  items = [
    { key: 'filiacion', label: 'Filiación', icon: 'assets/icons/filiacion-vb.svg', iconActive: 'assets/icons/filiacion-va.svg' },
    { key: 'antecedentes', label: 'Antecedentes Médicos', icon: 'assets/icons/antecedentes-vb.svg', iconActive: 'assets/icons/antecedentes-va.svg' },
    { key: 'historial', label: 'Historial', icon: 'assets/icons/serv-trat-vb.svg', iconActive: 'assets/icons/serv-trat-va.svg' },
    { key: 'archivo', label: 'Archivo', icon: 'assets/icons/archivo-vb.svg', iconActive: 'assets/icons/archivo-va.svg' },
  ];

  selected = signal('filiacion');

  select(tab: string) {
    this.selected.set(tab);
  }

  // Barra animada 0–75%
  indicatorPosition = computed(() => {
    const index = this.items.findIndex(i => i.key === this.selected());
    return index * 25;
  });
}
