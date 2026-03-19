"use client";

import { useState } from "react";

type ModalState = {
  closeDisconnectModal: () => void;
  closeLoginModal: () => void;
  isDisconnectModalOpen: boolean;
  isLoginModalOpen: boolean;
  openDisconnectModal: () => void;
  openLoginModal: () => void;
};

export function useModalState(): ModalState {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

  return {
    closeDisconnectModal: () => setIsDisconnectModalOpen(false),
    closeLoginModal: () => setIsLoginModalOpen(false),
    isDisconnectModalOpen,
    isLoginModalOpen,
    openDisconnectModal: () => setIsDisconnectModalOpen(true),
    openLoginModal: () => setIsLoginModalOpen(true),
  };
}
