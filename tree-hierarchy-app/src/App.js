import React, { useState, useEffect, useCallback, useRef } from 'react';
import TreeCanvas from './components/TreeCanvas';
import TreeView from './components/TreeView';
import DfsTextView from './components/DfsTextView';
import JsonImporter from './components/JsonImporter';
import { useTreeData } from './hooks/useTreeData';
import { useTreeLayout } from './hooks/useTreeLayout';
import { useDragDrop } from './hooks/useDragDrop';
import { 
  LayoutGrid, 
  List, 
  FileText,
  Loader,
  Database,
  Eye
} from 'lucide-react';
import './styles/TreeHierarchy.css';

// TreeSelectorModal: popup chọn cây
const TreeSelectorModal = ({ trees, selectedTree, onSelect, onClose }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <h3 style={{ margin: 0, marginBottom: 16, fontSize: 20, color: '#1d4ed8' }}>Chọn cây dữ liệu để hiển thị</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Object.keys(trees).map(fileName => (
            <li key={fileName} style={{ marginBottom: 12 }}>
              <button
                onClick={() => { onSelect(fileName); onClose(); }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: fileName === selectedTree ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  background: fileName === selectedTree ? '#eff6ff' : '#f9fafb',
                  color: '#1e293b',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
              >
                {fileName}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onClose} style={{ marginTop: 20, background: '#e5e7eb', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', color: '#374151', fontWeight: 500 }}>Đóng</button>
      </div>
    </div>
  );
};

function App() {
  // Multi-tree state
  const [trees, setTrees] = useState({}); // { fileName: { nodes, disconnectedNodes, customPositions } }
  const [selectedTree, setSelectedTree] = useState(null); // fileName
  const [isLoading, setIsLoading] = useState(false);
  // For backward compatibility, use the first tree if selectedTree is null
  const currentTree = selectedTree && trees[selectedTree] ? trees[selectedTree] : Object.values(trees)[0];
  // Hooks for current tree
  const { 
    isLoading: treeLoading,
    hasUnsavedChanges,
    lastSaved,
    apiError,
    shouldTriggerAutoLayout,
    addNode, 
    deleteNode, 
    disconnectNode,
    connectNode,
    updateNodeText, 
    moveNode,
    isNodeDisconnected,
    updateCustomPositions,
    importJsonData,
    clearAutoLayoutTrigger,
    resetTreeData
  } = useTreeData(currentTree);
  const { positions, canvasSize, dfsOrder } = useTreeLayout(currentTree?.nodes || {}, currentTree?.customPositions || {});
  
  const { 
    customPositions: dragPositions,
    dragState, 
    startDrag, 
    updateDrag, 
    endDrag, 
    updatePositions 
  } = useDragDrop(currentTree?.customPositions || {}, updateCustomPositions);
  
  const [movingNode, setMovingNode] = useState(null);
  const [connectingNode, setConnectingNode] = useState(null);
  const [viewMode, setViewMode] = useState('canvas');
  const [importLoading, setImportLoading] = useState(false);
  const [dfsScroll, setDfsScroll] = useState(0);
  const dfsViewRef = useRef(null); // Ref for DfsTextView

  // Modal chọn cây khi vào Canvas/DFS
  const [showTreeSelector, setShowTreeSelector] = useState(false);
  // Khi chuyển sang canvas/dfs và có nhiều cây, hiện modal chọn cây
  useEffect(() => {
    if ((viewMode === 'canvas' || viewMode === 'dfs') && Object.keys(trees).length > 1) {
      setShowTreeSelector(true);
    } else {
      setShowTreeSelector(false);
    }
  }, [viewMode, trees]);

  // Khôi phục dữ liệu từ localStorage khi khởi động
  useEffect(() => {
    const savedData = localStorage.getItem('treeData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.nodes && parsedData.nodes.root) {
          importJsonData(parsedData);
        }
      } catch (e) {
        console.error('Lỗi khi khôi phục dữ liệu từ localStorage:', e);
      }
    }
  }, [importJsonData]);

  // Multi-file import handler
  const handleJsonImport = useCallback(async (importedTrees) => {
    // importedTrees: [{ fileName, data }]
    if (!Array.isArray(importedTrees)) return;
    setIsLoading(true);
    const newTrees = { ...trees };
    importedTrees.forEach(item => {
      if (item.fileName && item.data && item.data.nodes && item.data.nodes.root) {
        newTrees[item.fileName] = item.data;
      }
    });
    setTrees(newTrees);
    // Nếu chưa chọn cây nào thì chọn cây đầu tiên
    if (!selectedTree && importedTrees.length > 0) {
      setSelectedTree(importedTrees[0].fileName);
    }
    setIsLoading(false);
    alert('✅ Import nhiều file JSON thành công!');
  }, [trees, selectedTree]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e) => {
    if (dragState.isDragging) {
      updateDrag(e);
    }
  }, [dragState.isDragging, updateDrag]);

  const handleMouseUp = useCallback((e) => {
    if (dragState.isDragging) {
      endDrag();
    }
  }, [dragState.isDragging, endDrag]);

  // Add mouse event listeners for canvas mode
  useEffect(() => {
    if (viewMode === 'canvas' && dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [viewMode, dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Handle auto-layout trigger after import
  useEffect(() => {
    if (shouldTriggerAutoLayout) {
      const nodesToClear = Object.keys(currentTree?.nodes || {}).filter(nodeId => 
        !currentTree?.customPositions[nodeId] || Object.keys(currentTree?.customPositions || {}).length === 0
      );
      
      if (nodesToClear.length > 0) {
        const clearedPositions = { ...currentTree?.customPositions };
        nodesToClear.forEach(nodeId => {
          delete clearedPositions[nodeId];
        });
        updateCustomPositions(clearedPositions);
      }
      
      clearAutoLayoutTrigger();
    }
  }, [shouldTriggerAutoLayout, currentTree?.nodes, currentTree?.customPositions, updateCustomPositions, clearAutoLayoutTrigger]);

  // Handle operations
  const handleAddNode = useCallback(async (parentId, text) => {
    try {
      const success = addNode(parentId, text);
      if (success) {
        const updatedData = { nodes: { ...currentTree?.nodes }, disconnectedNodes: currentTree?.disconnectedNodes };
        localStorage.setItem('treeData', JSON.stringify(updatedData));
      }
      if (!success) alert('Không thể thêm node mới');
      return success;
    } catch (error) {
      console.error('Error adding node:', error);
      alert('Có lỗi khi thêm node mới');
      return false;
    }
  }, [addNode, currentTree?.nodes, currentTree?.disconnectedNodes]);

  const handleEditNode = useCallback(async (nodeId, newText) => {
    try {
      const success = updateNodeText(nodeId, newText);
      if (success) {
        const updatedData = { nodes: { ...currentTree?.nodes }, disconnectedNodes: currentTree?.disconnectedNodes };
        localStorage.setItem('treeData', JSON.stringify(updatedData));
      }
      if (!success) alert('Không thể cập nhật node');
      return success;
    } catch (error) {
      console.error('Error editing node:', error);
      alert('Có lỗi khi sửa node');
      return false;
    }
  }, [updateNodeText, currentTree?.nodes, currentTree?.disconnectedNodes]);

  const handleMoveNode = useCallback((nodeId, newParentId = null) => {
    try {
      if (nodeId === null) {
        setMovingNode(null);
        return true;
      }
      if (newParentId === null) {
        setMovingNode(nodeId);
        return true;
      }
      const success = moveNode(nodeId, newParentId);
      if (success) {
        setMovingNode(null);
        const updatedData = { nodes: { ...currentTree?.nodes }, disconnectedNodes: currentTree?.disconnectedNodes };
        localStorage.setItem('treeData', JSON.stringify(updatedData));
      } else {
        alert('Không thể di chuyển node này! Kiểm tra xem có tạo vòng lặp không.');
      }
      return success;
    } catch (error) {
      console.error('Error moving node:', error);
      alert('Có lỗi khi di chuyển node');
      setMovingNode(null);
      return false;
    }
  }, [moveNode, currentTree?.nodes, currentTree?.disconnectedNodes]);

  const handleDisconnectNode = useCallback((nodeId) => {
    try {
      const nodeText = currentTree?.nodes[nodeId]?.text?.substring(0, 50) + '...' || 'Unknown';
      if (window.confirm(`Bạn có chắc chắn muốn ngắt kết nối node "${nodeText}" khỏi parent không?`)) {
        const success = disconnectNode(nodeId);
        if (success) {
          const updatedData = { nodes: { ...currentTree?.nodes }, disconnectedNodes: currentTree?.disconnectedNodes };
          localStorage.setItem('treeData', JSON.stringify(updatedData));
        }
        if (!success) alert('Không thể ngắt kết nối node này');
        return success;
      }
      return false;
    } catch (error) {
      console.error('Error disconnecting node:', error);
      alert('Có lỗi khi ngắt kết nối node');
      return false;
    }
  }, [disconnectNode, currentTree?.nodes, currentTree?.disconnectedNodes]);

  const handleConnectNode = useCallback((nodeId, targetId = null) => {
    try {
      if (targetId === null) {
        setConnectingNode(nodeId);
        return true;
      }
      const success = connectNode(nodeId, targetId);
      if (success) {
        setConnectingNode(null);
        const updatedData = { nodes: { ...currentTree?.nodes }, disconnectedNodes: currentTree?.disconnectedNodes };
        localStorage.setItem('treeData', JSON.stringify(updatedData));
      } else {
        alert('Không thể kết nối node này! Kiểm tra xem có tạo vòng lặp không.');
      }
      return success;
    } catch (error) {
      console.error('Error connecting node:', error);
      alert('Có lỗi khi kết nối node');
      setConnectingNode(null);
      return false;
    }
  }, [connectNode, currentTree?.nodes, currentTree?.disconnectedNodes]);

  const handleDeleteNode = useCallback((nodeId) => {
    try {
      const nodeText = currentTree?.nodes[nodeId]?.text?.substring(0, 50) + '...' || 'Unknown';
      if (window.confirm(`Bạn có chắc chắn muốn xóa hoàn toàn node "${nodeText}" và tất cả node con không?`)) {
        const success = deleteNode(nodeId);
        if (success) {
          const updatedData = { nodes: { ...currentTree?.nodes }, disconnectedNodes: currentTree?.disconnectedNodes };
          localStorage.setItem('treeData', JSON.stringify(updatedData));
        }
        if (!success) alert('Không thể xóa node này');
        return success;
      }
      return false;
    } catch (error) {
      console.error('Error deleting node:', error);
      alert('Có lỗi khi xóa node');
      return false;
    }
  }, [deleteNode, currentTree?.nodes, currentTree?.disconnectedNodes]);

  const handleDragStart = useCallback((nodeId, mouseEvent, currentPosition) => {
    startDrag(nodeId, mouseEvent, currentPosition);
  }, [startDrag]);

  // Enhanced setViewMode to save DFS scroll before switching away
  const handleSetViewMode = useCallback((mode) => {
    if (viewMode === 'dfs' && mode !== 'dfs' && dfsViewRef.current && dfsViewRef.current.getScrollPosition) {
      setDfsScroll(dfsViewRef.current.getScrollPosition());
    }
    setViewMode(mode);
  }, [viewMode]);

  if (treeLoading && !importLoading) {
    return (
      <div className="tree-hierarchy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
        <div className="text-lg font-semibold text-gray-700">Đang tải dữ liệu...</div>
        <div className="text-sm text-gray-500">Vui lòng đợi trong giây lát</div>
      </div>
    );
  }

  return (
    <div className="tree-hierarchy">
      <div className="tree-header">
        <h1 className="tree-title">Cây Phân Cấp Tương Tác - 3 View Modes</h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <JsonImporter 
            onImport={handleJsonImport}
            isLoading={importLoading}
            currentData={{ trees, selectedTree }}
            hideButtons={true}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '4px', gap: '4px' }}>
            <button
              onClick={() => { handleSetViewMode('canvas'); setMovingNode(null); setConnectingNode(null); if (dragState.isDragging) endDrag(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease',
                backgroundColor: viewMode === 'canvas' ? '#3b82f6' : 'transparent',
                color: viewMode === 'canvas' ? 'white' : '#6b7280'
              }}
            >
              <LayoutGrid className="w-4 h-4" />
              Canvas View
            </button>
            <button
              onClick={() => { handleSetViewMode('tree'); setMovingNode(null); setConnectingNode(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease',
                backgroundColor: viewMode === 'tree' ? '#3b82f6' : 'transparent',
                color: viewMode === 'tree' ? 'white' : '#6b7280'
              }}
            >
              <List className="w-4 h-4" />
              Tree View
            </button>
            <button
              onClick={() => { handleSetViewMode('dfs'); setMovingNode(null); setConnectingNode(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease',
                backgroundColor: viewMode === 'dfs' ? '#3b82f6' : 'transparent',
                color: viewMode === 'dfs' ? 'white' : '#6b7280'
              }}
            >
              <FileText className="w-4 h-4" />
              <span>DFS Full Content</span>
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* TreeView: truyền toàn bộ trees, các view khác chỉ truyền cây được chọn */}
      {viewMode === 'dfs' ? (
        <DfsTextView
          ref={dfsViewRef}
          nodes={currentTree?.nodes || {}}
          disconnectedNodes={currentTree?.disconnectedNodes || []}
          isNodeDisconnected={isNodeDisconnected}
          dfsOrder={dfsOrder}
          onEditNode={handleEditNode}
          dfsScroll={dfsScroll}
          setDfsScroll={setDfsScroll}
          trees={trees}
          selectedTree={selectedTree}
          setSelectedTree={setSelectedTree}
        />
      ) : viewMode === 'canvas' ? (
        <TreeCanvas
          nodes={currentTree?.nodes || {}}
          positions={positions}
          canvasSize={canvasSize}
          dragState={dragState}
          onDragStart={handleDragStart}
          movingNode={movingNode}
          connectingNode={connectingNode}
          disconnectedNodes={currentTree?.disconnectedNodes || []}
          onAddNode={handleAddNode}
          onEditNode={handleEditNode}
          onMoveNode={handleMoveNode}
          onDeleteNode={handleDeleteNode}
          onDisconnectNode={handleDisconnectNode}
          onConnectNode={handleConnectNode}
          isNodeDisconnected={isNodeDisconnected}
        />
      ) : viewMode === 'tree' ? (
        <TreeView
          trees={trees}
          // truyền thêm các props cần thiết nếu TreeView cần
        />
      ) : null}

      {movingNode && (
        <div className="moving-notification">
          <p className="moving-notification-title">
            Đang di chuyển logic: {currentTree?.nodes[movingNode]?.text?.substring(0, 40) || 'Unknown'}...
          </p>
          <p className="moving-notification-text">
            Click vào node đích để thay đổi parent, hoặc click nút ✕ để hủy
          </p>
        </div>
      )}

      {currentTree?.disconnectedNodes.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px 16px',
          zIndex: 1000,
          fontSize: '13px',
          color: '#92400e',
          maxWidth: '300px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            ⚡ {currentTree?.disconnectedNodes.length} node bị ngắt kết nối:
          </div>
          <div style={{ fontSize: '12px' }}>
            {currentTree?.disconnectedNodes.slice(0, 3).map(nodeId => 
              currentTree?.nodes[nodeId]?.text?.substring(0, 20) + '...' || 'Unknown'
            ).join(', ')}
            {currentTree?.disconnectedNodes.length > 3 && '...'}
          </div>
        </div>
      )}

      {showTreeSelector && (
        <TreeSelectorModal
          trees={trees}
          selectedTree={selectedTree}
          onSelect={setSelectedTree}
          onClose={() => setShowTreeSelector(false)}
        />
      )}
    </div>
  );
}

export default App;