type CancelEvent = { target: unknown; currentTarget: unknown; preventDefault(): void };

// React bubbles `cancel` from nested dialogs (e.g. delete confirmation); only handle the modal's own.
export function handleModalCancel(event: CancelEvent, dismiss: () => void) {
  if (event.target !== event.currentTarget) return;
  event.preventDefault();
  dismiss();
}
