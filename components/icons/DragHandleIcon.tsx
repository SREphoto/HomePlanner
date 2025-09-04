import React from 'react';

const DragHandleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
        <circle cx="9" cy="9" r="2"></circle>
        <circle cx="15" cy="9" r="2"></circle>
        <circle cx="9" cy="15" r="2"></circle>
        <circle cx="15" cy="15" r="2"></circle>
    </svg>
);

export default DragHandleIcon;
