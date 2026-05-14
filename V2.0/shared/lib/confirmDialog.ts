import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

/**
 * Cross-platform confirmation dialog.
 *
 * React Native's Alert.alert with multiple buttons does not render reliably on
 * React Native Web — it often silently no-ops or renders only the message
 * without action buttons, so the destructive callback never fires.
 * This helper falls back to window.confirm on web.
 *
 * Resolves true if the user confirmed, false otherwise.
 */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  const {
    title,
    message,
    confirmText = 'אישור',
    cancelText = 'ביטול',
    destructive = false,
  } = opts;

  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.confirm === 'function'
  ) {
    const fullMessage = title ? `${title}\n\n${message}` : message;
    return Promise.resolve(window.confirm(fullMessage));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
