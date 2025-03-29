import { ComponentFixture, TestBed } from '@angular/core/testing';

 ...<snip>... 

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the result', () => {
    component.result = 10;
    fixture.detectChanges();
    const resultElement: HTMLElement = fixture.nativeElement.querySelector('.result');
    expect(resultElement.textContent).toContain('Result: 10');
  });
});
