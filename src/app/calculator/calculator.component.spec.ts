import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculatorComponent } from './calculator.component';

describe('CalculatorComponent', () => {
  let component: CalculatorComponent;
  let fixture: ComponentFixture<CalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CalculatorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize displayValue to "0"', () => {
    expect(component.displayValue).toBe('0');
  });

  it('should update displayValue on inputDigit', () => {
    component.inputDigit('5');
    expect(component.displayValue).toBe('5');
    component.inputDigit('+');
    expect(component.displayValue).toBe('5+');
    component.inputDigit('3');
    expect(component.displayValue).toBe('5+3');
  });

  it('should clear displayValue on clear', () => {
    component.inputDigit('5');
    component.clear();
    expect(component.displayValue).toBe('0');
  });

  it('should toggle sign of displayValue', () => {
    component.displayValue = '5';
    component.toggleSign();
    expect(component.displayValue).toBe('-5');
    component.toggleSign();
    expect(component.displayValue).toBe('5');
  });

  it('should calculate and emit result', () => {
    const emitSpy = spyOn(component.calculate, 'emit');
    component.displayValue = '5+3';
    component.calculateResult();
    expect(emitSpy).toHaveBeenCalledWith(8);
    expect(component.displayValue).toBe('0');
  });

  it('should handle calculation errors', () => {
    component.displayValue = '5+';
    component.calculateResult();
    expect(component.displayValue).toBe('Error');
  });
});
