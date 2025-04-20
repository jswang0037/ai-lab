import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { ChatService, Content, Question, ParseResponse, ExercisePlan, DailyNutrition } from './chat.service';
import { environment } from '../../environments/environment'; // Import environment

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  // Use the same URL logic as the service
  const backendUrl = environment.backendUrl; // Assuming environment is set up correctly for tests
  const chatUrl = `${backendUrl}/chat`;
  const parseUrl = `${backendUrl}/parse`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Import the testing module
      providers: [ChatService] // Provide the service to be tested
    });
    // Inject the service, the testing controller, and HttpClient
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient); // Can be useful for some tests
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Tests for sendChatMessage ---

  it('sendChatMessage should send POST request to /chat and return text response', () => {
    const mockHistory: Content[] = [{ role: 'user', text: 'Hello' }];
    const mockText = 'How are you?';
    const mockResponse = 'I am fine, thank you!';
    const expectedPayload = { contents: mockHistory, text: mockText };

    service.sendChatMessage(mockHistory, mockText).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    // Expect one request to the chat URL
    const req = httpMock.expectOne(chatUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(expectedPayload);
    expect(req.request.responseType).toEqual('text'); // Verify responseType is text

    // Flush the mock response
    req.flush(mockResponse);
  });

  it('sendChatMessage should handle HTTP 500 error', () => {
    const mockHistory: Content[] = [{ role: 'user', text: 'Hi' }];
    const mockText = 'Error test';
    const errorDetail = 'Internal Server Error Occurred';

    service.sendChatMessage(mockHistory, mockText).subscribe({
      next: () => fail('should have failed with the 500 error'),
      error: (error: Error) => {
        expect(error).toBeTruthy();
        // Check the error message format from handleError
        expect(error.message).toContain('Server returned code 500');
        expect(error.message).toContain(errorDetail);
      }
    });

    const req = httpMock.expectOne(chatUrl);
    expect(req.request.method).toBe('POST');

    // Respond with a mock error
    req.flush({ detail: errorDetail }, { status: 500, statusText: 'Server Error' });
  });

   it('sendChatMessage should handle HTTP 400 error with plain text', () => {
    const mockHistory: Content[] = [{ role: 'user', text: 'Bad' }];
    const mockText = 'Request';
    const errorText = 'Invalid input format';

    service.sendChatMessage(mockHistory, mockText).subscribe({
      next: () => fail('should have failed with the 400 error'),
      error: (error: Error) => {
        expect(error).toBeTruthy();
        expect(error.message).toContain('Server returned code 400');
        expect(error.message).toContain(errorText); // Check if plain text error is included
      }
    });

    const req = httpMock.expectOne(chatUrl);
    expect(req.request.method).toBe('POST');

    // Respond with plain text error
    req.flush(errorText, { status: 400, statusText: 'Bad Request' });
  });


  // --- Tests for parseResponseText ---

  it('parseResponseText should send POST request to /parse and return Question array', () => {
    const mockText = 'Parse this question';
    const mockResponse: Question[] = [{ text: 'What is your goal?', options: ['A', 'B'] }];
    const expectedPayload = { text: mockText };

    service.parseResponseText(mockText).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(Array.isArray(response)).toBeTrue(); // Verify it's an array
    });

    const req = httpMock.expectOne(parseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(expectedPayload);
    expect(req.request.responseType).toEqual('json'); // Default

    req.flush(mockResponse);
  });

  it('parseResponseText should send POST request to /parse and return Plan object', () => {
    const mockText = 'Generate a plan';
    // Define mock plans conforming to the interfaces
    const mockExercisePlan: ExercisePlan = {
      notes: "Test exercise plan",
      weeklySchedule: [{ dayOfWeek: "Monday", workoutType: "Test", estimatedDurationMinutes: 60, exercises: [] }]
    };
    const mockNutritionPlan: DailyNutrition = {
      notes: "Test nutrition plan",
      dailyTargets: { targetCalories: 2000, proteinInGrams: 150, carbohydrateInGrams: 200, fatInGrams: 60, waterInMilliliters: 3000 }
    };
    const mockResponse: ParseResponse = { exercisePlan: mockExercisePlan, nutritionPlan: mockNutritionPlan };
    const expectedPayload = { text: mockText };

    service.parseResponseText(mockText).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(Array.isArray(response)).toBeFalse(); // Verify it's not an array
      expect((response as any).exercisePlan).toEqual(mockExercisePlan);
      expect((response as any).nutritionPlan).toEqual(mockNutritionPlan);
    });

    const req = httpMock.expectOne(parseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(expectedPayload);

    req.flush(mockResponse);
  });

  it('parseResponseText should handle HTTP 500 error', () => {
    const mockText = 'Error test parse';
    const errorDetail = 'Parsing failed on server';

    service.parseResponseText(mockText).subscribe({
      next: () => fail('should have failed with the 500 error'),
      error: (error: Error) => {
        expect(error).toBeTruthy();
        expect(error.message).toContain('Server returned code 500');
        expect(error.message).toContain(errorDetail);
      }
    });

    const req = httpMock.expectOne(parseUrl);
    expect(req.request.method).toBe('POST');

    req.flush({ detail: errorDetail }, { status: 500, statusText: 'Server Error' });
  });

  // Add more tests for different error scenarios (404, network error, etc.) if needed

});
