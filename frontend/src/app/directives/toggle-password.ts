import { Directive, ElementRef, Renderer2, AfterViewInit, HostListener } from '@angular/core';

@Directive({
    selector: '[appTogglePassword]'
})
export class TogglePasswordDirective implements AfterViewInit {
private visible = true;
private icon!: HTMLElement;

constructor(private el: ElementRef, private renderer: Renderer2) {}

    ngAfterViewInit() { //permite ejecutar código después de que Angular renderiza la vista
        const parent = this.el.nativeElement.parentElement;

        // Contenedor relativo necesario para posicionamiento
        this.renderer.setStyle(parent, 'position', 'relative');

        const input = this.el.nativeElement as HTMLInputElement;
        const inputHeight = input.offsetHeight + 'px'; // altura real del input

        // Crear botón
        this.icon = this.renderer.createElement('button');
        this.renderer.setAttribute(this.icon, 'type', 'button');

        // Posicionamiento absoluto y centrado vertical
        this.renderer.setStyle(this.icon, 'position', 'absolute');
        this.renderer.setStyle(this.icon, 'right', '0.75rem');
        this.renderer.setStyle(this.icon, 'top', '50%');
        this.renderer.setStyle(this.icon, 'transform', 'translateY(16%)');
        this.renderer.setStyle(this.icon, 'display', 'flex');
        this.renderer.setStyle(this.icon, 'alignItems', 'center');
        this.renderer.setStyle(this.icon, 'justifyContent', 'center');


        // Estilos visuales
        this.renderer.setStyle(this.icon, 'color', '#545454'); // text-gray-500
        this.renderer.setStyle(this.icon, 'background', 'transparent');
        this.renderer.setStyle(this.icon, 'border', 'none');
        this.renderer.setStyle(this.icon, 'cursor', 'pointer');
        this.renderer.setStyle(this.icon, 'outline', 'none');

        // Ícono dentro del botón
        const img = this.renderer.createElement('img');
        this.renderer.setAttribute(img, 'src', 'assets/icons/eye.svg');
        this.renderer.setStyle(img, 'width', '1.5rem');
        this.renderer.setStyle(img, 'height', '1.5rem');
        this.renderer.appendChild(this.icon, img);

        // Agregar botón al padre del input
        this.renderer.appendChild(parent, this.icon);

        // Listener solo al botón
        this.renderer.listen(this.icon, 'click', (event) => {
            event.preventDefault();
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

        // Actualizar tooltip
        this.renderer.setAttribute(this.icon, 'title', this.visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    }
    
}
