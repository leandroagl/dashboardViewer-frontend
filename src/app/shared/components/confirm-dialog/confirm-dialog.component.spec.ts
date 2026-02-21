import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;
  let dialogRef: jest.Mocked<MatDialogRef<ConfirmDialogComponent>>;

  const defaultData: ConfirmDialogData = {
    title:   'Confirmar acción',
    message: '¿Estás seguro?',
  };

  const setup = (data: ConfirmDialogData = defaultData) => {
    dialogRef = { close: jest.fn() } as unknown as jest.Mocked<MatDialogRef<ConfirmDialogComponent>>;

    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef,    useValue: dialogRef },
      ],
    });

    fixture   = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('renders title and message', () => {
    setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain(defaultData.title);
    expect(el.textContent).toContain(defaultData.message);
  });

  it('uses default confirm label when none provided', () => {
    setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Confirmar');
  });

  it('uses custom confirm label when provided', () => {
    setup({ ...defaultData, confirmLabel: 'Eliminar' });
    expect(fixture.nativeElement.textContent).toContain('Eliminar');
  });

  it('closes with true when confirm is clicked', () => {
    setup();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const confirmBtn = Array.from(buttons).find(b => b.textContent?.includes('Confirmar'));
    confirmBtn?.click();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('closes with false when cancel is clicked', () => {
    setup();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const cancelBtn = Array.from(buttons).find(b => b.textContent?.includes('Cancelar'));
    cancelBtn?.click();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('shows warning icon when isDanger is true', () => {
    setup({ ...defaultData, isDanger: true });
    const icon: HTMLElement = fixture.nativeElement.querySelector('mat-icon');
    expect(icon?.textContent).toContain('warning');
  });

  it('shows help icon when isDanger is false', () => {
    setup({ ...defaultData, isDanger: false });
    const icon: HTMLElement = fixture.nativeElement.querySelector('mat-icon');
    expect(icon?.textContent).toContain('help_outline');
  });
});
