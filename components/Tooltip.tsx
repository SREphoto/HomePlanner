import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
      <div
        className="relative flex items-center"
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        {children}
        {isTooltipVisible && (
          <div
            className={`absolute z-50 w-max max-w-xs bg-slate-800 text-white text-xs rounded-md py-1.5 px-3 shadow-lg ${positionClasses[position]}`}
          >
            {text}
          </div>
        )}
      </div>
    );
  };

  export default Tooltip;
