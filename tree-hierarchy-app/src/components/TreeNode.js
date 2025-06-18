// File: src/components/TreeNode.js (COMPLETE LOCAL TRUNCATION VERSION)
import React, { useState, useRef, useEffect } from 'react';
import NodeActions from './NodeActions';
import AddNodeForm from './AddNodeForm';
import { COLORS, NODE_CONFIG } from '../utils/constants';

// Truncate text helper function ONLY for display in TreeNode
const truncateTextForDisplay = (text, maxLength = 15) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

const TreeNode = ({
  nodeId,
  node,
  position,
  isMovingTarget,
  isConnectTarget,
  isMoving,
  isConnecting,
  isDisconnected,
  onAddNode,
  onEditNode,
  onMoveNode,
  onDeleteNode,
  onDisconnectNode,
  onConnectNode,
  onNodeClick,
  // Drag & Drop props
  isDragging,
  onDragStart
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);
  
  const isRoot = nodeId === 'root';
  const isDraggingThis = isDragging && isDragging === nodeId;
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Get display text (truncated) vs full text (for tooltip/editing)
  const displayText = truncateTextForDisplay(node.text, 15);
  const isTextTruncated = node.text.length > 15;
  
  // Debug logging for text truncation
  if (nodeId === 'root' || node.text.length > 100) {
    console.log(`🔤 TreeNode ${nodeId}:`, {
      originalLength: node.text.length,
      displayLength: displayText.length,
      isTruncated: isTextTruncated,
      preview: node.text.substring(0, 50) + '...'
    });
  }

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditText(node.text); // CRITICAL: Use FULL text for editing, not truncated
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEditNode(nodeId, editText.trim());
    }
    setIsEditing(false);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleAddNode = (text) => {
    onAddNode(nodeId, text);
    setShowAddForm(false);
  };

  const handleNodeClick = () => {
    if (isMovingTarget || isConnectTarget) {
      onNodeClick(nodeId);
    }
  };

  // Simplified drag handler
  const handleMouseDown = (e) => {
    if (isEditing || showAddForm || isConnecting) return;
    
    if (e.target.tagName === 'circle' || e.target.tagName === 'text') {
      const nodeRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - nodeRect.left;
      
      if (clickX > NODE_CONFIG.WIDTH - 70) { // Extended button area
        return;
      }
    }

    try {
      onDragStart(nodeId, e, position);
    } catch (error) {
      console.error('Error starting drag for node:', nodeId, error);
    }
  };

  // Determine node styling based on state
  const getNodeFill = () => {
    if (isDraggingThis) return '#fef3c7';
    if (isConnecting) return 'url(#connectingGradient)';
    if (isDisconnected) return 'url(#disconnectedGradient)';
    if (isMovingTarget || isConnectTarget) return '#e0f2fe';
    if (isHovered && !isEditing) return isRoot ? '#fed7d7' : '#f0f9ff';
    return isRoot ? 'url(#rootGradient)' : 'url(#normalGradient)';
  };

  const getNodeStroke = () => {
    if (isDraggingThis) return '#f59e0b';
    if (isConnecting) return '#10b981';
    if (isDisconnected) return '#f59e0b';
    if (isMovingTarget || isConnectTarget) return COLORS.MOVING_BORDER;
    if (isHovered) return '#60a5fa';
    return isRoot ? COLORS.ROOT_BORDER : COLORS.NORMAL_BORDER;
  };

  const getStrokeWidth = () => {
    if (isDraggingThis || isMovingTarget || isConnectTarget || isConnecting) return "3";
    if (isDisconnected) return "2";
    if (isHovered) return "2";
    return "1";
  };

  const getCursor = () => {
    if (isDraggingThis) return 'grabbing';
    if (isMovingTarget || isConnectTarget) return 'pointer';
    if (isEditing || showAddForm) return 'default';
    if (isConnecting) return 'crosshair';
    return 'grab';
  };

  return (
    <g 
      className={`tree-node ${isRoot ? 'root-node' : 'normal-node'} ${isDraggingThis ? 'dragging' : ''} ${isDisconnected ? 'disconnected' : ''} ${isConnecting ? 'connecting' : ''}`}
      style={{
        transition: 'none' // Remove all transitions to prevent lag
      }}
    >
      {/* Node shadow - static, no animations */}
      <rect
        x={position.x + 2}
        y={position.y + 2}
        width={NODE_CONFIG.WIDTH}
        height={NODE_CONFIG.HEIGHT}
        rx={NODE_CONFIG.BORDER_RADIUS}
        fill="rgba(0,0,0,0.08)"
        className="node-shadow"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Main node rectangle */}
      <rect
        x={position.x}
        y={position.y}
        width={NODE_CONFIG.WIDTH}
        height={NODE_CONFIG.HEIGHT}
        rx={NODE_CONFIG.BORDER_RADIUS}
        fill={getNodeFill()}
        stroke={getNodeStroke()}
        strokeWidth={getStrokeWidth()}
        className="node-rect"
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleNodeClick}
        style={{ 
          cursor: getCursor(),
          userSelect: 'none',
          transition: 'fill 0.1s ease, stroke 0.1s ease' // Very short transition
        }}
      >
        {/* Tooltip for full text if truncated */}
        {isTextTruncated && !isEditing && (
          <title>{node.text}</title>
        )}
      </rect>
      
      {/* Special indicators */}
      {isDraggingThis && (
        <rect
          x={position.x - 2}
          y={position.y - 2}
          width={NODE_CONFIG.WIDTH + 4}
          height={NODE_CONFIG.HEIGHT + 4}
          rx={NODE_CONFIG.BORDER_RADIUS + 2}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="drag-indicator"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {isConnecting && (
        <rect
          x={position.x - 3}
          y={position.y - 3}
          width={NODE_CONFIG.WIDTH + 6}
          height={NODE_CONFIG.HEIGHT + 6}
          rx={NODE_CONFIG.BORDER_RADIUS + 3}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="8,4"
          className="connect-indicator"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {isDisconnected && (
        <>
          {/* Disconnected indicator border */}
          <rect
            x={position.x - 1}
            y={position.y - 1}
            width={NODE_CONFIG.WIDTH + 2}
            height={NODE_CONFIG.HEIGHT + 2}
            rx={NODE_CONFIG.BORDER_RADIUS + 1}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="4,2"
            className="disconnected-border"
            style={{ pointerEvents: 'none' }}
          />
          
          {/* Warning icon - static position */}
          <circle
            cx={position.x + NODE_CONFIG.WIDTH - 10}
            cy={position.y + 10}
            r="6"
            fill="#f59e0b"
            className="disconnect-warning"
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={position.x + NODE_CONFIG.WIDTH - 10}
            y={position.y + 13}
            textAnchor="middle"
            className="text-xs fill-white font-bold"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            !
          </text>
        </>
      )}
      
      {/* Node border highlight - subtle */}
      <rect
        x={position.x + 1}
        y={position.y + 1}
        width={NODE_CONFIG.WIDTH - 2}
        height={NODE_CONFIG.HEIGHT - 2}
        rx={NODE_CONFIG.BORDER_RADIUS - 1}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        className="node-highlight"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Truncation indicator - small dots if text is truncated */}
      {isTextTruncated && !isEditing && (
        <circle
          cx={position.x + NODE_CONFIG.WIDTH - 15}
          cy={position.y + NODE_CONFIG.HEIGHT - 8}
          r="2"
          fill="#94a3b8"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* Node text */}
      {isEditing ? (
        <foreignObject 
          x={position.x + 5} 
          y={position.y + 8} 
          width={NODE_CONFIG.WIDTH - 80} 
          height="24"
        >
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleSaveEdit}
            className="node-input"
            style={{ 
              width: '100%',
              fontSize: '14px',
              fontWeight: '500',
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              padding: '2px 6px',
              outline: 'none',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#1f2937'
            }}
          />
        </foreignObject>
      ) : (
        <>
          {/* Text shadow - optional, can be removed for performance */}
          <text
            x={position.x + NODE_CONFIG.WIDTH / 2 + 1}
            y={position.y + NODE_CONFIG.HEIGHT / 2 + 6}
            textAnchor="middle"
            className="node-text-shadow"
            fill="rgba(0,0,0,0.08)"
            fontSize="14"
            fontWeight="500"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {displayText}
          </text>
          
          {/* Main text - display truncated but keep full text in title */}
          <text
            x={position.x + NODE_CONFIG.WIDTH / 2}
            y={position.y + NODE_CONFIG.HEIGHT / 2 + 5}
            textAnchor="middle"
            className="node-text"
            fill={
              isDisconnected ? '#b45309' : 
              isConnecting ? '#15803d' : 
              isRoot ? '#7f1d1d' : '#374151'
            }
            fontSize="14"
            fontWeight={isDisconnected || isConnecting ? "600" : "500"}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {displayText}
            {/* CRITICAL: Tooltip với FULL TEXT - không truncate */}
            {isTextTruncated && <title>{node.text}</title>}
          </text>
        </>
      )}
      
      {/* Action buttons - always visible for better UX */}
      {!isDraggingThis && (
        <g style={{ opacity: isHovered || isEditing || showAddForm ? 1 : 0.7 }}>
          <NodeActions
            nodeId={nodeId}
            isRoot={isRoot}
            isEditing={isEditing}
            isMoving={isMoving}
            isDisconnected={isDisconnected}
            isConnecting={isConnecting}
            position={position}
            onAdd={() => setShowAddForm(true)}
            onEdit={handleStartEdit}
            onSave={handleSaveEdit}
            onMove={() => onMoveNode(nodeId)}
            onCancelMove={() => onMoveNode(null)}
            onDelete={() => onDeleteNode(nodeId)}
            onDisconnect={() => onDisconnectNode(nodeId)}
            onConnect={() => onConnectNode(nodeId)}
            onCancelConnect={() => onConnectNode(null)}
          />
        </g>
      )}
      
      {/* Add form */}
      {showAddForm && !isDraggingThis && (
        <AddNodeForm
          position={position}
          onSave={handleAddNode}
          onCancel={() => setShowAddForm(false)}
        />
      )}
      
      {/* Status hints - only show when really needed */}
      {isHovered && !isEditing && !showAddForm && !isDraggingThis && !isMoving && !isConnecting && (
        <text
          x={position.x + NODE_CONFIG.WIDTH / 2}
          y={position.y - 8}
          textAnchor="middle"
          className="status-hint"
          fill="#6b7280"
          fontSize="10"
          style={{ 
            pointerEvents: 'none', 
            userSelect: 'none',
            opacity: 0.8
          }}
        >
          {isDisconnected ? 'Disconnected' : isTextTruncated ? 'Hover for full name' : 'Drag to move'}
        </text>
      )}
    </g>
  );
};

export default TreeNode;