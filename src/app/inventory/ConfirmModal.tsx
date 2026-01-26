import React from "react";

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, onConfirm, onCancel, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] max-w-xs text-center">
        <div className="mb-6 text-base font-semibold text-neutral-800">
          {message || "Are you sure?"}
        </div>
        <div className="flex justify-center gap-4">
          <button
            className="px-4 py-2 rounded bg-black text-white font-bold hover:bg-neutral-800 transition-colors"
            onClick={onConfirm}
          >
            YES
          </button>
          <button
            className="px-4 py-2 rounded border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-100 transition-colors"
            onClick={onCancel}
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
};
