import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing'; // Import testing utilities
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { HttpClientTestingModule } from '@angular/common/http/testing'; // Needed for service dependency
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; // To ignore custom elements like app-training

import { ChatService, Content, Question, ParseResponse, ExercisePlan, DailyNutrition } from './services/chat.service'; // Import service and types
import { of, throwError } from 'rxjs'; // Import RxJS operators for mocking

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockChatService: jasmine.SpyObj<ChatService>;

  const initialQuestion: Question[] = [{ text: '你好，請問需要什麼服務？', options: ['增肌', '減脂'] }];
  const planResponse: ParseResponse = {
    exercisePlan: { notes: 'Ex Plan', weeklySchedule: [] },
    nutritionPlan: { notes: 'Nu Plan', dailyTargets: { targetCalories: 1, proteinInGrams: 1, carbohydrateInGrams: 1, fatInGrams: 1, waterInMilliliters: 1} }
  };

  beforeEach(() => {
    // Create a mock ChatService object with spy methods
    mockChatService = jasmine.createSpyObj('ChatService', ['sendChatMessage', 'parseResponseText']);

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        FormsModule, // Add FormsModule
        HttpClientTestingModule // Add HttpClientTestingModule
      ],
      declarations: [AppComponent],
      providers: [
        // Provide the mock service instead of the real one
        { provide: ChatService, useValue: mockChatService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // Add CUSTOM_ELEMENTS_SCHEMA
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

    // Setup default mock return values before each test if needed
    // Example: Simulate initial parse response for ngOnInit's chat call
    mockChatService.sendChatMessage.and.returnValue(of('你好，請問需要什麼服務？')); // Mock initial chat response
    mockChatService.parseResponseText.and.returnValue(of(initialQuestion)); // Mock initial parse response

  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'ai-lab'`, () => {
    expect(component.title).toEqual('ai-lab');
  });

  // Test ngOnInit
  it('ngOnInit should call chat service and update state', fakeAsync(() => {
    component.ngOnInit(); // Trigger ngOnInit
    tick(); // Simulate the passage of time for async operations (observables)

    // Verify sendChatMessage was called
    expect(mockChatService.sendChatMessage).toHaveBeenCalledWith([], '你好');

    // Verify parseResponseText was called with the response from sendChatMessage
    expect(mockChatService.parseResponseText).toHaveBeenCalledWith('你好，請問需要什麼服務？');

    // Verify component state after mocks resolve
    expect(component.isLoading).toBeFalse();
    expect(component.history.length).toBe(2); // User '你好' and Model response
    expect(component.history[0]).toEqual({ role: 'user', text: '你好' });
    expect(component.history[1]).toEqual({ role: 'model', text: '你好，請問需要什麼服務？' });
    expect(component.questions).toEqual(initialQuestion);
    expect(component.errorMessage).toBeNull();
  }));

  // Test submit with selectedOption
  it('submit should call chat service with selectedOption', fakeAsync(() => {
    component.selectedOption = '增肌'; // Set component state
    component.userTextInput = ''; // Ensure text input is empty

    // Mock the service calls for this specific scenario
    mockChatService.sendChatMessage.and.returnValue(of('好的，目標設定為增肌。'));
    mockChatService.parseResponseText.and.returnValue(of([{text: '下一步？', options:[]}]));

    component.submit();
    tick();

    expect(mockChatService.sendChatMessage).toHaveBeenCalledWith(jasmine.any(Array), '增肌'); // Verify text sent
    expect(component.isLoading).toBeFalse();
    expect(component.history.length).toBeGreaterThanOrEqual(2); // Should have at least user+model
    expect(component.history[component.history.length-2].text).toEqual('增肌'); // User message
    expect(component.history[component.history.length-1].text).toEqual('好的，目標設定為增肌。'); // Model response
    expect(component.questions).toEqual([{text: '下一步？', options:[]}]);
    expect(component.errorMessage).toBeNull();
    expect(component.selectedOption).toBeNull(); // Should reset
  }));

  // Test submit with userTextInput
  it('submit should call chat service with userTextInput', fakeAsync(() => {
    component.selectedOption = null;
    component.userTextInput = '自訂目標'; // Set component state

    mockChatService.sendChatMessage.and.returnValue(of('收到自訂目標。'));
    mockChatService.parseResponseText.and.returnValue(of([{text: '下一步？', options:[]}]));

    component.submit();
    tick();

    expect(mockChatService.sendChatMessage).toHaveBeenCalledWith(jasmine.any(Array), '自訂目標');
    expect(component.isLoading).toBeFalse();
    expect(component.history[component.history.length-2].text).toEqual('自訂目標');
    expect(component.history[component.history.length-1].text).toEqual('收到自訂目標。');
    expect(component.errorMessage).toBeNull();
    expect(component.userTextInput).toBe(''); // Should reset
  }));

   // Test submit with no input
  it('submit should not call chat service and set error if no input', () => {
    component.selectedOption = null;
    component.userTextInput = '';

    component.submit();

    expect(mockChatService.sendChatMessage).not.toHaveBeenCalled(); // Ensure service wasn't called
    expect(component.errorMessage).toEqual("Please select an option or enter text.");
  });


  // Test receiving plans from parseResponseText
  it('should update plans when parseResponseText returns plans', fakeAsync(() => {
     // Simulate the chat call leading to a plan response
    mockChatService.sendChatMessage.and.returnValue(of('這是你的計畫。'));
    mockChatService.parseResponseText.and.returnValue(of(planResponse));

    component.chat('完成問卷'); // Trigger the sequence
    tick();

    expect(component.isLoading).toBeFalse();
    expect(component.history[component.history.length-1].text).toEqual('這是你的計畫。');
    expect(component.exercisePlan).toEqual(planResponse.exercisePlan!);
    expect(component.nutritionPlan).toEqual(planResponse.nutritionPlan!);
    expect(component.questions.length).toBe(1); // Should show follow-up question
    expect(component.questions[0].text).toContain("Here is your plan");
    expect(component.errorMessage).toBeNull();
  }));

  // Test error handling from sendChatMessage
  it('should set errorMessage when sendChatMessage fails', fakeAsync(() => {
    const errorMsg = 'Network Error';
    mockChatService.sendChatMessage.and.returnValue(throwError(() => new Error(errorMsg)));

    component.chat('你好');
    tick();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toEqual(`Error sending message: ${errorMsg}`);
    // History might contain the optimistic user message, depending on implementation choice
    expect(component.history.length).toBe(1); // Only the user message added before failure
  }));

    // Test error handling from parseResponseText
  it('should set errorMessage when parseResponseText fails', fakeAsync(() => {
    const errorMsg = 'Parsing Failed';
    mockChatService.sendChatMessage.and.returnValue(of('Some model response'));
    // Simulate parse failure after successful chat send
    mockChatService.parseResponseText.and.returnValue(throwError(() => new Error(errorMsg)));

    component.chat('Trigger parse error');
    tick(); // Complete sendChatMessage
    tick(); // Complete parseResponseText

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toEqual(`Error processing response: ${errorMsg}`);
    expect(component.history.length).toBe(2); // User and model message added
    expect(component.questions).toEqual([{ text: "An error occurred. Please try again.", options: [] }]); // Error state question
  }));

  // Remove the default title rendering test as it's less relevant now
  // it('should render title', () => { ... });
});
