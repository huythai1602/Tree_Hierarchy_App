// File: src/hooks/useTreeData.js (ENHANCED WITH FLEXIBLE SCHEMA SUPPORT)
import { useState, useCallback, useEffect } from 'react';
import { generateNodeId, isAncestor } from '../utils/treeHelpers';
import { useApiService } from './useApiService';

// Enhanced fallback data with additional fields example
const FALLBACK_DATA = {
  'root': {
    text: 'Root Node - This is the main root of the tree structure that contains all other nodes',
    cha: null,
    con: ['chuong1', 'chuong2'],
    // Example additional fields that should be preserved
    additionalFields: {
      timestamp: '2024-01-01T00:00:00Z',
      author: 'System'
    }
  },
  'chuong1': {
    text: 'Chương I - Introduction and Overview. This chapter covers the basic concepts and fundamental principles that will be used throughout the rest of the document.',
    cha: 'root',
    con: ['dieu1', 'dieu2'],
    additionalFields: {
      category: 'introduction',
      priority: 'high'
    }
  },
  'chuong2': {
    text: 'Chương II - Advanced Topics and Implementation Details. This chapter delves into more complex subjects, building upon the foundation established in Chapter I.',
    cha: 'root',
    con: ['dieu3', 'dieu4']
  },
  'dieu1': {
    text: 'Điều 1 - Basic Principles and Guidelines. This section establishes the fundamental rules and regulations that govern the entire system.',
    cha: 'chuong1',
    con: ['chunk1', 'chunk2']
  },
  'dieu2': {
    text: 'Điều 2 - Procedures and Protocols. This section details the specific procedures that must be followed when implementing the system.',
    cha: 'chuong1',
    con: ['chunk3']
  },
  'dieu3': {
    text: 'Điều 3 - Compliance and Monitoring. This section outlines the requirements for compliance monitoring and evaluation.',
    cha: 'chuong2',
    con: []
  },
  'dieu4': {
    text: 'Điều 4 - Reporting and Documentation. This section establishes the requirements for comprehensive reporting and documentation.',
    cha: 'chuong2',
    con: []
  },
  'chunk1': {
    text: 'Chunk 1 - Data Processing Module. This component handles the initial processing of incoming data streams.',
    cha: 'dieu1',
    con: []
  },
  'chunk2': {
    text: 'Chunk 2 - Analysis Engine. This sophisticated component performs complex analysis on the processed data.',
    cha: 'dieu1',
    con: []
  },
  'chunk3': {
    text: 'Chunk 3 - Output Generation System. This final component generates comprehensive reports and visualizations based on the analyzed data.',
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

  // Enhanced debug function for flexible schema content
  const debugContentPreservation = useCallback((source, data) => {
    if (!data || typeof data !== 'object') return;
    
    const sampleNodes = Object.keys(data).slice(0, 3);
    const additionalFieldsStats = Object.values(data).reduce((stats, node) => {
      if (node.additionalFields) {
        stats.nodesWithAdditional++;
        stats.totalFields += Object.keys(node.additionalFields).length;
        stats.fieldTypes.add(...Object.keys(node.additionalFields));
      }
      return stats;
    }, { 
      nodesWithAdditional: 0, 
      totalFields: 0, 
      fieldTypes: new Set() 
    });

    console.log(`🔍 Enhanced Content Debug [${source}]:`, {
      source,
      nodeCount: Object.keys(data).length,
      sampleLengths: sampleNodes.map(nodeId => ({
        id: nodeId,
        textLength: data[nodeId]?.text?.length || 0,
        textPreview: data[nodeId]?.text?.substring(0, 100) + '...',
        hasAdditionalFields: !!data[nodeId]?.additionalFields,
        additionalFieldCount: data[nodeId]?.additionalFields ? Object.keys(data[nodeId].additionalFields).length : 0
      })),
      additionalFieldsStats: {
        ...additionalFieldsStats,
        fieldTypes: Array.from(additionalFieldsStats.fieldTypes)
      },
      totalChars: Object.values(data).reduce((sum, node) => sum + (node?.text?.length || 0), 0)
    });
  }, []);

  // Enhanced validation with flexible schema support
  const validateImportData = useCallback((jsonData) => {
    console.log('🔍 Validating enhanced import data:', jsonData);
    
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Dữ liệu JSON phải là một object');
    }

    if (!jsonData.nodes || typeof jsonData.nodes !== 'object') {
      throw new Error('Dữ liệu JSON phải chứa thuộc tính "nodes" (object)');
    }

    const { nodes } = jsonData;

    if (!nodes.root) {
      throw new Error('Dữ liệu phải có node "root"');
    }

    debugContentPreservation('ENHANCED_VALIDATION', nodes);

    // Enhanced validation with additional fields support
    const nodeIds = Object.keys(nodes);
    const foundAdditionalFields = new Set();

    for (const nodeId of nodeIds) {
      const node = nodes[nodeId];
      
      // Validate core fields
      if (typeof node.text !== 'string') {
        throw new Error(`Node "${nodeId}" phải có thuộc tính "text" (string)`);
      }

      if (node.cha !== null && typeof node.cha !== 'string') {
        throw new Error(`Node "${nodeId}" phải có thuộc tính "cha" (string hoặc null)`);
      }

      if (node.cha && !nodes[node.cha]) {
        throw new Error(`Node "${nodeId}" có cha "${node.cha}" không tồn tại`);
      }

      if (!Array.isArray(node.con)) {
        throw new Error(`Node "${nodeId}" phải có thuộc tính "con" (array)`);
      }

      for (const childId of node.con) {
        if (!nodes[childId]) {
          throw new Error(`Node "${nodeId}" có con "${childId}" không tồn tại`);
        }
      }

      // Track additional fields
      if (node.additionalFields && typeof node.additionalFields === 'object') {
        Object.keys(node.additionalFields).forEach(field => {
          foundAdditionalFields.add(field);
        });
      }

      // Log long content nodes
      if (node.text.length > 200) {
        console.log(`📝 Long content node detected: ${nodeId} (${node.text.length} chars)`, 
                   node.additionalFields ? `with ${Object.keys(node.additionalFields).length} additional fields` : '');
      }
    }

    // Validate parent-child consistency
    for (const nodeId of nodeIds) {
      const node = nodes[nodeId];
      
      for (const childId of node.con) {
        const childNode = nodes[childId];
        if (childNode.cha !== nodeId) {
          throw new Error(`Mâu thuẫn: Node "${childId}" có cha là "${childNode.cha}" nhưng "${nodeId}" claim làm cha`);
        }
      }
    }

    // Enhanced validation for additional data structures
    if (jsonData.disconnectedNodes && !Array.isArray(jsonData.disconnectedNodes)) {
      throw new Error('Thuộc tính "disconnectedNodes" phải là array');
    }

    if (jsonData.customPositions && typeof jsonData.customPositions !== 'object') {
      throw new Error('Thuộc tính "customPositions" phải là object');
    }

    // Log detected additional fields
    if (foundAdditionalFields.size > 0) {
      console.log('🆕 Detected additional fields that will be preserved:', Array.from(foundAdditionalFields));
    }

    console.log('✅ Enhanced validation passed - Full content and additional fields preserved');
    return true;
  }, [debugContentPreservation]);

  // Load initial data with enhanced schema support
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedData = localStorage.getItem('treeData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData.nodes && parsedData.nodes.root) {
            debugContentPreservation('ENHANCED_LOCAL_STORAGE', parsedData.nodes);
            setNodes(parsedData.nodes);
            setDisconnectedNodes(new Set(parsedData.disconnectedNodes || []));
            setCustomPositions(parsedData.customPositions || {});
            setLastSaved(new Date().toISOString());
            console.log('✅ Enhanced data restored from localStorage');
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing enhanced data from localStorage:', e);
        }
      }

      const response = await apiService.loadTreeData();
      if (response.success && response.data) {
        console.log('📥 Loading enhanced data from API...');
        const loadedNodes = response.data.nodes || FALLBACK_DATA;
        debugContentPreservation('ENHANCED_API_LOAD', loadedNodes);
        setNodes(loadedNodes);
        setDisconnectedNodes(new Set(response.data.disconnectedNodes || []));
        setCustomPositions(response.data.customPositions || {});
        setLastSaved(response.data.metadata?.lastModified);
        console.log('✅ Enhanced data loaded from server');
      } else {
        console.log('📥 Using enhanced fallback data...');
        debugContentPreservation('ENHANCED_FALLBACK', FALLBACK_DATA);
        setNodes(FALLBACK_DATA);
      }
    } catch (error) {
      console.warn('⚠️ Cannot load enhanced data from server, using fallback:', error.message);
      debugContentPreservation('ENHANCED_FALLBACK_ERROR', FALLBACK_DATA);
      setNodes(FALLBACK_DATA);
      setDisconnectedNodes(new Set());
      setCustomPositions({});
    } finally {
      setIsLoading(false);
      setHasUnsavedChanges(false);
    }
  }, [apiService, debugContentPreservation]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auto-save with enhanced data preservation
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timeoutId = setTimeout(() => {
      saveToApi();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [nodes, disconnectedNodes, customPositions, hasUnsavedChanges]);

  const saveToApi = useCallback(async () => {
    try {
      debugContentPreservation('ENHANCED_SAVE_TO_API', nodes);
      
      const response = await apiService.saveTreeData(
        nodes,
        customPositions,
        Array.from(disconnectedNodes)
      );
      
      if (response.success) {
        setLastSaved(response.timestamp);
        setHasUnsavedChanges(false);
        console.log('✅ Enhanced data saved to server');
      }
    } catch (error) {
      console.error('❌ Cannot save enhanced data to server:', error.message);
    }
  }, [nodes, disconnectedNodes, customPositions, apiService, debugContentPreservation]);

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Enhanced import with flexible schema support
  const importJsonData = useCallback(async (jsonData) => {
    console.log('🚀 Starting enhanced import process with data:', jsonData);
    
    try {
      setIsLoading(true);

      validateImportData(jsonData);
      console.log('📝 Enhanced import data validation passed');

      debugContentPreservation('ENHANCED_PRE_IMPORT', jsonData.nodes);

      // Enhanced import with additional fields preservation
      const importedNodes = { ...jsonData.nodes };
      
      // Debug: Check for additional fields preservation
      const nodesWithAdditionalFields = Object.keys(importedNodes).filter(nodeId => 
        importedNodes[nodeId].additionalFields
      );
      
      if (nodesWithAdditionalFields.length > 0) {
        console.log('🆕 Preserving additional fields in nodes:', nodesWithAdditionalFields.map(nodeId => ({
          nodeId,
          fields: Object.keys(importedNodes[nodeId].additionalFields || {})
        })));
      }

      // Check for potential truncation
      Object.keys(importedNodes).forEach(nodeId => {
        const node = importedNodes[nodeId];
        if (node.text && node.text.includes('...')) {
          console.warn(`⚠️ Potential truncation detected in node ${nodeId}: "${node.text}"`);
        }
      });
      
      setNodes(importedNodes);

      const disconnectedNodesList = jsonData.disconnectedNodes || [];
      console.log('⚡ Setting disconnected nodes:', disconnectedNodesList.length, 'nodes');
      setDisconnectedNodes(new Set(disconnectedNodesList));

      const importedPositions = jsonData.customPositions || {};
      const validPositions = {};
      Object.keys(importedPositions).forEach(nodeId => {
        if (jsonData.nodes[nodeId]) {
          validPositions[nodeId] = importedPositions[nodeId];
        }
      });
      console.log('📍 Setting custom positions:', Object.keys(validPositions).length, 'positions');
      setCustomPositions(validPositions);

      // Enhanced save to localStorage with additional fields
      const saveData = {
        nodes: importedNodes,
        disconnectedNodes: Array.from(disconnectedNodesList),
        customPositions: validPositions,
        metadata: {
          importedAt: new Date().toISOString(),
          hasAdditionalFields: nodesWithAdditionalFields.length > 0,
          additionalFieldTypes: nodesWithAdditionalFields.reduce((types, nodeId) => {
            const fields = Object.keys(importedNodes[nodeId].additionalFields || {});
            return [...types, ...fields];
          }, [])
        }
      };
      localStorage.setItem('treeData', JSON.stringify(saveData));

      debugContentPreservation('ENHANCED_POST_IMPORT', importedNodes);

      setShouldTriggerAutoLayout(true);
      markAsChanged();

      const totalAdditionalFields = Object.values(importedNodes).reduce((count, node) => 
        count + (node.additionalFields ? Object.keys(node.additionalFields).length : 0), 0
      );

      console.log('✅ Enhanced import completed successfully:', {
        nodes: Object.keys(jsonData.nodes).length,
        disconnected: disconnectedNodesList.length,
        positions: Object.keys(validPositions).length,
        additionalFields: totalAdditionalFields,
        nodesWithAdditionalFields: nodesWithAdditionalFields.length,
        totalChars: Object.values(importedNodes).reduce((sum, node) => sum + (node?.text?.length || 0), 0)
      });

      return true;

    } catch (error) {
      console.error('❌ Enhanced import failed:', error);
      console.error('📋 Failed data structure:', jsonData);
      
      const enhancedError = new Error(`Enhanced import failed: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.importData = jsonData;
      throw enhancedError;
    } finally {
      setIsLoading(false);
    }
  }, [markAsChanged, validateImportData, debugContentPreservation]);

  const clearAutoLayoutTrigger = useCallback(() => {
    setShouldTriggerAutoLayout(false);
  }, []);

  const triggerAutoLayout = useCallback(() => {
    setShouldTriggerAutoLayout(true);
  }, []);

  const updateCustomPositions = useCallback((newPositions, shouldSave = false) => {
    setCustomPositions(newPositions);
    markAsChanged();
    
    if (shouldSave) {
      setTimeout(() => saveToApi(), 100);
    }
  }, [markAsChanged, saveToApi]);

  const getCustomPositions = useCallback(() => {
    return customPositions;
  }, [customPositions]);

  // Enhanced addNode with additional fields preservation
  const addNode = useCallback((parentId, text, additionalFields = {}) => {
    if (!text.trim()) return false;
    
    const fullText = text.trim();
    console.log(`➕ Adding new node with ${fullText.length} characters and additional fields:`, additionalFields);
    
    const newId = generateNodeId();
    const newNode = {
      text: fullText,
      cha: parentId,
      con: [],
      // Preserve additional fields if provided
      ...(Object.keys(additionalFields).length > 0 ? { additionalFields } : {})
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
      
      debugContentPreservation('ENHANCED_ADD_NODE', updated);
      return updated;
    });
    
    markAsChanged();
    return true;
  }, [markAsChanged, debugContentPreservation]);
  
  // Enhanced updateNodeText with additional fields preservation
  const updateNodeText = useCallback((nodeId, newText, preserveAdditionalFields = true) => {
    // FIXED: Allow empty text - don't check for content
    const fullText = typeof newText === 'string' ? newText.trim() : '';
    console.log(`✏️ Updating node ${nodeId} with ${fullText.length} characters (allowing empty)`);
    
    setNodes(prev => {
      const existingNode = prev[nodeId];
      const updated = {
        ...prev,
        [nodeId]: {
          ...existingNode,
          text: fullText, // Allow empty string
          // Preserve additional fields if requested
          ...(preserveAdditionalFields && existingNode.additionalFields ? 
              { additionalFields: existingNode.additionalFields } : {})
        }
      };
      
      debugContentPreservation('ENHANCED_UPDATE_NODE_TEXT', updated);
      return updated;
    });
    
    markAsChanged();
    return true;
  }, [markAsChanged, debugContentPreservation]);

  // Enhanced deleteNode with additional fields cleanup
  const deleteNode = useCallback((nodeId) => {
    if (nodeId === 'root') return false;
    
    setNodes(prev => {
      const newNodes = { ...prev };
      
      const deleteRecursive = (id) => {
        const nodeToDelete = newNodes[id];
        if (!nodeToDelete) return;
        
        // Log if deleting nodes with additional fields
        if (nodeToDelete.additionalFields) {
          console.log(`🗑️ Deleting node ${id} with additional fields:`, Object.keys(nodeToDelete.additionalFields));
        }
        
        if (nodeToDelete.con && nodeToDelete.con.length > 0) {
          nodeToDelete.con.forEach(childId => deleteRecursive(childId));
        }
        
        if (nodeToDelete.cha && newNodes[nodeToDelete.cha]) {
          newNodes[nodeToDelete.cha] = {
            ...newNodes[nodeToDelete.cha],
            con: newNodes[nodeToDelete.cha].con.filter(cId => cId !== id)
          };
        }
        
        delete newNodes[id];
      };
      
      deleteRecursive(nodeId);
      debugContentPreservation('ENHANCED_DELETE_NODE', newNodes);
      return newNodes;
    });
    
    setDisconnectedNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });

    setCustomPositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[nodeId];
      return newPositions;
    });
    
    markAsChanged();
    return true;
  }, [markAsChanged, debugContentPreservation]);

  // Enhanced disconnectNode with additional fields preservation
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
          // Additional fields are preserved automatically
        }
      };
      
      debugContentPreservation('ENHANCED_DISCONNECT_NODE', updated);
      return updated;
    });
    
    setDisconnectedNodes(prev => new Set([...prev, nodeId]));
    markAsChanged();
    return true;
  }, [markAsChanged, debugContentPreservation]);
  
  // Enhanced connectNode with additional fields preservation
  const connectNode = useCallback((nodeId, newParentId) => {
    if (nodeId === newParentId || nodeId === 'root') return false;
    if (isAncestor(nodes, nodeId, newParentId)) return false;
    
    setNodes(prev => {
      const node = prev[nodeId];
      const newParent = prev[newParentId];
      
      if (!node || !newParent) return prev;
      
      let updatedNodes = { ...prev };
      
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
          // Additional fields preserved automatically
        }
      };
      
      debugContentPreservation('ENHANCED_CONNECT_NODE', updated);
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
  
  const moveNode = useCallback((nodeId, newParentId) => {
    return connectNode(nodeId, newParentId);
  }, [connectNode]);
  
  const getDisconnectedNodes = useCallback(() => {
    return Array.from(disconnectedNodes).filter(nodeId => nodes[nodeId]);
  }, [disconnectedNodes, nodes]);
  
  const isNodeDisconnected = useCallback((nodeId) => {
    return disconnectedNodes.has(nodeId);
  }, [disconnectedNodes]);
  
  const reconnectAllNodes = useCallback(() => {
    const disconnectedList = Array.from(disconnectedNodes);
    
    disconnectedList.forEach(nodeId => {
      if (nodes[nodeId]) {
        connectNode(nodeId, 'root');
      }
    });
  }, [disconnectedNodes, nodes, connectNode]);

  const saveNow = useCallback(async () => {
    await saveToApi();
  }, [saveToApi]);

  const resetToServerData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const resetToDefault = useCallback(async () => {
    try {
      const response = await apiService.resetTreeData();
      if (response.success) {
        debugContentPreservation('ENHANCED_RESET_DEFAULT', response.data.nodes);
        setNodes(response.data.nodes);
        setDisconnectedNodes(new Set(response.data.disconnectedNodes || []));
        setCustomPositions(response.data.customPositions || {});
        setLastSaved(response.data.metadata?.lastModified);
        setHasUnsavedChanges(false);
        console.log('✅ Enhanced data reset to default');
      }
    } catch (error) {
      console.error('❌ Cannot reset enhanced data:', error.message);
      debugContentPreservation('ENHANCED_RESET_FALLBACK', FALLBACK_DATA);
      setNodes(FALLBACK_DATA);
      setDisconnectedNodes(new Set());
      setCustomPositions({});
      markAsChanged();
    }
  }, [apiService, markAsChanged, debugContentPreservation]);

  const resetPositionsOnly = useCallback(() => {
    setCustomPositions({});
    setShouldTriggerAutoLayout(true);
    markAsChanged();
  }, [markAsChanged]);

  // Enhanced utility function to get additional fields for a node
  const getNodeAdditionalFields = useCallback((nodeId) => {
    return nodes[nodeId]?.additionalFields || {};
  }, [nodes]);

  // Enhanced utility function to update additional fields for a node
  const updateNodeAdditionalFields = useCallback((nodeId, additionalFields) => {
    setNodes(prev => {
      if (!prev[nodeId]) return prev;
      
      const updated = {
        ...prev,
        [nodeId]: {
          ...prev[nodeId],
          additionalFields: {
            ...prev[nodeId].additionalFields,
            ...additionalFields
          }
        }
      };
      
      console.log(`🆕 Updated additional fields for node ${nodeId}:`, additionalFields);
      return updated;
    });
    
    markAsChanged();
    return true;
  }, [markAsChanged]);

  // Enhanced utility function to get schema statistics
  const getSchemaStatistics = useCallback(() => {
    const stats = {
      totalNodes: Object.keys(nodes).length,
      nodesWithAdditionalFields: 0,
      additionalFieldTypes: new Set(),
      totalAdditionalFields: 0
    };

    Object.values(nodes).forEach(node => {
      if (node.additionalFields) {
        stats.nodesWithAdditionalFields++;
        const fieldKeys = Object.keys(node.additionalFields);
        stats.totalAdditionalFields += fieldKeys.length;
        fieldKeys.forEach(key => stats.additionalFieldTypes.add(key));
      }
    });

    return {
      ...stats,
      additionalFieldTypes: Array.from(stats.additionalFieldTypes)
    };
  }, [nodes]);
  
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
    
    // CRUD operations (enhanced)
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
    
    // JSON import/export operations (enhanced)
    importJsonData,
    
    // Utility functions
    isNodeDisconnected,
    reconnectAllNodes,
    
    // Enhanced additional fields operations
    getNodeAdditionalFields,
    updateNodeAdditionalFields,
    getSchemaStatistics,
    
    // Persistence operations
    saveNow,
    resetToServerData,
    resetToDefault,
    loadInitialData
  };
};