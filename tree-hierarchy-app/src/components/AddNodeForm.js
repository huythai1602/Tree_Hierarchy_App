import React, { useState, useEffect, useRef } from 'react';
import { COLORS, NODE_CONFIG } from '../utils/constants';

const AddNodeForm = ({ position, onSave, onCancel }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
      setText('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  return (
    <g>
      {/* Form background */}
      <rect
        x={position.x}
        y={position.y + 50}
        width={NODE_CONFIG.WIDTH}
        height="30"
        rx="3"
        fill="white"
        stroke={COLORS.BUTTONS.EDIT}
        strokeWidth="2"
      />
      
      {/* Input field */}
      <foreignObject 
        x={position.x + 5} 
        y={position.y + 55} 
        width="100" 
        height="20"
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tên node mới"
          className="w-full text-xs border-none outline-none bg-transparent no-transition"
          onKeyDown={handleKeyPress}
          style={{ 
            fontSize: '12px',
            transition: 'none',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
          }}
        />
      </foreignObject>
      
      {/* Save button */}
      <circle
        cx={position.x + 125}
        cy={position.y + 65}
        r="8"
        fill={COLORS.BUTTONS.SAVE}
        className="cursor-pointer"
        onClick={handleSave}
        style={{ 
          transition: 'none',
          transform: 'translate3d(0, 0, 0)'
        }}
      />
      <text
        x={position.x + 125}
        y={position.y + 69}
        textAnchor="middle"
        className="text-xs fill-white cursor-pointer select-none"
        onClick={handleSave}
        style={{ 
          transition: 'none',
          transform: 'translate3d(0, 0, 0)'
        }}
      >
        ✓
      </text>
      
      {/* Cancel button */}
      <circle
        cx={position.x + 140}
        cy={position.y + 65}
        r="8"
        fill={COLORS.BUTTONS.DELETE}
        className="cursor-pointer"
        onClick={onCancel}
        style={{ 
          transition: 'none',
          transform: 'translate3d(0, 0, 0)'
        }}
      />
      <text
        x={position.x + 140}
        y={position.y + 69}
        textAnchor="middle"
        className="text-xs fill-white cursor-pointer select-none"
        onClick={onCancel}
        style={{ 
          transition: 'none',
          transform: 'translate3d(0, 0, 0)'
        }}
      >
        ✕
      </text>
    </g>
  );
};

export default AddNodeForm;