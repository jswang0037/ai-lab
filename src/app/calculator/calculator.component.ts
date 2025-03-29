import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent {
  @Output() calculate = new EventEmitter<number>();

  displayValue = '0';

  inputDigit(digit: string) {
    if (this.displayValue === '0') {
      this.displayValue = digit;
    } else {
      this.displayValue += digit;
    }
  }

  clear() {
    this.displayValue = '0';
  }

  toggleSign() {
    this.displayValue = (parseFloat(this.displayValue) * -1).toString();
  }

  calculateResult() {
    try {
      const result = eval(this.displayValue);
      this.calculate.emit(result);
      this.displayValue = '0';
    } catch (error) {
      this.displayValue = 'Error';
    }
  }
}
