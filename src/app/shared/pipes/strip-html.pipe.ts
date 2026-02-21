import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'stripHtml', standalone: false })
export class StripHtmlPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    const el = document.createElement('div');
    el.innerHTML = value;
    return el.textContent ?? '';
  }
}
