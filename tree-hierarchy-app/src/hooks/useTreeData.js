// File: src/hooks/useTreeData.js (FIXED FULL CONTENT PRESERVATION)
import { useState, useCallback, useEffect } from 'react';
import { generateNodeId, isAncestor } from '../utils/treeHelpers';
import { useApiService } from './useApiService';

// Fallback data nếu API và localStorage không khả dụng
const FALLBACK_DATA = {
  'root': {
    text: 'Root Node - This is the main root of the tree structure that contains all other nodes',
    cha: null,
    con: ['chuong1', 'chuong2']
  },
  'chuong1': {
    text: 'Chương I - Introduction and Overview. This chapter covers the basic concepts and fundamental principles that will be used throughout the rest of the document. It provides essential background information and sets the foundation for understanding the more complex topics discussed in later chapters.',
    cha: 'root',
    con: ['dieu1', 'dieu2']
  },
  'chuong2': {
    text: 'Chương II - Advanced Topics and Implementation Details. This chapter delves into more complex subjects, building upon the foundation established in Chapter I. It includes detailed explanations, practical examples, and best practices for implementing the concepts discussed.',
    cha: 'root',
    con: ['dieu3', 'dieu4']
  },
  'dieu1': {
    text: 'Điều 1 - Basic Principles and Guidelines. This section establishes the fundamental rules and regulations that govern the entire system. It outlines the core principles that must be followed and provides detailed explanations of why these principles are important for maintaining consistency and effectiveness.',
    cha: 'chuong1',
    con: ['chunk1', 'chunk2']
  },
  'dieu2': {
    text: 'Điều 2 - Procedures and Protocols. This section details the specific procedures that must be followed when implementing the system. It includes step-by-step instructions, safety protocols, and quality assurance measures to ensure proper execution.',
    cha: 'chuong1',
    con: ['chunk3']
  },
  'dieu3': {
    text: 'Điều 3 - Compliance and Monitoring. This section outlines the requirements for compliance monitoring and evaluation. It describes the processes for ensuring that all activities adhere to established standards and includes guidelines for conducting regular assessments.',
    cha: 'chuong2',
    con: []
  },
  'dieu4': {
    text: 'Điều 4 - Reporting and Documentation. This section establishes the requirements for comprehensive reporting and documentation. It specifies what information must be recorded, how it should be formatted, and when reports must be submitted to ensure proper accountability and transparency.',
    cha: 'chuong2',
    con: []
  },
  'chunk1': {
    text: 'Chunk 1 - Data Processing Module. This component handles the initial processing of incoming data streams. It performs validation, normalization, and basic transformations to prepare the data for further analysis. The module includes error handling capabilities and logging mechanisms to track processing status and identify potential issues.',
    cha: 'dieu1',
    con: []
  },
  'chunk2': {
    text: 'Chunk 2 - Analysis Engine. This sophisticated component performs complex analysis on the processed data. It utilizes advanced algorithms and machine learning techniques to extract meaningful insights and patterns. The engine can handle large volumes of data and provides real-time analysis capabilities with configurable parameters.',
    cha: 'dieu1',
    con: []
  },
  'chunk3': {
    text: 'Chunk 3 - Output Generation System. This final component generates comprehensive reports and visualizations based on the analyzed data. It supports multiple output formats including PDF, Excel, and interactive dashboards. The system allows for customizable templates and automated scheduling of report generation.',
    cha: 'dieu2',
    con: []
  }
};

export const useTreeData = () => {
  const [nodes, setNodes] = useState(FALLBACK_DATA);
  const [disconnectedNodes, setDisconnectedNodes] = useState(new Set());
  const [customPositions, setCustomPositions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [shouldTriggerAutoLayout, setShouldTriggerAutoLayout] = useState(false);
  
  const apiService = useApiService();

  // CRITICAL: Debug function to log content preservation
  const debugContentPreservation = useCallback((source, data) => {
    if (!data || typeof data !== 'object') return;
    
    const sampleNodes = Object.keys(data).slice(0, 3);
    console.log(`🔍 Content Debug [${source}]:`, {
      source,
      nodeCount: Object.keys(data).length,
      sampleLengths: sampleNodes.map(nodeId => ({
        id: nodeId,
        textLength: data[nodeId]?.text?.length || 0,
        textPreview: data[nodeId]?.text?.substring(0, 100) + '...',
        hasTruncation: data[nodeId]?.text?.includes('...') || false
      })),
      totalChars: Object.values(data).reduce((sum, node) => sum + (node?.text?.length || 0), 0)
    });
  }, []);

  // Load dữ liệu ban đầu từ localStorage hoặc API
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Kiểm tra localStorage trước
      const savedData = localStorage.getItem('treeData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData.nodes && parsedData.nodes.root) {
            debugContentPreservation('LOCAL_STORAGE', parsedData.nodes);
            setNodes(parsedData.nodes);
            setDisconnectedNodes(new Set(parsedData.disconnectedNodes || []));
            setCustomPositions(parsedData.customPositions || {});
            setLastSaved(new Date().toISOString());
            console.log('✅ Dữ liệu đã được khôi phục từ localStorage');
            setIsLoading(false);
            return; // Thoát nếu đã khôi phục từ localStorage
          }
        } catch (e) {
          console.error('Lỗi khi parse dữ liệu từ localStorage:', e);
        }
      }

      // Nếu không có dữ liệu localStorage, thử load từ API
      const response = await apiService.loadTreeData();
      if (response.success && response.data) {
        console.log('📥 Loading data from API...');
        const loadedNodes = response.data.nodes || FALLBACK_DATA;
        debugContentPreservation('API_LOAD', loadedNodes);
        setNodes(loadedNodes);
        setDisconnectedNodes(new Set(response.data.disconnectedNodes || []));
        setCustomPositions(response.data.customPositions || {});
        setLastSaved(response.data.metadata?.lastModified);
        console.log('✅ Dữ liệu và vị trí đã được load từ server');
      } else {
        console.log('📥 Using fallback data...');
        debugContentPreservation('FALLBACK', FALLBACK_DATA);
        setNodes(FALLBACK_DATA);
      }
    } catch (error) {
      console.warn('⚠️ Không thể load dữ liệu từ server, sử dụng dữ liệu fallback:', error.message);
      debugContentPreservation('FALLBACK_ERROR', FALLBACK_DATA);
      setNodes(FALLBACK_DATA);
      setDisconnectedNodes(new Set());
      setCustomPositions({});
    } finally {
      setIsLoading(false);
      setHasUnsavedChanges(false);
    }
  }, [apiService, debugContentPreservation]);

  // Gọi loadInitialData khi component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auto-save khi có thay đổi (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timeoutId = setTimeout(() => {
      saveToApi();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [nodes, disconnectedNodes, customPositions, hasUnsavedChanges]);

  // Lưu dữ liệu lên API
  const saveToApi = useCallback(async () => {
    try {
      debugContentPreservation('SAVE_TO_API', nodes);
      
      const response = await apiService.saveTreeData(
        nodes,
        customPositions,
        Array.from(disconnectedNodes)
      );
      
      if (response.success) {
        setLastSaved(response.timestamp);
        setHasUnsavedChanges(false);
        console.log('✅ Dữ liệu và vị trí đã được lưu lên server');
      }
    } catch (error) {
      console.error('❌ Không thể lưu dữ liệu lên server:', error.message);
    }
  }, [nodes, disconnectedNodes, customPositions, apiService, debugContentPreservation]);

  // Helper để mark có thay đổi
  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // CRITICAL: Enhanced validation for import data - PRESERVE FULL CONTENT
  const validateImportData = useCallback((jsonData) => {
    console.log('🔍 Validating import data:', jsonData);
    
    // Kiểm tra cấu trúc cơ bản
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Dữ liệu JSON phải là một object');
    }

    // IMPORTANT: Check if nodes exists and has root
    if (!jsonData.nodes || typeof jsonData.nodes !== 'object') {
      throw new Error('Dữ liệu JSON phải chứa thuộc tính "nodes" (object)');
    }

    const { nodes } = jsonData;

    // Check root node exists
    if (!nodes.root) {
      throw new Error('Dữ liệu phải có node "root"');
    }

    // CRITICAL: Debug content preservation during validation
    debugContentPreservation('VALIDATION', nodes);

    // Validate root node structure
    const rootNode = nodes.root;
    if (!rootNode.text || typeof rootNode.text !== 'string') {
      throw new Error('Node "root" phải có thuộc tính "text" (string)');
    }

    if (rootNode.cha !== null) {
      throw new Error('Node "root" phải có cha = null');
    }

    if (!Array.isArray(rootNode.con)) {
      throw new Error('Node "root" phải có thuộc tính "con" (array)');
    }

    // Validate other nodes - PRESERVE FULL TEXT CONTENT
    const nodeIds = Object.keys(nodes);
    for (const nodeId of nodeIds) {
      if (nodeId === 'root') continue; // Already validated above
      
      const node = nodes[nodeId];
      
      // Check text - ALLOW LONG CONTENT
      if (typeof node.text !== 'string') {
        throw new Error(`Node "${nodeId}" phải có thuộc tính "text" (string)`);
      }

      // CRITICAL: Log long content nodes to ensure preservation
      if (node.text.length > 200) {
        console.log(`📝 Long content node detected: ${nodeId} (${node.text.length} chars)`);
      }

      // Check cha
      if (node.cha !== null && typeof node.cha !== 'string') {
        throw new Error(`Node "${nodeId}" phải có thuộc tính "cha" (string hoặc null)`);
      }

      // Check parent exists
      if (node.cha && !nodes[node.cha]) {
        throw new Error(`Node "${nodeId}" có cha "${node.cha}" không tồn tại`);
      }

      // Check con
      if (!Array.isArray(node.con)) {
        throw new Error(`Node "${nodeId}" phải có thuộc tính "con" (array)`);
      }

      // Check children exist
      for (const childId of node.con) {
        if (!nodes[childId]) {
          throw new Error(`Node "${nodeId}" có con "${childId}" không tồn tại`);
        }
      }
    }

    // Validate parent-child consistency
    for (const nodeId of nodeIds) {
      const node = nodes[nodeId];
      
      // Check each child points back to parent
      for (const childId of node.con) {
        const childNode = nodes[childId];
        if (childNode.cha !== nodeId) {
          throw new Error(`Mâu thuẫn: Node "${childId}" có cha là "${childNode.cha}" nhưng "${nodeId}" claim làm cha`);
        }
      }
    }

    // Validate disconnectedNodes if present
    if (jsonData.disconnectedNodes) {
      if (!Array.isArray(jsonData.disconnectedNodes)) {
        throw new Error('Thuộc tính "disconnectedNodes" phải là array');
      }
      
      for (const nodeId of jsonData.disconnectedNodes) {
        if (!nodes[nodeId]) {
          throw new Error(`Node "${nodeId}" trong disconnectedNodes không tồn tại`);
        }
      }
    }

    // Validate customPositions if present
    if (jsonData.customPositions) {
      if (typeof jsonData.customPositions !== 'object') {
        throw new Error('Thuộc tính "customPositions" phải là object');
      }
      
      for (const [nodeId, position] of Object.entries(jsonData.customPositions)) {
        if (!nodes[nodeId]) {
          throw new Error(`Node "${nodeId}" trong customPositions không tồn tại`);
        }
        
        if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
          throw new Error(`Vị trí của node "${nodeId}" phải có x và y là số`);
        }
      }
    }

    console.log('✅ Validation passed for import data - Full content preserved');
    return true;
  }, [debugContentPreservation]);

  // ENHANCED: Import JSON data with FULL CONTENT PRESERVATION
  const importJsonData = useCallback(async (jsonData) => {
    console.log('🚀 Starting import process with data:', jsonData);
    
    try {
      // Set loading state
      setIsLoading(true);

      // CRITICAL: Validate the processed data (should already be in app format)
      validateImportData(jsonData);

      console.log('📝 Import data validation passed, proceeding with import...');

      // CRITICAL: Debug content before import
      debugContentPreservation('PRE_IMPORT', jsonData.nodes);

      // Import nodes - PRESERVE FULL CONTENT
      console.log('📦 Setting nodes:', Object.keys(jsonData.nodes).length, 'nodes');
      
      // CRITICAL: Ensure no truncation during state update
      const importedNodes = { ...jsonData.nodes };
      
      // Debug: Check for any potential truncation
      Object.keys(importedNodes).forEach(nodeId => {
        const node = importedNodes[nodeId];
        if (node.text && node.text.includes('...')) {
          console.warn(`⚠️ Potential truncation detected in node ${nodeId}: "${node.text}"`);
        }
      });
      
      setNodes(importedNodes);

      // Import disconnected nodes
      const disconnectedNodesList = jsonData.disconnectedNodes || [];
      console.log('⚡ Setting disconnected nodes:', disconnectedNodesList.length, 'nodes');
      setDisconnectedNodes(new Set(disconnectedNodesList));

      // Import custom positions - chỉ giữ positions cho nodes có trong imported data
      const importedPositions = jsonData.customPositions || {};
      const validPositions = {};
      Object.keys(importedPositions).forEach(nodeId => {
        if (jsonData.nodes[nodeId]) {
          validPositions[nodeId] = importedPositions[nodeId];
        }
      });
      console.log('📍 Setting custom positions:', Object.keys(validPositions).length, 'positions');
      setCustomPositions(validPositions);

      // Lưu vào localStorage
      const saveData = {
        nodes: importedNodes,
        disconnectedNodes: Array.from(disconnectedNodesList),
        customPositions: validPositions
      };
      localStorage.setItem('treeData', JSON.stringify(saveData));

      // CRITICAL: Debug content after import
      debugContentPreservation('POST_IMPORT', importedNodes);

      // Trigger auto-layout để sắp xếp lại các nodes mới
      setShouldTriggerAutoLayout(true);

      // Mark as changed để trigger auto-save
      markAsChanged();

      console.log('✅ Import JSON completed successfully with FULL CONTENT:', {
        nodes: Object.keys(jsonData.nodes).length,
        disconnected: disconnectedNodesList.length,
        positions: Object.keys(validPositions).length,
        autoLayoutTriggered: true,
        totalChars: Object.values(importedNodes).reduce((sum, node) => sum + (node?.text?.length || 0), 0)
      });

      return true;

    } catch (error) {
      console.error('❌ Import JSON failed:', error);
      console.error('📋 Failed data structure:', jsonData);
      
      // Re-throw with more context
      const enhancedError = new Error(`Import failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.importData = jsonData;
      throw enhancedError;
    } finally {
      setIsLoading(false);
    }
  }, [markAsChanged, validateImportData, debugContentPreservation]);

  // Clear auto-layout trigger (to be called by App.js)
  const clearAutoLayoutTrigger = useCallback(() => {
    setShouldTriggerAutoLayout(false);
  }, []);

  // Force auto-layout for current data
  const triggerAutoLayout = useCallback(() => {
    setShouldTriggerAutoLayout(true);
  }, []);

  // Update custom positions (từ drag & drop)
  const updateCustomPositions = useCallback((newPositions, shouldSave = false) => {
    setCustomPositions(newPositions);
    markAsChanged();
    
    // Immediate save nếu shouldSave = true (khi kết thúc drag)
    if (shouldSave) {
      setTimeout(() => saveToApi(), 100); // Small delay để ensure state update
    }
  }, [markAsChanged, saveToApi]);

  // Get custom positions
  const getCustomPositions = useCallback(() => {
    return customPositions;
  }, [customPositions]);

  // CRITICAL: Thêm node mới - PRESERVE FULL CONTENT
  const addNode = useCallback((parentId, text) => {
    if (!text.trim()) return false;
    
    const fullText = text.trim(); // Keep full text, no truncation
    console.log(`➕ Adding new node with ${fullText.length} characters`);
    
    const newId = generateNodeId();
    const newNode = {
      text: fullText, // FULL CONTENT
      cha: parentId,
      con: []
    };
    
    setNodes(prev => {
      const updated = {
        ...prev,
        [newId]: newNode,
        [parentId]: {
          ...prev[parentId],
          con: [...prev[parentId].con, newId]
        }
      };
      
      debugContentPreservation('ADD_NODE', updated);
      return updated;
    });
    
    markAsChanged();
    return true;
  }, [markAsChanged, debugContentPreservation]);
  
  // CRITICAL: Cập nhật text - PRESERVE FULL CONTENT
  const updateNodeText = useCallback((nodeId, newText) => {
    if (!newText.trim()) return false;
    
    const fullText = newText.trim(); // Keep full text, no truncation
    console.log(`✏️ Updating node ${nodeId} with ${fullText.length} characters`);
    
    setNodes(prev => {
      const updated = {
        ...prev,
        [nodeId]: {
          ...prev[nodeId],
          text: fullText // FULL CONTENT
        }
      };
      
      debugContentPreservation('UPDATE_NODE_TEXT', updated);
      return updated;
    });
    
    markAsChanged();
    return true;
  }, [markAsChanged, debugContentPreservation]);
  
  // Xóa node hoàn toàn
  const deleteNode = useCallback((nodeId) => {
    if (nodeId === 'root') return false;
    
    setNodes(prev => {
      const newNodes = { ...prev };
      
      const deleteRecursive = (id) => {
        const nodeToDelete = newNodes[id];
        if (!nodeToDelete) return;
        
        // Xóa tất cả children trước
        if (nodeToDelete.con && nodeToDelete.con.length > 0) {
          nodeToDelete.con.forEach(childId => deleteRecursive(childId));
        }
        
        // Xóa khỏi parent
        if (nodeToDelete.cha && newNodes[nodeToDelete.cha]) {
          newNodes[nodeToDelete.cha] = {
            ...newNodes[nodeToDelete.cha],
            con: newNodes[nodeToDelete.cha].con.filter(cId => cId !== id)
          };
        }
        
        // Xóa node
        delete newNodes[id];
      };
      
      deleteRecursive(nodeId);
      debugContentPreservation('DELETE_NODE', newNodes);
      return newNodes;
    });
    
    // Xóa khỏi disconnected set
    setDisconnectedNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });

    // Xóa custom position của node đã xóa
    setCustomPositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[nodeId];
      return newPositions;
    });
    
    markAsChanged();
    return true;
  }, [markAsChanged, debugContentPreservation]);
  
  // Ngắt kết nối node
  const disconnectNode = useCallback((nodeId) => {
    if (nodeId === 'root') return false;
    
    setNodes(prev => {
      const node = prev[nodeId];
      if (!node || !node.cha) return prev;
      
      const parentId = node.cha;
      const parent = prev[parentId];
      if (!parent) return prev;
      
      const updated = {
        ...prev,
        [parentId]: {
          ...parent,
          con: parent.con.filter(id => id !== nodeId)
        },
        [nodeId]: {
          ...node,
          cha: null
        }
      };
      
      debugContentPreservation('DISCONNECT_NODE', updated);
      return updated;
    });
    
    setDisconnectedNodes(prev => new Set([...prev, nodeId]));
    markAsChanged();
    return true;
  }, [markAsChanged, debugContentPreservation]);
  
  // Nối lại node
  const connectNode = useCallback((nodeId, newParentId) => {
    if (nodeId === newParentId || nodeId === 'root') return false;
    if (isAncestor(nodes, nodeId, newParentId)) return false;
    
    setNodes(prev => {
      const node = prev[nodeId];
      const newParent = prev[newParentId];
      
      if (!node || !newParent) return prev;
      
      let updatedNodes = { ...prev };
      
      // Nếu node đã có parent, xóa khỏi parent cũ
      if (node.cha && updatedNodes[node.cha]) {
        updatedNodes[node.cha] = {
          ...updatedNodes[node.cha],
          con: updatedNodes[node.cha].con.filter(id => id !== nodeId)
        };
      }
      
      const updated = {
        ...updatedNodes,
        [newParentId]: {
          ...updatedNodes[newParentId],
          con: [...updatedNodes[newParentId].con, nodeId]
        },
        [nodeId]: {
          ...updatedNodes[nodeId],
          cha: newParentId
        }
      };
      
      debugContentPreservation('CONNECT_NODE', updated);
      return updated;
    });
    
    setDisconnectedNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });
    
    markAsChanged();
    return true;
  }, [nodes, markAsChanged, debugContentPreservation]);
  
  // Di chuyển node
  const moveNode = useCallback((nodeId, newParentId) => {
    return connectNode(nodeId, newParentId);
  }, [connectNode]);
  
  // Lấy disconnected nodes
  const getDisconnectedNodes = useCallback(() => {
    return Array.from(disconnectedNodes).filter(nodeId => nodes[nodeId]);
  }, [disconnectedNodes, nodes]);
  
  // Kiểm tra node có disconnected không
  const isNodeDisconnected = useCallback((nodeId) => {
    return disconnectedNodes.has(nodeId);
  }, [disconnectedNodes]);
  
  // Nối lại tất cả nodes về root
  const reconnectAllNodes = useCallback(() => {
    const disconnectedList = Array.from(disconnectedNodes);
    
    disconnectedList.forEach(nodeId => {
      if (nodes[nodeId]) {
        connectNode(nodeId, 'root');
      }
    });
  }, [disconnectedNodes, nodes, connectNode]);

  // Manual save
  const saveNow = useCallback(async () => {
    await saveToApi();
  }, [saveToApi]);

  // Reset to server data
  const resetToServerData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Reset to default data
  const resetToDefault = useCallback(async () => {
    try {
      const response = await apiService.resetTreeData();
      if (response.success) {
        debugContentPreservation('RESET_DEFAULT', response.data.nodes);
        setNodes(response.data.nodes);
        setDisconnectedNodes(new Set(response.data.disconnectedNodes || []));
        setCustomPositions(response.data.customPositions || {});
        setLastSaved(response.data.metadata?.lastModified);
        setHasUnsavedChanges(false);
        console.log('✅ Dữ liệu và vị trí đã được reset về mặc định');
      }
    } catch (error) {
      console.error('❌ Không thể reset dữ liệu:', error.message);
      // Fallback to local reset
      debugContentPreservation('RESET_FALLBACK', FALLBACK_DATA);
      setNodes(FALLBACK_DATA);
      setDisconnectedNodes(new Set());
      setCustomPositions({});
      markAsChanged();
    }
  }, [apiService, markAsChanged, debugContentPreservation]);

  // Reset chỉ custom positions (giữ nguyên nodes data)
  const resetPositionsOnly = useCallback(() => {
    setCustomPositions({});
    setShouldTriggerAutoLayout(true); // Trigger auto-layout when reset positions
    markAsChanged();
  }, [markAsChanged]);
  
  return {
    // Data
    nodes,
    disconnectedNodes: getDisconnectedNodes(),
    customPositions,
    
    // State
    isLoading,
    hasUnsavedChanges,
    lastSaved,
    apiError: apiService.error,
    shouldTriggerAutoLayout,
    
    // CRUD operations
    addNode,
    deleteNode,
    updateNodeText,
    
    // Connection operations
    disconnectNode,
    connectNode,
    moveNode,
    
    // Position operations
    updateCustomPositions,
    getCustomPositions,
    resetPositionsOnly,
    
    // Auto-layout operations
    triggerAutoLayout,
    clearAutoLayoutTrigger,
    
    // JSON import/export operations - ENHANCED WITH FULL CONTENT
    importJsonData,
    
    // Utility functions
    isNodeDisconnected,
    reconnectAllNodes,
    
    // Persistence operations
    saveNow,
    resetToServerData,
    resetToDefault,
    loadInitialData
  };
}