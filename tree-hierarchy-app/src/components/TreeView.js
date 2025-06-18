import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Edit3, Move, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import EditNodeModal from './EditNodeModal';

const TreeView = ({ trees }) => {
  if (!trees || Object.keys(trees).length === 0) {
    return <div style={{ padding: 24, color: '#6b7280' }}>Chưa có dữ liệu để hiển thị.</div>;
  }

  return (
    <div className="tree-view" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      {Object.entries(trees).map(([fileName, tree]) => (
        <div key={fileName} style={{ marginBottom: 32, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1d4ed8', marginBottom: 8 }}>{fileName}</div>
          {tree.nodes && tree.nodes.root && (
            <TreeNode nodeId="root" nodes={tree.nodes} onEditNode={undefined} onAddNode={undefined} onMoveNode={undefined} onDeleteNode={undefined} isNodeDisconnected={undefined} />
          )}
        </div>
      ))}
    </div>
  );
};

const TreeNode = ({ nodeId, nodes, onEditNode, onAddNode, onMoveNode, onDeleteNode, isNodeDisconnected }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const [editingNode, setEditingNode] = useState(null);
  const [editText, setEditText] = useState('');
  const [showAddForm, setShowAddForm] = useState(null);
  const [newNodeText, setNewNodeText] = useState('');
  const [movingNode, setMovingNode] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const inputRef = useRef(null);

  // Truncate text helper function - ONLY for display in TreeView
  const truncateTextForTreeView = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Toggle expand/collapse
  const toggleExpanded = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Start editing with modal
  const startEdit = (nodeId) => {
    setSelectedNodeId(nodeId);
    setIsModalOpen(true);
  };

  // Handle modal save
  const handleModalSave = (nodeId, newText) => {
    if (newText.trim() && onEditNode) {
      onEditNode(nodeId, newText.trim());
    }
    setIsModalOpen(false);
    setSelectedNodeId(null);
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedNodeId(null);
  };

  // Add node
  const addNode = (parentId) => {
    if (newNodeText.trim() && onAddNode) {
      onAddNode(parentId, newNodeText.trim());
      setNewNodeText('');
      setShowAddForm(null);
      // Auto expand parent
      setExpandedNodes(prev => new Set([...prev, parentId]));
    }
  };

  // Start move (button method)
  const startMove = (nodeId) => {
    setMovingNode(nodeId);
  };

  // Execute move
  const executeMove = (nodeId, targetId) => {
    if (nodeId !== targetId && onMoveNode) {
      const success = onMoveNode(nodeId, targetId);
      if (success) {
        setMovingNode(null);
        // Auto expand target if it becomes a parent
        if (nodes[targetId] && nodes[targetId].con) {
          setExpandedNodes(prev => new Set([...prev, targetId]));
        }
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, nodeId) => {
    if (nodeId === 'root') {
      e.preventDefault();
      return;
    }
    
    setDraggedNode(nodeId);
    e.dataTransfer.setData('text/plain', nodeId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    setDraggedNode(null);
    setDraggedOver(null);
    e.target.style.opacity = '';
  };

  const handleDragOver = (e, targetNodeId) => {
    e.preventDefault();
    
    // Don't allow drop on self or root if dragging root
    if (draggedNode === targetNodeId || draggedNode === 'root') {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    // Don't allow drop on descendants (prevent circular reference)
    if (isDescendant(draggedNode, targetNodeId)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    setDraggedOver(targetNodeId);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the node, not just moving to a child
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOver(null);
    }
  };

  const handleDrop = (e, targetNodeId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedNodeId = e.dataTransfer.getData('text/plain');
    
    if (draggedNodeId && draggedNodeId !== targetNodeId && draggedNodeId !== 'root') {
      if (!isDescendant(draggedNodeId, targetNodeId)) {
        executeMove(draggedNodeId, targetNodeId);
      }
    }
    
    setDraggedOver(null);
    setDraggedNode(null);
  };

  // Check if nodeA is a descendant of nodeB
  const isDescendant = (ancestorId, nodeId) => {
    if (!nodes[nodeId] || !nodes[nodeId].cha) return false;
    if (nodes[nodeId].cha === ancestorId) return true;
    return isDescendant(ancestorId, nodes[nodeId].cha);
  };

  // Get node icon - ALL FOLDERS NOW
  const getNodeIcon = (nodeId, hasChildren, isExpanded, isDisconnected) => {
    if (nodeId === 'root') return <Folder className="w-4 h-4 text-blue-600" />;
    
    if (isDisconnected) {
      return isExpanded ? 
        <FolderOpen className="w-4 h-4 text-orange-500" /> : 
        <Folder className="w-4 h-4 text-orange-500" />;
    }
    
    // ALL nodes are folders now - even leaf nodes
    return isExpanded ? 
      <FolderOpen className="w-4 h-4 text-blue-500" /> : 
      <Folder className="w-4 h-4 text-blue-600" />;
  };

  // Render tree recursively
  const renderTree = (nodeId, level = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const hasChildren = node.con && node.con.length > 0;
    const isExpanded = expandedNodes.has(nodeId);
    const isRoot = nodeId === 'root';
    const isMoving = movingNode === nodeId;
    const isDropTarget = draggedOver === nodeId && draggedNode && draggedNode !== nodeId;
    const isDragging = draggedNode === nodeId;
    const isDisconnected = isNodeDisconnected ? isNodeDisconnected(nodeId) : false;

    return (
      <div key={nodeId} className="tree-node-container">
        {/* Node row */}
        <div 
          className={`tree-node-row ${isMoving ? 'moving' : ''} ${isDropTarget ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''} ${isDisconnected ? 'disconnected' : ''}`}
          style={{ 
            paddingLeft: `${level * 20 + 8}px`,
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            cursor: draggedNode ? 'grabbing' : 'pointer',
            borderRadius: '4px',
            margin: '2px 4px',
            transition: 'all 0.2s ease',
            position: 'relative',
            border: isDropTarget ? '2px solid #3b82f6' : '1px solid transparent'
          }}
          draggable={!isRoot && !isModalOpen}
          onDragStart={(e) => handleDragStart(e, nodeId)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, nodeId)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, nodeId)}
          onClick={() => {
            if (movingNode && movingNode !== nodeId) {
              executeMove(movingNode, nodeId);
            }
          }}
        >
          {/* Expand/Collapse button */}
          <div 
            className="expand-button"
            style={{ 
              width: '24px', 
              height: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpanded(nodeId);
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {hasChildren ? (
              isExpanded ? 
                <ChevronDown className="w-4 h-4 text-gray-600" /> : 
                <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Node icon */}
          <div className="node-icon" style={{ marginRight: '8px' }}>
            {getNodeIcon(nodeId, hasChildren, isExpanded, isDisconnected)}
          </div>

          {/* Disconnected warning */}
          {isDisconnected && (
            <div style={{ marginRight: '6px' }}>
              <AlertTriangle className="w-4 h-4 text-orange-500" title="Disconnected node" />
            </div>
          )}

          {/* Node text */}
          <div className="node-text" style={{ flex: 1 }}>
            <span 
              style={{ 
                fontSize: '14px',
                fontWeight: isRoot ? '600' : '400',
                color: isRoot ? '#1f2937' : isDisconnected ? '#ea580c' : '#374151',
                userSelect: 'none'
              }}
              title={node.text} // Show FULL text on hover - CRITICAL for full content
            >
              {truncateTextForTreeView(node.text, 20)} {/* Truncate ONLY for display */}
            </span>
          </div>

          {/* Action buttons */}
          <div 
            className="action-buttons"
            style={{ 
              display: 'flex', 
              gap: '6px', 
              opacity: '0.7',
              transition: 'opacity 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddForm(nodeId);
              }}
              className="action-btn add-btn"
              title="Thêm node con"
              style={{
                padding: '6px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEdit(nodeId);
              }}
              className="action-btn edit-btn"
              title="Sửa"
              style={{
                padding: '6px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Edit3 className="w-3 h-3" />
            </button>

            {/* Move button */}
            {!isRoot && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  movingNode === nodeId ? setMovingNode(null) : startMove(nodeId);
                }}
                className={`action-btn move-btn ${isMoving ? 'active' : ''}`}
                title={isMoving ? "Hủy di chuyển" : "Di chuyển"}
                style={{
                  padding: '6px',
                  backgroundColor: isMoving ? '#ef4444' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isMoving ? <X className="w-3 h-3" /> : <Move className="w-3 h-3" />}
              </button>
            )}

            {/* Delete button */}
            {!isRoot && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteNode) {
                    onDeleteNode(nodeId);
                  }
                }}
                className="action-btn delete-btn"
                title="Xóa"
                style={{
                  padding: '6px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Add form */}
        {showAddForm === nodeId && (
          <div 
            style={{ 
              paddingLeft: `${(level + 1) * 20 + 32}px`,
              margin: '8px 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder className="w-4 h-4 text-gray-400" />
              <input
                value={newNodeText}
                onChange={(e) => setNewNodeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addNode(nodeId);
                  if (e.key === 'Escape') setShowAddForm(null);
                }}
                placeholder="Tên folder mới"
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                autoFocus
              />
              <button
                onClick={() => addNode(nodeId)}
                className="action-btn add-btn"
                title="Thêm"
                style={{
                  padding: '6px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowAddForm(null)}
                className="action-btn delete-btn"
                title="Hủy"
                style={{
                  padding: '6px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.con.map(childId => renderTree(childId, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tree-content">
      {renderTree('root')}
    </div>
  );
};

export default TreeView;