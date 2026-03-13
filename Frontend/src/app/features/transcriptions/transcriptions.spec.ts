import { TestBed } from "@angular/core/testing";
import { TranscriptionsComponent } from "./transcriptions";
import { TranscriptionService } from "./services/transcription";
import { WebSocketService } from "../../core/services/web-socket";
import { of, Subject } from "rxjs";

describe("TranscriptionsComponent", () => {
  let component: TranscriptionsComponent;
  let transcriptionServiceMock: {
    getAll: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    upload: ReturnType<typeof vi.fn>;
  };
  let webSocketServiceMock: {
    messages$: Subject<unknown>;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  let messagesSubject: Subject<unknown>;

  beforeEach(async () => {
    messagesSubject = new Subject();
    transcriptionServiceMock = {
      getAll: vi.fn().mockReturnValue(
        of({
          items: [],
          total: 0,
          limit: 10,
          offset: 0,
        }),
      ),
      getById: vi.fn(),
      upload: vi.fn(),
    };

    webSocketServiceMock = {
      messages$: messagesSubject.asObservable(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TranscriptionsComponent],
      providers: [
        { provide: TranscriptionService, useValue: transcriptionServiceMock },
        { provide: WebSocketService, useValue: webSocketServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TranscriptionsComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load history on init", () => {
    component.ngOnInit();
    expect(transcriptionServiceMock.getAll).toHaveBeenCalled();
  });

  it("should update jobs when websocket message received", () => {
    const mockJob = { id: "1", status: "PENDING", filename: "test.mp3" };
    transcriptionServiceMock.getAll.mockReturnValue(
      of({
        items: [mockJob],
        total: 1,
        limit: 10,
        offset: 0,
      }),
    );

    component.ngOnInit();
    messagesSubject.next({
      ticketId: "1",
      data: { status: "DONE", transcript: "Hello world" },
    });

    const updatedJob = component.jobs().find((j) => j.id === "1");
    expect(updatedJob?.status).toBe("DONE");
    expect(updatedJob?.transcript).toBe("Hello world");
  });
});
