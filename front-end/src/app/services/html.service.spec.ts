import { HtmlService } from './html.service';
import { TestBed } from '@angular/core/testing';

describe('HtmlService', () => {
  let service: HtmlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HtmlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
