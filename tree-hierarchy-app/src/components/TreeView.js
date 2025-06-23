import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Edit3, Move, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import EditNodeModal from './EditNodeModal';

const TreeView = ({ trees, selectedTree, onEditNode, onAddNode, onMoveNode, onDeleteNode, isNodeDisconnected, onReorderChildren, onMergeNodes, onSplitNode, onMergeWithParent, onSplitFromParent }) => {
  if (!trees || Object.keys(trees).length === 0) {
    return <div style={{ padding: 24, color: '#6b7280' }}>Chưa có dữ liệu để hiển thị.</div>;
  }

  return (
    <div className="tree-view" style={{ 
      width: '100%', 
      height: '100%', 
      overflow: 'visible',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      {Object.entries(trees).map(([fileName, tree]) => (
        <div key={fileName} style={{ marginBottom: 32, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1d4ed8', marginBottom: 8 }}>{fileName}</div>
          {tree.nodes && tree.nodes.root && (
            <TreeNode 
              nodeId="root" 
              nodes={tree.nodes} 
              fileName={fileName}
              onEditNode={onEditNode}
              onAddNode={onAddNode}
              onMoveNode={onMoveNode}
              onDeleteNode={onDeleteNode}
              isNodeDisconnected={isNodeDisconnected}
              onReorderChildren={onReorderChildren}
              onMergeNodes={onMergeNodes}
              onSplitNode={onSplitNode}
              onMergeWithParent={onMergeWithParent}
              onSplitFromParent={onSplitFromParent}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const TreeNode = ({ nodeId, nodes, fileName, onEditNode, onAddNode, onMoveNode, onDeleteNode, isNodeDisconnected, onReorderChildren, onMergeNodes, onSplitNode, onMergeWithParent, onSplitFromParent }) => {
  console.log('🔧 TreeNode props:', { 
    fileName, 
    hasOnMergeNodes: !!onMergeNodes,
    hasOnSplitNode: !!onSplitNode,
    hasOnMergeWithParent: !!onMergeWithParent
  });
  
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const [showAddForm, setShowAddForm] = useState(null);
  const [newNodeText, setNewNodeText] = useState('');
  const [movingNode, setMovingNode] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // Enhanced drag & drop state
  const [dropPosition, setDropPosition] = useState(null); // 'before', 'after', 'inside'
  const [dragPreview, setDragPreview] = useState(null);
  
  // NEW: Merge functionality state
  const [selectedNodesForMerge, setSelectedNodesForMerge] = useState(new Set());
  const [mergeMode, setMergeMode] = useState(false);
  
  // NEW: Split functionality state
  const [splitMode, setSplitMode] = useState(false);
  
  const inputRef = useRef(null);

  // Truncate text helper function
  const truncateTextForTreeView = (text, maxLength = 20) => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // NEW: Merge functionality
  const isLeafNode = (nodeId) => {
    const node = nodes[nodeId];
    return node && (!node.con || node.con.length === 0);
  };

  const canMergeNode = (nodeId) => {
    return isLeafNode(nodeId) && nodeId !== 'root';
  };

  // NEW: Check if node was merged (has merge metadata or contains multiple paragraphs)
  const isMergedNode = (nodeId) => {
    const node = nodes[nodeId];
    if (!node || !node.text) return false;
    
    // Priority 1: Check if node has merge metadata (proper merged node)
    if (node.mergeMetadata && node.mergeMetadata.originalCount) {
      return true;
    }
    
    // Priority 2: Check if text contains double newlines (indication of merged content)
    const paragraphs = node.text.split('\n\n').filter(p => p.trim().length > 0);
    return paragraphs.length > 1;
  };

  // NEW: Get split info for display
  const getSplitInfo = (nodeId) => {
    const node = nodes[nodeId];
    if (!node) return null;
    
    // If has metadata, use original count
    if (node.mergeMetadata && node.mergeMetadata.originalCount) {
      return {
        count: node.mergeMetadata.originalCount,
        type: 'merged'
      };
    }
    
    // Otherwise count paragraphs
    const paragraphs = node.text.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) {
      return {
        count: paragraphs.length,
        type: 'paragraphs'
      };
    }
    
    return null;
  };

  // NEW: Check if node can be merged with parent
  const canMergeWithParent = (nodeId) => {
    if (nodeId === 'root') return false;
    
    const node = nodes[nodeId];
    const parent = nodes[node?.cha];
    
    return node && parent && isLeafNode(nodeId) && node.cha !== 'root';
  };

  // NEW: Check if node was merged with child (has parent merge metadata)
  const isMergedWithChild = (nodeId) => {
    const node = nodes[nodeId];
    return node && node.parentMergeMetadata;
  };

  // NEW: Get merged children count
  const getMergedChildrenCount = (nodeId) => {
    const node = nodes[nodeId];
    if (node && node.parentMergeMetadata && node.parentMergeMetadata.mergedChildren) {
      return node.parentMergeMetadata.mergedChildren.length;
    }
    return 0;
  };

  // NEW: Check if node can be split from parent
  const canSplitFromParent = (nodeId) => {
    return isMergedWithChild(nodeId);
  };

  const toggleMergeMode = () => {
    console.log('🔄 Toggle merge mode, current:', mergeMode);
    setMergeMode(!mergeMode);
    setSplitMode(false); // Turn off split mode when entering merge mode
    setSelectedNodesForMerge(new Set());
    console.log('📋 Cleared selected nodes for merge');
  };

  const toggleSplitMode = () => {
    console.log('🔄 Toggle split mode, current:', splitMode);
    setSplitMode(!splitMode);
    setMergeMode(false); // Turn off merge mode when entering split mode
    setSelectedNodesForMerge(new Set());
    console.log('📋 Entered split mode');
  };

  const toggleNodeForMerge = (nodeId) => {
    console.log('🎯 Toggle node for merge:', nodeId, 'canMerge:', canMergeNode(nodeId));
    
    if (!canMergeNode(nodeId)) {
      console.log('❌ Cannot merge this node');
      return;
    }
    
    const newSelected = new Set(selectedNodesForMerge);
    if (newSelected.has(nodeId)) {
      newSelected.delete(nodeId);
      console.log('➖ Removed from selection:', nodeId);
    } else {
      newSelected.add(nodeId);
      console.log('➕ Added to selection:', nodeId);
    }
    
    console.log('📋 New selected nodes:', Array.from(newSelected));
    setSelectedNodesForMerge(newSelected);
  };

  const executeMerge = () => {
    console.log('🔗 Execute merge clicked, selected nodes:', Array.from(selectedNodesForMerge));
    
    if (selectedNodesForMerge.size < 2) {
      alert('Cần chọn ít nhất 2 nodes để gộp!');
      return;
    }

    // Check if all selected nodes have same parent
    const selectedArray = Array.from(selectedNodesForMerge);
    console.log('📋 Selected array:', selectedArray);
    
    const firstParent = nodes[selectedArray[0]]?.cha;
    console.log('👨‍👧‍👦 First parent:', firstParent);
    
    const allSameParent = selectedArray.every(nodeId => {
      const parent = nodes[nodeId]?.cha;
      console.log(`📂 Node ${nodeId} parent:`, parent);
      return parent === firstParent;
    });
    
    console.log('✅ All same parent?', allSameParent);

    if (!allSameParent) {
      alert('Chỉ có thể gộp các nodes cùng thư mục cha!');
      return;
    }

    // Check if all nodes are leaf nodes
    const allLeafNodes = selectedArray.every(nodeId => {
      const isLeaf = isLeafNode(nodeId);
      console.log(`🍃 Node ${nodeId} is leaf:`, isLeaf);
      return isLeaf;
    });
    
    console.log('🍃 All leaf nodes?', allLeafNodes);
    
    if (!allLeafNodes) {
      alert('Chỉ có thể gộp các nodes không có thư mục con!');
      return;
    }

    // ✅ Sửa lỗi: Kiểm tra onMergeNodes trước khi gọi
    if (onMergeNodes && typeof onMergeNodes === 'function') {
      console.log('🚀 Calling onMergeNodes with:', fileName, selectedArray);
      const success = onMergeNodes(fileName, selectedArray);
      console.log('📊 Merge result:', success);
      
      if (success) {
        setMergeMode(false);
        setSelectedNodesForMerge(new Set());
        alert(`✅ Đã gộp ${selectedArray.length} nodes thành công!`);
      } else {
        alert('❌ Không thể gộp các nodes này!');
      }
    } else {
      console.error('❌ onMergeNodes function not provided or not a function');
      alert('❌ Chức năng gộp chưa sẵn sàng!');
    }
  };

  // NEW: Split merged node back into separate nodes
  const executeSplit = (nodeId) => {
    console.log('✂️ Execute split for node:', nodeId);
    
    const node = nodes[nodeId];
    if (!node || !isMergedNode(nodeId)) {
      alert('Node này không thể tách ra!');
      return;
    }

    const splitInfo = getSplitInfo(nodeId);
    if (!splitInfo) {
      alert('Không thể xác định thông tin tách!');
      return;
    }

    let confirmMessage;
    if (splitInfo.type === 'merged') {
      confirmMessage = `Node này được tạo từ việc gộp ${splitInfo.count} nodes.\n\nBạn có muốn khôi phục về ${splitInfo.count} nodes ban đầu không?`;
    } else {
      const paragraphs = node.text.split('\n\n').filter(p => p.trim().length > 0);
      const preview = paragraphs.map((p, i) => `${i + 1}. ${p.substring(0, 50)}...`).join('\n');
      confirmMessage = `Node này chứa ${splitInfo.count} đoạn văn:\n\n${preview}\n\nBạn có muốn tách thành ${splitInfo.count} nodes riêng biệt không?`;
    }
    
    if (window.confirm(confirmMessage)) {
      if (onSplitNode && typeof onSplitNode === 'function') {
        const success = onSplitNode(fileName, nodeId);
        if (success) {
          setSplitMode(false);
          if (splitInfo.type === 'merged') {
            alert(`✅ Đã khôi phục về ${splitInfo.count} nodes ban đầu!`);
          } else {
            alert(`✅ Đã tách thành ${splitInfo.count} nodes!`);
          }
        } else {
          alert('❌ Không thể tách node này!');
        }
      } else {
        alert('❌ Chức năng tách chưa sẵn sàng!');
      }
    }
  };

  // NEW: Merge leaf node with its parent
  const executeMergeWithParent = (nodeId) => {
    console.log('🔗 Execute merge with parent for node:', nodeId);
    
    if (!canMergeWithParent(nodeId)) {
      alert('Node này không thể gộp với node cha!');
      return;
    }

    const node = nodes[nodeId];
    const parent = nodes[node.cha];
    
    const confirmMessage = `Gộp node "${node.text.substring(0, 30)}..." vào node cha "${parent.text.substring(0, 30)}..."?`;
    
    if (window.confirm(confirmMessage)) {
      if (onMergeWithParent && typeof onMergeWithParent === 'function') {
        const success = onMergeWithParent(fileName, nodeId);
        if (success) {
          alert('✅ Đã gộp với node cha thành công!');
        } else {
          alert('❌ Không thể gộp với node cha!');
        }
      } else {
        alert('❌ Chức năng gộp với node cha chưa sẵn sàng!');
      }
    }
  };

  // NEW: Split parent node that was merged with child
  const executeSplitFromParent = (nodeId) => {
    console.log('↙️ Execute split from parent for node:', nodeId);
    
    if (!canSplitFromParent(nodeId)) {
      alert('Node này không thể tách ra!');
      return;
    }

    const node = nodes[nodeId];
    const metadata = node.parentMergeMetadata;
    const childrenCount = getMergedChildrenCount(nodeId);
    
    // Create preview of merged children
    const childrenPreview = metadata.mergedChildren
      .map((child, index) => `${index + 1}. "${child.childText.substring(0, 40)}..."`)
      .join('\n');
    
    const confirmMessage = `Node này đã gộp ${childrenCount} node con:\n\n${childrenPreview}\n\nNội dung cha gốc: "${metadata.originalParentText.substring(0, 50)}..."\n\nBạn có muốn tách ra thành ${childrenCount + 1} nodes riêng biệt không?`;
    
    if (window.confirm(confirmMessage)) {
      if (onSplitFromParent && typeof onSplitFromParent === 'function') {
        const success = onSplitFromParent(fileName, nodeId);
        if (success) {
          alert(`✅ Đã tách ra ${childrenCount} node con thành công!`);
        } else {
          alert('❌ Không thể tách node này!');
        }
      } else {
        alert('❌ Chức năng tách khỏi node cha chưa sẵn sàng!');
      }
    }
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

  // Modal handlers
  const startEdit = (nodeId) => {
    setSelectedNodeId(nodeId);
    setIsModalOpen(true);
  };

  const handleModalSave = (nodeId, newText) => {
    if (newText.trim() && onEditNode) {
      const success = onEditNode(fileName, nodeId, newText.trim());
      if (success !== false) {
        setIsModalOpen(false);
        setSelectedNodeId(null);
      }
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedNodeId(null);
  };

  // Add node
  const addNode = (parentId) => {
    if (newNodeText.trim() && onAddNode) {
      const success = onAddNode(fileName, parentId, newNodeText.trim());
      if (success !== false) {
        setNewNodeText('');
        setShowAddForm(null);
        setExpandedNodes(prev => new Set([...prev, parentId]));
      }
    }
  };

  // Move operations
  const startMove = (nodeId) => {
    setMovingNode(nodeId);
  };

  // ENHANCED: Execute move with reordering support
  const executeMove = (nodeId, targetId, position = 'inside') => {
    if (nodeId === targetId || nodeId === 'root') return false;
    
    if (position === 'inside') {
      // Original move to different parent
      if (onMoveNode) {
        const success = onMoveNode(fileName, nodeId, targetId);
        if (success !== false) {
          setMovingNode(null);
          setExpandedNodes(prev => new Set([...prev, targetId]));
          return true;
        }
      }
    } else {
      // NEW: Reorder within same parent
      const success = reorderNode(nodeId, targetId, position);
      if (success) {
        setMovingNode(null);
        return true;
      }
    }
    return false;
  };

  // NEW: Reorder nodes within same parent
  const reorderNode = (draggedNodeId, targetNodeId, position) => {
    const draggedNode = nodes[draggedNodeId];
    const targetNode = nodes[targetNodeId];
    
    if (!draggedNode || !targetNode) return false;
    
    // Must have same parent for reordering
    if (draggedNode.cha !== targetNode.cha) return false;
    
    const parentId = draggedNode.cha;
    const parent = nodes[parentId];
    
    if (!parent || !parent.con) return false;
    
    console.log('🔄 Reordering:', { draggedNodeId, targetNodeId, position, parentId });
    
    // Create new children array with reordered items
    const currentChildren = [...parent.con];
    const draggedIndex = currentChildren.indexOf(draggedNodeId);
    const targetIndex = currentChildren.indexOf(targetNodeId);
    
    if (draggedIndex === -1 || targetIndex === -1) return false;
    
    // Remove dragged item
    currentChildren.splice(draggedIndex, 1);
    
    // Calculate new position
    let newIndex;
    if (position === 'before') {
      newIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
    } else { // after
      newIndex = targetIndex > draggedIndex ? targetIndex : targetIndex + 1;
    }
    
    // Insert at new position
    currentChildren.splice(newIndex, 0, draggedNodeId);
    
    console.log('📋 New order:', currentChildren);
    
    // Use the reorder function
    return handleReorderUpdate(parentId, currentChildren);
  };

  // Handle reorder update
  const handleReorderUpdate = (parentId, newChildrenOrder) => {
    console.log('📝 Updating parent children order:', { parentId, newChildrenOrder });
    
    if (onReorderChildren) {
      return onReorderChildren(fileName, parentId, newChildrenOrder);
    }
    
    console.warn('⚠️ onReorderChildren not available');
    return false;
  };

  // Delete handler
  const handleDelete = (nodeId) => {
    if (onDeleteNode) {
      const nodeText = nodes[nodeId]?.text || 'Unknown';
      const truncatedText = nodeText.length > 50 ? nodeText.substring(0, 50) + '...' : nodeText;
      
      if (window.confirm(`Bạn có chắc chắn muốn xóa node "${truncatedText}" và tất cả các node con không?`)) {
        const success = onDeleteNode(fileName, nodeId);
        if (success === false) {
          alert('Không thể xóa node này');
        }
      }
    }
  };

  // ENHANCED: Drag and Drop handlers with reordering
  const handleDragStart = (e, nodeId) => {
    if (nodeId === 'root') {
      e.preventDefault();
      return;
    }
    
    console.log('🎯 Drag start:', nodeId);
    setDraggedNode(nodeId);
    e.dataTransfer.setData('text/plain', nodeId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    e.target.style.opacity = '0.5';
    
    // Create drag preview
    setDragPreview({
      nodeId,
      text: nodes[nodeId]?.text || 'Unknown'
    });
  };

  const handleDragEnd = (e) => {
    console.log('🏁 Drag end');
    setDraggedNode(null);
    setDraggedOver(null);
    setDropPosition(null);
    setDragPreview(null);
    e.target.style.opacity = '';
  };

  // ENHANCED: Drag over with position detection
  const handleDragOver = (e, targetNodeId) => {
    e.preventDefault();
    
    if (!draggedNode || draggedNode === targetNodeId || draggedNode === 'root') {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    // Prevent dropping on descendants
    if (isDescendant(draggedNode, targetNodeId)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    // Calculate drop position based on mouse Y position
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY;
    const elementTop = rect.top;
    const elementHeight = rect.height;
    const relativeY = mouseY - elementTop;
    
    let position = 'inside';
    
    // Check if dragged and target have same parent (for reordering)
    const draggedParent = nodes[draggedNode]?.cha;
    const targetParent = nodes[targetNodeId]?.cha;
    
    if (draggedParent === targetParent && targetNodeId !== 'root') {
      // Same parent - enable reordering
      if (relativeY < elementHeight * 0.25) {
        position = 'before';
      } else if (relativeY > elementHeight * 0.75) {
        position = 'after';
      } else {
        position = 'inside';
      }
    } else {
      // Different parent - only inside
      position = 'inside';
    }
    
    setDraggedOver(targetNodeId);
    setDropPosition(position);
    e.dataTransfer.dropEffect = 'move';
    
    console.log('🎯 Drag over:', { targetNodeId, position, relativeY, elementHeight });
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOver(null);
      setDropPosition(null);
    }
  };

  // ENHANCED: Drop with position handling
  const handleDrop = (e, targetNodeId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedNodeId = e.dataTransfer.getData('text/plain');
    
    console.log('🎯 Drop:', { draggedNodeId, targetNodeId, dropPosition });
    
    if (draggedNodeId && draggedNodeId !== targetNodeId && draggedNodeId !== 'root') {
      if (!isDescendant(draggedNodeId, targetNodeId)) {
        const success = executeMove(draggedNodeId, targetNodeId, dropPosition);
        if (!success) {
          console.warn('⚠️ Move operation failed');
        }
      }
    }
    
    setDraggedOver(null);
    setDropPosition(null);
    setDraggedNode(null);
    setDragPreview(null);
  };

  // Check if nodeA is a descendant of nodeB
  const isDescendant = (ancestorId, nodeId) => {
    if (!nodes[nodeId] || !nodes[nodeId].cha) return false;
    if (nodes[nodeId].cha === ancestorId) return true;
    return isDescendant(ancestorId, nodes[nodeId].cha);
  };

  // Get node icon
  const getNodeIcon = (nodeId, hasChildren, isExpanded, isDisconnected) => {
    if (nodeId === 'root') return <Folder className="w-4 h-4 text-blue-600" />;
    
    if (isDisconnected) {
      return isExpanded ? 
        <FolderOpen className="w-4 h-4 text-orange-500" /> : 
        <Folder className="w-4 h-4 text-orange-500" />;
    }
    
    return isExpanded ? 
      <FolderOpen className="w-4 h-4 text-blue-500" /> : 
      <Folder className="w-4 h-4 text-blue-600" />;
  };

  // ENHANCED: Get drop indicator style
  const getDropIndicatorStyle = (nodeId) => {
    if (draggedOver !== nodeId) return {};
    
    const baseStyle = {
      transition: 'all 0.2s ease'
    };
    
    switch (dropPosition) {
      case 'before':
        return {
          ...baseStyle,
          borderTop: '3px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        };
      case 'after':
        return {
          ...baseStyle,
          borderBottom: '3px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        };
      case 'inside':
        return {
          ...baseStyle,
          border: '2px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '4px'
        };
      default:
        return baseStyle;
    }
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
    const isDisconnected = isNodeDisconnected ? isNodeDisconnected(fileName, nodeId) : false;
    
    // NEW: Merge related states
    const canMerge = canMergeNode(nodeId);
    const isSelectedForMerge = selectedNodesForMerge.has(nodeId);
    const isMergeable = mergeMode && canMerge;
    
    // NEW: Split related states
    const isMerged = isMergedNode(nodeId);
    const canSplit = splitMode && isMerged && isLeafNode(nodeId);
    
    // NEW: Merge with parent related states
    const canMergeParent = canMergeWithParent(nodeId);
    
    // NEW: Split from parent related states
    const isMergedParent = isMergedWithChild(nodeId);
    const canSplitParent = canSplitFromParent(nodeId);

    return (
      <div key={nodeId} className="tree-node-container">
        {/* Merge mode header */}
        {nodeId === 'root' && mergeMode && (
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                🔗 Chế độ gộp nodes
              </div>
              <div style={{ fontSize: '12px', color: '#b45309' }}>
                Chọn các nodes con (không có thư mục con) để gộp lại. Đã chọn: {selectedNodesForMerge.size}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={executeMerge}
                disabled={selectedNodesForMerge.size < 2}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectedNodesForMerge.size >= 2 ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: selectedNodesForMerge.size >= 2 ? 'pointer' : 'not-allowed'
                }}
              >
                Gộp ({selectedNodesForMerge.size})
              </button>
              <button
                onClick={toggleMergeMode}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Split mode header */}
        {nodeId === 'root' && splitMode && (
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
            border: '2px solid #ec4899',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#be185d', marginBottom: '4px' }}>
                ✂️ Chế độ tách nodes
              </div>
              <div style={{ fontSize: '12px', color: '#be185d' }}>
                Click vào các nodes đã gộp (có nhiều đoạn văn) để tách ra thành các nodes riêng biệt
              </div>
            </div>
            <button
              onClick={toggleSplitMode}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
          </div>
        )}

        {/* ENHANCED: Node row with merge/split functionality */}
        <div 
          className={`tree-node-row ${isMoving ? 'moving' : ''} ${isDropTarget ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''} ${isDisconnected ? 'disconnected' : ''} ${isSelectedForMerge ? 'selected-for-merge' : ''} ${canSplit ? 'can-split' : ''}`}
          style={{ 
            paddingLeft: `${level * 20 + 8}px`,
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            cursor: draggedNode ? 'grabbing' : (isMergeable ? 'pointer' : (canSplit ? 'pointer' : 'default')),
            borderRadius: '4px',
            margin: '2px 4px',
            position: 'relative',
            ...getDropIndicatorStyle(nodeId),
            ...(isSelectedForMerge ? {
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid #10b981'
            } : {}),
            ...(canSplit ? {
              backgroundColor: 'rgba(236, 72, 153, 0.2)',
              border: '2px solid #ec4899'
            } : {})
          }}
          draggable={!isRoot && !isModalOpen && !mergeMode && !splitMode}
          onDragStart={(e) => handleDragStart(e, nodeId)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, nodeId)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, nodeId)}
          onClick={() => {
            if (mergeMode && isMergeable) {
              toggleNodeForMerge(nodeId);
            } else if (splitMode && canSplit) {
              executeSplit(nodeId);
            } else if (movingNode && movingNode !== nodeId) {
              executeMove(movingNode, nodeId, 'inside');
            }
          }}
        >
          {/* Drop position indicator */}
          {isDropTarget && dropPosition && (
            <div style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: '#3b82f6',
              zIndex: 10,
              ...(dropPosition === 'before' ? { top: -1 } : {}),
              ...(dropPosition === 'after' ? { bottom: -1 } : {}),
              ...(dropPosition === 'inside' ? { display: 'none' } : {})
            }} />
          )}

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

          {/* Node text with merge/split indicators */}
          <div className="node-text" style={{ flex: 1 }}>
            <span 
              style={{ 
                fontSize: '14px',
                fontWeight: isRoot ? '600' : '400',
                color: isRoot ? '#1f2937' : isDisconnected ? '#ea580c' : (isSelectedForMerge ? '#059669' : (canSplit ? '#be185d' : (isMergedParent ? '#0891b2' : '#374151'))),
                userSelect: 'none'
              }}
              title={node.text}
            >
              {isSelectedForMerge && '✓ '}
              {canSplit && '✂️ '}
              {isMerged && !splitMode && (() => {
                const splitInfo = getSplitInfo(nodeId);
                return splitInfo ? `📄(${splitInfo.count}) ` : '📄 ';
              })()}
              {isMergedParent && (() => {
                const childrenCount = getMergedChildrenCount(nodeId);
                return `🔗👨‍👧‍👦(${childrenCount}) `;
              })()}
              {truncateTextForTreeView(node.text, 20)}
              {isMergeable && !isSelectedForMerge && ' 🔗'}
              {canMergeParent && !mergeMode && !splitMode && !isMergedParent && ' ⬆️'}
              {canSplitParent && !mergeMode && !splitMode && ' ↙️'}
            </span>
          </div>

          {/* Action buttons */}
          <div 
            className="action-buttons"
            style={{ 
              display: 'flex', 
              gap: '6px', 
              opacity: (mergeMode || splitMode) && !isMergeable && !canSplit ? '0.3' : '0.7',
              transition: 'opacity 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Merge mode toggle button - only show for root */}
            {isRoot && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMergeMode();
                  }}
                  className="action-btn merge-btn"
                  title={mergeMode ? "Thoát chế độ gộp" : "Chế độ gộp nodes"}
                  style={{
                    padding: '6px',
                    backgroundColor: mergeMode ? '#ef4444' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {mergeMode ? <X className="w-3 h-3" /> : <span style={{ fontSize: '10px' }}>🔗</span>}
                </button>

                {/* Split mode toggle button - only show for root */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSplitMode();
                  }}
                  className="action-btn split-btn"
                  title={splitMode ? "Thoát chế độ tách" : "Chế độ tách nodes"}
                  style={{
                    padding: '6px',
                    backgroundColor: splitMode ? '#ef4444' : '#ec4899',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {splitMode ? <X className="w-3 h-3" /> : <span style={{ fontSize: '10px' }}>✂️</span>}
                </button>
              </>
            )}

            {/* Merge with parent button - show for eligible leaf nodes */}
            {canMergeParent && !mergeMode && !splitMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  executeMergeWithParent(nodeId);
                }}
                className="action-btn merge-parent-btn"
                title="Gộp với node cha"
                style={{
                  padding: '6px',
                  backgroundColor: '#0891b2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '10px' }}>⬆️</span>
              </button>
            )}

            {/* Split from parent button - show for nodes merged with child */}
            {canSplitParent && !mergeMode && !splitMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  executeSplitFromParent(nodeId);
                }}
                className="action-btn split-parent-btn"
                title="Tách ra khỏi node con đã gộp"
                style={{
                  padding: '6px',
                  backgroundColor: '#0891b2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '10px' }}>↙️</span>
              </button>
            )}

            {/* Existing buttons - disabled in merge/split mode */}
            {!mergeMode && !splitMode && (
              <>
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
                      handleDelete(nodeId);
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
              </>
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
      
      {/* Edit Modal */}
      <EditNodeModal
        isOpen={isModalOpen}
        nodeId={selectedNodeId}
        nodeText={selectedNodeId ? nodes[selectedNodeId]?.text : ''}
        onSave={handleModalSave}
        onCancel={handleModalCancel}
      />

      {/* Drag Preview */}
      {dragPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1000,
          background: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          transform: 'translate(10px, 10px)'
        }}>
          📁 {truncateTextForTreeView(dragPreview.text, 15)}
        </div>
      )}
    </div>
  );
};

export default TreeView;