import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'telefono'
})
export class TelefonoPipe implements PipeTransform {
    transform(value: string): string {
        if (!value || value.length !== 10) return value;
        const area = value.slice(0, 3);
        const mid = value.slice(3, 6);
        const last = value.slice(6);
        return `${area} ${mid} ${last}`;
    }
}
