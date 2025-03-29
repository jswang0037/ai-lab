import { Component, Input } from '@angular/core';

 ...<snip>... 
export class ResultComponent {
  @Input() result: number | null = null;
}
