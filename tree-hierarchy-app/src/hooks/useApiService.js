// File: src/hooks/useApiService.js (NEW FILE)
import { useState, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const useApiService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function để gọi API
  const callApi = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error('API call failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy toàn bộ dữ liệu cây
  const loadTreeData = useCallback(async () => {
    return await callApi('/tree');
  }, [callApi]);

  // Lưu toàn bộ dữ liệu cây
  const saveTreeData = useCallback(async (nodes, customPositions = {}, disconnectedNodes = []) => {
    return await callApi('/tree', {
      method: 'POST',
      body: JSON.stringify({
        nodes,
        customPositions,
        disconnectedNodes
      })
    });
  }, [callApi]);

  // Thêm node mới
  const addNode = useCallback(async (nodeId, text, parentId) => {
    return await callApi('/tree/node', {
      method: 'POST',
      body: JSON.stringify({
        nodeId,
        text,
        parentId
      })
    });
  }, [callApi]);

  // Cập nhật node
  const updateNode = useCallback(async (nodeId, updates) => {
    return await callApi(`/tree/node/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }, [callApi]);

  // Xóa node
  const deleteNode = useCallback(async (nodeId) => {
    return await callApi(`/tree/node/${nodeId}`, {
      method: 'DELETE'
    });
  }, [callApi]);

  // Reset về dữ liệu mặc định
  const resetTreeData = useCallback(async () => {
    return await callApi('/tree/reset', {
      method: 'POST'
    });
  }, [callApi]);

  // Health check
  const checkHealth = useCallback(async () => {
    return await callApi('/health');
  }, [callApi]);

  return {
    loading,
    error,
    loadTreeData,
    saveTreeData,
    addNode,
    updateNode,
    deleteNode,
    resetTreeData,
    checkHealth
  };
};