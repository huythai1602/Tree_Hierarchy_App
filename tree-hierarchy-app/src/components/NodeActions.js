// File: src/components/NodeActions.js (SMOOTH VERSION - NO LAG)
import React from 'react';
import { COLORS } from '../utils/constants';

const NodeActions = ({ 
  nodeId, 
  isRoot, 
  isEditing, 
  isMoving,
  isDisconnected,
  isConnecting,
  position,
  onAdd,
  onEdit,
  onSave,
  onMove,
  onCancelMove,
  onDelete,
  onDisconnect,
  onConnect,
  onCancelConnect
}) => {
  const buttonY = position.y + 10;
  const buttonSize = 8; // Slightly larger for easier clicking
  
  // Common button styles with smooth transitions
  const getButtonStyle = (baseColor, hoverColor) => ({
    cursor: 'pointer',
    transition: 'fill 0.15s ease, filter 0.15s ease', // Shorter, smoother transition
    filter: 'none'
  });

  return (
    <g className="node-actions" style={{ pointerEvents: 'auto' }}>
      {/* Add button */}
      <circle
        cx={position.x + 140}
        cy={buttonY}
        r={buttonSize}
        fill={COLORS.BUTTONS.ADD}
        style={getButtonStyle(COLORS.BUTTONS.ADD, '#059669')}
        className="action-button add-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAdd();
        }}
        onMouseEnter={(e) => {
          e.target.style.fill = '#059669';
          e.target.style.filter = 'brightness(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.fill = COLORS.BUTTONS.ADD;
          e.target.style.filter = 'none';
        }}
      />
      <text
        x={position.x + 140}
        y={buttonY + 3}
        textAnchor="middle"
        className="button-text"
        fill="white"
        fontSize="10"
        fontWeight="bold"
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        +
      </text>
      
      {/* Edit/Save button */}
      <circle
        cx={position.x + 125}
        cy={buttonY}
        r={buttonSize}
        fill={isEditing ? COLORS.BUTTONS.SAVE : COLORS.BUTTONS.EDIT}
        style={getButtonStyle()}
        className="action-button edit-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isEditing) {
            onSave();
          } else {
            onEdit();
          }
        }}
        onMouseEnter={(e) => {
          e.target.style.fill = isEditing ? '#059669' : '#2563eb';
          e.target.style.filter = 'brightness(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.fill = isEditing ? COLORS.BUTTONS.SAVE : COLORS.BUTTONS.EDIT;
          e.target.style.filter = 'none';
        }}
      />
      <text
        x={position.x + 125}
        y={buttonY + 3}
        textAnchor="middle"
        className="button-text"
        fill="white"
        fontSize="9"
        fontWeight="600"
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        {isEditing ? '✓' : '✎'}
      </text>
      
      {/* Connect/Move button - chỉ hiện khi không phải root */}
      {!isRoot && (
        <>
          <circle
            cx={position.x + 110}
            cy={buttonY}
            r={buttonSize}
            fill={
              isConnecting ? '#ef4444' : 
              isDisconnected ? '#10b981' : 
              isMoving ? '#ef4444' : 
              COLORS.BUTTONS.MOVE
            }
            style={getButtonStyle()}
            className="action-button move-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isConnecting) {
                onCancelConnect();
              } else if (isDisconnected) {
                onConnect(nodeId);
              } else if (isMoving) {
                onCancelMove();
              } else {
                onMove();
              }
            }}
            onMouseEnter={(e) => {
              const currentColor = e.target.getAttribute('fill');
              e.target.style.filter = 'brightness(1.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.filter = 'none';
            }}
          />
          <text
            x={position.x + 110}
            y={buttonY + 3}
            textAnchor="middle"
            className="button-text"
            fill="white"
            fontSize="8"
            fontWeight="600"
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'system-ui, sans-serif'
            }}
          >
            {isConnecting ? '✕' : isDisconnected ? '🔗' : isMoving ? '✕' : '↔'}
          </text>
        </>
      )}
      
      {/* Disconnect/Delete button - chỉ hiện khi không phải root */}
      {!isRoot && (
        <>
          <circle
            cx={position.x + 95}
            cy={buttonY}
            r={buttonSize}
            fill={isDisconnected ? COLORS.BUTTONS.DELETE : '#ff8c00'}
            style={getButtonStyle()}
            className="action-button disconnect-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isDisconnected) {
                onDelete();
              } else {
                onDisconnect();
              }
            }}
            onMouseEnter={(e) => {
              e.target.style.fill = isDisconnected ? '#dc2626' : '#e07600';
              e.target.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.fill = isDisconnected ? COLORS.BUTTONS.DELETE : '#ff8c00';
              e.target.style.filter = 'none';
            }}
          />
          <text
            x={position.x + 95}
            y={buttonY + 3}
            textAnchor="middle"
            className="button-text"
            fill="white"
            fontSize="8"
            fontWeight="600"
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'system-ui, sans-serif'
            }}
          >
            {isDisconnected ? '✕' : '⚡'}
          </text>
        </>
      )}
      
      {/* Status indicator for disconnected nodes */}
      {isDisconnected && (
        <>
          <circle
            cx={position.x + 80}
            cy={buttonY}
            r="5"
            fill="#fbbf24"
            className="status-indicator"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
              pointerEvents: 'none'
            }}
          />
          <text
            x={position.x + 80}
            y={buttonY + 2}
            textAnchor="middle"
            className="status-text"
            fill="white"
            fontSize="7"
            fontWeight="bold"
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'system-ui, sans-serif'
            }}
          >
            !
          </text>
        </>
      )}

      {/* Invisible larger hit area for easier clicking */}
      <g className="hit-areas" style={{ pointerEvents: 'auto' }}>
        {/* Add button hit area */}
        <circle
          cx={position.x + 140}
          cy={buttonY}
          r="12"
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd();
          }}
        />
        
        {/* Edit button hit area */}
        <circle
          cx={position.x + 125}
          cy={buttonY}
          r="12"
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isEditing) {
              onSave();
            } else {
              onEdit();
            }
          }}
        />
        
        {/* Move button hit area */}
        {!isRoot && (
          <circle
            cx={position.x + 110}
            cy={buttonY}
            r="12"
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isConnecting) {
                onCancelConnect();
              } else if (isDisconnected) {
                onConnect(nodeId);
              } else if (isMoving) {
                onCancelMove();
              } else {
                onMove();
              }
            }}
          />
        )}
        
        {/* Disconnect/Delete button hit area */}
        {!isRoot && (
          <circle
            cx={position.x + 95}
            cy={buttonY}
            r="12"
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isDisconnected) {
                onDelete();
              } else {
                onDisconnect();
              }
            }}
          />
        )}
      </g>
    </g>
  );
};

export default NodeActions;