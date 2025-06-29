import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytes',
  standalone: true
})
export class BytesPipe implements PipeTransform {

  transform(bytes: number | null | undefined, precision: number = 2): string {
    if (bytes === null || bytes === undefined || isNaN(bytes)) {
      return '0 B';
    }

    if (bytes === 0) {
      return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    if (i === 0) {
      return `${bytes} B`;
    }

    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(precision)} ${sizes[i]}`;
  }

}
