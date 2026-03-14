import { TestBed } from "@angular/core/testing";
import { UploadAreaComponent } from "./upload-area";

describe("UploadAreaComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadAreaComponent],
    }).compileComponents();
  });

  it("emits a selected file from input change", () => {
    const fixture = TestBed.createComponent(UploadAreaComponent);
    const component = fixture.componentInstance;
    const emitSpy = vi.spyOn(component.fileSelected, "emit");
    const file = new File(["audio"], "sample.webm", { type: "audio/webm" });
    const input = document.createElement("input");

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });

    component.onFileSelected({ target: input } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledWith(file);
    expect(input.value).toBe("");
  });

  it("emits the recorded file when sendRecording is called", () => {
    const fixture = TestBed.createComponent(UploadAreaComponent);
    const component = fixture.componentInstance;
    const emitSpy = vi.spyOn(component.fileSelected, "emit");
    const recordedFile = new File(["audio"], "recording.webm", {
      type: "audio/webm",
    });
    const revokeSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    (component as never as { recordedFile: File | null }).recordedFile =
      recordedFile;
    (component as never as { previewUrl: string | null }).previewUrl =
      "blob:test-url";

    component.sendRecording();

    expect(emitSpy).toHaveBeenCalledWith(recordedFile);
    expect(
      (component as never as { recordedFile: File | null }).recordedFile,
    ).toBeNull();
    expect(
      (component as never as { previewUrl: string | null }).previewUrl,
    ).toBeNull();
    expect(revokeSpy).toHaveBeenCalledWith("blob:test-url");
  });

  it("clears the preview when discardRecording is called", () => {
    const fixture = TestBed.createComponent(UploadAreaComponent);
    const component = fixture.componentInstance;
    const revokeSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    (component as never as { recordedFile: File | null }).recordedFile =
      new File(["audio"], "recording.webm", { type: "audio/webm" });
    (component as never as { previewUrl: string | null }).previewUrl =
      "blob:test-url";
    (component as never as { errorMessage: string | null }).errorMessage =
      "Old error";

    component.discardRecording();

    expect(
      (component as never as { recordedFile: File | null }).recordedFile,
    ).toBeNull();
    expect(
      (component as never as { previewUrl: string | null }).previewUrl,
    ).toBeNull();
    expect(
      (component as never as { errorMessage: string | null }).errorMessage,
    ).toBeNull();
    expect(revokeSpy).toHaveBeenCalledWith("blob:test-url");
  });
});
