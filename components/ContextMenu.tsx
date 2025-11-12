
import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  actions: {
    label: string;
    action: () => void;
  }[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, actions }) => {
  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-md shadow-lg p-1 animate-fade-in-fast"
      style={{ top: y, left: x }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {actions.map((action, index) => (
          <li
            key={index}
            className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            onClick={action.action}
          >
            {action.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
