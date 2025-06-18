// File: src/components/TreeCanvas.js (LOCAL TRUNCATION VERSION)
import React from 'react';
import TreeNode from './TreeNode';
import { COLORS, NODE_CONFIG } from '../utils/constants';

const TreeCanvas = ({
  nodes,
  positions,
  canvasSize,
  movingNode,
  connectingNode,
  dragState,
  disconnectedNodes,
  onAddNode,
  onEditNode,
  onMoveNode,
  onDeleteNode,
  onDisconnectNode,
  onConnectNode,
  onDragStart,
  onNodeClick,
  isNodeDisconnected
}) => {
  
  // Render connections between nodes
  const renderConnections = () => {
    const connections = [];
    
    Object.keys(nodes).forEach(nodeId => {
      const node = nodes[nodeId];
      
      // Skip disconnected nodes
      if (isNodeDisconnected(nodeId)) return;
      
      if (node.cha && positions[nodeId] && positions[node.cha] && !isNodeDisconnected(node.cha)) {
        const parentPos = positions[node.cha];
        const childPos = positions[nodeId];
        
        // Calculate connection points
        const x1 = parentPos.x + NODE_CONFIG.WIDTH / 2;
        const y1 = parentPos.y + NODE_CONFIG.HEIGHT;
        const x2 = childPos.x + NODE_CONFIG.WIDTH / 2;
        const y2 = childPos.y;
        
        // Create curved bezier path
        const midY = y1 + (y2 - y1) / 2;
        const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
        
        // Highlight connection if nodes are being dragged or connected
        const isHighlighted = 
          (dragState.isDragging && (dragState.draggedNode === nodeId || dragState.draggedNode === node.cha)) ||
          (connectingNode && (connectingNode === nodeId || connectingNode === node.cha));
        
        connections.push(
          <path
            key={`${node.cha}-${nodeId}`}
            d={pathD}
            stroke={isHighlighted ? '#f59e0b' : COLORS.CONNECTION}
            strokeWidth={isHighlighted ? "3" : "2"}
            fill="none"
            markerEnd="url(#arrowhead)"
            className="connection-line"
            style={{
              opacity: isHighlighted ? 0.8 : 0.6,
              transition: 'all 0.2s ease'
            }}
          />
        );
      }
    });
    
    return connections;
  };

  // Render disconnected nodes area
  const renderDisconnectedArea = () => {
    const disconnectedNodesList = disconnectedNodes;
    if (disconnectedNodesList.length === 0) return null;

    // Calculate position for disconnected area
    const areaX = canvasSize.width - 250;
    const areaY = 50;
    const areaWidth = 200;
    const areaHeight = Math.max(150, disconnectedNodesList.length * 60 + 50);

    return (
      <g className="disconnected-area">
        {/* Background area */}
        <rect
          x={areaX}
          y={areaY}
          width={areaWidth}
          height={areaHeight}
          fill="#fef3c7"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="5,5"
          rx="8"
          opacity="0.8"
        />
        
        {/* Area title */}
        <text
          x={areaX + areaWidth/2}
          y={areaY + 20}
          textAnchor="middle"
          className="text-sm font-bold"
          fill="#92400e"
        >
          🔗 Nodes Disconnected
        </text>
        
        {/* Area description */}
        <text
          x={areaX + areaWidth/2}
          y={areaY + 35}
          textAnchor="middle"
          className="text-xs"
          fill="#b45309"
        >
          Click 🔗 button to reconnect
        </text>
      </g>
    );
  };
  
  const handleNodeClick = (targetNodeId) => {
    onNodeClick(targetNodeId);
  };
  
  // Debug canvas and SVG sizes
  console.log('🖼️ TreeCanvas render:', {
    canvasSize,
    nodeCount: Object.keys(positions).length,
    hasPositions: Object.keys(positions).length > 0
  });
  
  return (
    <div className="tree-canvas-wrapper" style={{
      // Ensure wrapper is large enough to trigger scroll
      width: `${Math.max(canvasSize.width, 1200)}px`,
      height: `${Math.max(canvasSize.height, 800)}px`,
      minWidth: `${canvasSize.width}px`,
      minHeight: `${canvasSize.height}px`,
      position: 'relative',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <svg 
        width={canvasSize.width} 
        height={canvasSize.height} 
        className="tree-svg"
        style={{ 
          cursor: dragState.isDragging ? 'grabbing' : 'default',
          userSelect: 'none',
          display: 'block',
          // SVG must have exact dimensions
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          // Ensure SVG doesn't shrink
          minWidth: `${canvasSize.width}px`,
          minHeight: `${canvasSize.height}px`,
          maxWidth: 'none',
          maxHeight: 'none'
        }}
        // ViewBox for proper scaling
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Definitions */}
        <defs>
          {/* Arrow marker */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={COLORS.CONNECTION}
            />
          </marker>
          
          {/* Drop shadow filter */}
          <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#00000020"/>
          </filter>
          
          {/* Gradients */}
          <linearGradient id="rootGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fecaca" />
            <stop offset="100%" stopColor="#fca5a5" />
          </linearGradient>
          
          <linearGradient id="normalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          <linearGradient id="disconnectedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>

          <linearGradient id="connectingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dcfce7" />
            <stop offset="100%" stopColor="#bbf7d0" />
          </linearGradient>
        </defs>
        
        {/* Background grid pattern */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3"/>
        
        {/* Canvas bounds indicator */}
        <rect 
          x="0" 
          y="0" 
          width={canvasSize.width} 
          height={canvasSize.height} 
          fill="none" 
          stroke="#e2e8f0" 
          strokeWidth="1" 
          strokeDasharray="5,5"
          opacity="0.5"
        />
        
        {/* Disconnected area */}
        {renderDisconnectedArea()}
        
        {/* Render connections */}
        <g className="connections-group">
          {renderConnections()}
        </g>
        
        {/* Render nodes - TreeNode will handle its own text truncation */}
        <g className="nodes-group">
          {Object.keys(positions).map(nodeId => {
            const node = nodes[nodeId];
            const position = positions[nodeId];
            const isMovingTarget = movingNode && movingNode !== nodeId;
            const isConnectTarget = connectingNode && connectingNode !== nodeId;
            const isMoving = movingNode === nodeId;
            const isConnecting = connectingNode === nodeId;
            const isDragging = dragState.isDragging ? dragState.draggedNode : null;
            const isDisconnected = isNodeDisconnected(nodeId);
            
            // Pass full node data - TreeNode will handle truncation internally
            return (
              <TreeNode
                key={nodeId}
                nodeId={nodeId}
                node={node} // Pass full node with complete text
                position={position}
                isMovingTarget={isMovingTarget}
                isConnectTarget={isConnectTarget}
                isMoving={isMoving}
                isConnecting={isConnecting}
                isDisconnected={isDisconnected}
                isDragging={isDragging}
                onAddNode={onAddNode}
                onEditNode={onEditNode}
                onMoveNode={onMoveNode}
                onDeleteNode={onDeleteNode}
                onDisconnectNode={onDisconnectNode}
                onConnectNode={onConnectNode}
                onNodeClick={handleNodeClick}
                onDragStart={onDragStart}
              />
            );
          })}
        </g>

        {/* Drag guidelines */}
        {dragState.isDragging && (
          <g className="drag-guidelines">
            {/* Vertical guide line */}
            <line
              x1={dragState.mousePosition.x}
              y1="0"
              x2={dragState.mousePosition.x}
              y2={canvasSize.height}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.3"
            />
            {/* Horizontal guide line */}
            <line
              x1="0"
              y1={dragState.mousePosition.y}
              x2={canvasSize.width}
              y2={dragState.mousePosition.y}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.3"
            />
          </g>
        )}

        {/* Connect guidelines */}
        {connectingNode && (
          <g className="connect-guidelines">
            <circle
              cx={positions[connectingNode]?.x + NODE_CONFIG.WIDTH/2}
              cy={positions[connectingNode]?.y + NODE_CONFIG.HEIGHT/2}
              r="50"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.6"
              className="connect-indicator"
            />
          </g>
        )}

        {/* Canvas size indicator (bottom right) */}
        <text
          x={canvasSize.width - 10}
          y={canvasSize.height - 10}
          textAnchor="end"
          className="canvas-size-indicator"
          fill="#9ca3af"
          fontSize="10"
          fontFamily="monospace"
        >
          {canvasSize.width} × {canvasSize.height}
        </text>

        {/* Scroll hint (top left) */}
        <text
          x={10}
          y={25}
          className="scroll-hint"
          fill="#6b7280"
          fontSize="12"
          fontFamily="system-ui"
        >
          📜 Scroll to explore ({Object.keys(positions).length} nodes)
        </text>
      </svg>
    </div>
  );
};

export default TreeCanvas;