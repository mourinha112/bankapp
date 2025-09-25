import React, { useState } from 'react';
import CustomAlert from '../components/CustomAlert';

interface AlertConfig {
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
}

export function useCustomAlert() {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
  };

  const hideAlert = () => {
    setAlertConfig(null);
  };

  const AlertComponent = () => {
    if (!alertConfig) return null;

    return React.createElement(CustomAlert, {
      visible: !!alertConfig,
      type: alertConfig.type,
      title: alertConfig.title,
      message: alertConfig.message,
      confirmText: alertConfig.confirmText,
      onClose: hideAlert,
      onConfirm: alertConfig.onConfirm,
    });
  };

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
}