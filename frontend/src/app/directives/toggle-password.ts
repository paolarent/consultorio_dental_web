import { Directive, ElementRef, Renderer2, AfterViewInit, HostListener } from '@angular/core';

@Directive({
    selector: '[appTogglePassword]'
})
export class TogglePasswordDirective implements AfterViewInit {
    private visible = false;
    private icon!: HTMLElement;

    constructor(private el: ElementRef, private renderer: Renderer2) {}

    ngAfterViewInit() {
        const parent = this.el.nativeElement.parentElement;

        // Crear botón
        this.icon = this.renderer.createElement('button');
        this.renderer.setAttribute(this.icon, 'type', 'button');
        this.renderer.setAttribute(this.icon, 'title', 'Mostrar contraseña');
        
        // Posicionamiento - centrado vertical
        this.renderer.setStyle(this.icon, 'position', 'absolute');
        this.renderer.setStyle(this.icon, 'right', '0.75rem');
        this.renderer.setStyle(this.icon, 'top', '50%');
        this.renderer.setStyle(this.icon, 'transform', 'translateY(-50%)');
        this.renderer.setStyle(this.icon, 'display', 'flex');
        this.renderer.setStyle(this.icon, 'alignItems', 'center');
        this.renderer.setStyle(this.icon, 'justifyContent', 'center');
        
        // Estilos del botón
        this.renderer.setStyle(this.icon, 'background', 'transparent');
        this.renderer.setStyle(this.icon, 'border', 'none');
        this.renderer.setStyle(this.icon, 'cursor', 'pointer');
        this.renderer.setStyle(this.icon, 'outline', 'none');
        this.renderer.setStyle(this.icon, 'zIndex', '10');

        // Crear imagen del ícono
        const img = this.renderer.createElement('img');
        this.renderer.setAttribute(img, 'src', 'assets/icons/eye.svg');
        this.renderer.setStyle(img, 'width', '1.5rem');
        this.renderer.setStyle(img, 'height', '1.5rem');
        this.renderer.setStyle(img, 'pointerEvents', 'none');
        this.renderer.appendChild(this.icon, img);

        // Agregar botón al contenedor padre (debe tener div relative)
        this.renderer.appendChild(parent, this.icon);

        // Evento click
        this.renderer.listen(this.icon, 'click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleVisibility();
        });
    }

    private toggleVisibility() {
        this.visible = !this.visible;
        const input = this.el.nativeElement as HTMLInputElement;
        this.renderer.setAttribute(input, 'type', this.visible ? 'text' : 'password');

        const img = this.icon.querySelector('img');
        if (img) {
            this.renderer.setAttribute(
                img,
                'src',
                this.visible ? 'assets/icons/eye-off.svg' : 'assets/icons/eye.svg'
            );
        }

        this.renderer.setAttribute(
            this.icon, 
            'title', 
            this.visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
        );
    }
}
