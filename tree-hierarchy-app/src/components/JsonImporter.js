// File: src/components/JsonImporter.js (ENHANCED VERSION - FIXED)
import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';

const JsonImporter = ({ onImport, isLoading, currentData, hideButtons = false }) => {
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Enhanced JSON structure validation with flexible schema support
  const validateJsonStructure = (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('File JSON phải chứa một object');
    }

    // Check current app format (nodes with cha/con or parent/child)
    if (data.nodes && typeof data.nodes === 'object') {
      if (!data.nodes.root) {
        throw new Error('Dữ liệu phải có node "root"');
      }
      return { format: 'app', data };
    }

    // Check document format (root_id + tree)
    if (data.root_id && data.tree && typeof data.tree === 'object') {
      return { format: 'document', data };
    }

    // Check direct tree format (flat structure with parent/child or cha/con)
    const keys = Object.keys(data);
    if (keys.length > 0) {
      const sampleNode = data[keys[0]];
      if (sampleNode && typeof sampleNode === 'object' && 
          (sampleNode.text !== undefined) &&
          (sampleNode.parent !== undefined || sampleNode.child !== undefined ||
           sampleNode.cha !== undefined || sampleNode.con !== undefined)) {
        return { format: 'flat', data };
      }
    }

    throw new Error('File JSON không đúng format. Cần có "nodes", "root_id + tree", hoặc cấu trúc flat với parent/child');
  };

  const validateDocumentFormat = (data) => {
    const { root_id, tree } = data;

    if (!root_id || typeof root_id !== 'string') {
      throw new Error('Phải có "root_id" (string)');
    }

    if (!tree[root_id]) {
      throw new Error(`Root node "${root_id}" không tồn tại trong tree`);
    }

    return true;
  };

  // Enhanced converter with flexible field mapping
  const convertToAppFormat = (validationResult) => {
    const { format, data } = validationResult;

    if (format === 'app') {
      // Already in app format, just normalize field names
      return normalizeAppFormat(data);
    }

    if (format === 'document') {
      return convertDocumentToAppFormat(data);
    }

    if (format === 'flat') {
      return convertFlatToAppFormat(data);
    }

    throw new Error('Unknown format');
  };

  // Normalize field names in app format (cha/con -> parent/child support)
  const normalizeAppFormat = (data) => {
    const normalizedData = {
      nodes: {},
      disconnectedNodes: data.disconnectedNodes || [],
      customPositions: data.customPositions || {}
    };

    Object.keys(data.nodes).forEach(nodeId => {
      const node = data.nodes[nodeId];
      const normalizedNode = {
        text: node.text || '',
        // Support both old (cha/con) and new (parent/child) formats
        parent: node.parent !== undefined ? node.parent : node.cha,
        child: node.child !== undefined ? node.child : node.con || [],
        // Preserve any additional fields without displaying them
        ...getAdditionalFields(node)
      };

      // Convert to internal format (cha/con for backward compatibility)
      normalizedData.nodes[nodeId] = {
        text: normalizedNode.text,
        cha: normalizedNode.parent,
        con: Array.isArray(normalizedNode.child) ? normalizedNode.child : [],
        // Store additional fields
        ...normalizedNode.additionalFields
      };
    });

    return normalizedData;
  };

  // Convert document format to app format with enhanced field support
  const convertDocumentToAppFormat = (data) => {
    const { root_id, tree } = data;
    
    const convertedData = {
      nodes: {},
      disconnectedNodes: [],
      customPositions: {}
    };

    // Convert structure with flexible field mapping
    Object.keys(tree).forEach(nodeId => {
      const node = tree[nodeId];
      const newNodeId = nodeId === root_id ? 'root' : nodeId;
      
      // Handle flexible parent/child field names
      const parentField = node.parent !== undefined ? node.parent : node.cha;
      const childField = node.child !== undefined ? node.child : node.con || [];
      
      convertedData.nodes[newNodeId] = {
        text: node.text || '',
        cha: nodeId === root_id ? null : 
             parentField === root_id ? 'root' : 
             parentField,
        con: Array.isArray(childField) ? 
             childField.map(childId => childId === root_id ? 'root' : childId) :
             [],
        // Preserve additional fields
        ...getAdditionalFields(node)
      };
    });

    return convertedData;
  };

  // Convert flat structure to app format
  const convertFlatToAppFormat = (data) => {
    const convertedData = {
      nodes: {},
      disconnectedNodes: [],
      customPositions: {}
    };

    // Find root node (node with no parent or parent = null)
    let rootNodeId = null;
    Object.keys(data).forEach(nodeId => {
      const node = data[nodeId];
      const parentField = node.parent !== undefined ? node.parent : node.cha;
      if (!parentField || parentField === null) {
        rootNodeId = nodeId;
      }
    });

    if (!rootNodeId) {
      throw new Error('Không tìm thấy root node (node không có parent)');
    }

    // Convert all nodes
    Object.keys(data).forEach(nodeId => {
      const node = data[nodeId];
      const newNodeId = nodeId === rootNodeId ? 'root' : nodeId;
      
      // Handle flexible field names
      const parentField = node.parent !== undefined ? node.parent : node.cha;
      const childField = node.child !== undefined ? node.child : node.con || [];
      
      convertedData.nodes[newNodeId] = {
        text: node.text || '',
        cha: nodeId === rootNodeId ? null :
             parentField === rootNodeId ? 'root' :
             parentField,
        con: Array.isArray(childField) ?
             childField.map(childId => childId === rootNodeId ? 'root' : childId) :
             [],
        // Preserve additional fields
        ...getAdditionalFields(node)
      };
    });

    return convertedData;
  };

  // Extract additional fields (fields other than text, parent, child, cha, con)
  const getAdditionalFields = (node) => {
    const coreFields = new Set(['text', 'parent', 'child', 'cha', 'con']);
    const additionalFields = {};
    
    Object.keys(node).forEach(key => {
      if (!coreFields.has(key)) {
        additionalFields[key] = node[key];
      }
    });

    return Object.keys(additionalFields).length > 0 ? { additionalFields } : {};
  };

  // Enhanced export with flexible format support
  const handleExport = () => {
    if (!currentData) return;

    const exportData = {
      nodes: {},
      disconnectedNodes: currentData.disconnectedNodes || [],
      customPositions: currentData.customPositions || {}
    };

    // Convert back to the flexible format with parent/child fields
    if (currentData.nodes) {
      Object.keys(currentData.nodes).forEach(nodeId => {
        const node = currentData.nodes[nodeId];
        exportData.nodes[nodeId] = {
          text: node.text || '',
          parent: node.cha,
          child: node.con || [],
          // Include any additional fields
          ...(node.additionalFields || {})
        };
      });
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tree-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // File selection and processing with enhanced validation
  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    setError(null);
    setPreview(null);

    const previews = [];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        setError('Chỉ chấp nhận file .json');
        continue;
      }

      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        // Enhanced validation
        const validationResult = validateJsonStructure(jsonData);
        const processedData = convertToAppFormat(validationResult);
        
        const nodeCount = Object.keys(processedData.nodes).length;
        const additionalFieldsCount = Object.values(processedData.nodes)
          .reduce((count, node) => count + (node.additionalFields ? Object.keys(node.additionalFields).length : 0), 0);
        
        previews.push({
          fileName: file.name,
          nodeCount,
          hasRoot: !!processedData.nodes.root,
          format: validationResult.format,
          additionalFieldsCount,
          data: processedData
        });
      } catch (error) {
        console.error('❌ Error processing file:', error);
        setError(`File ${file.name}: ${error.message}`);
      }
    }
    setPreview(previews);
  };

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    handleFileSelect(files);
    event.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFiles = files.filter(file => file.name.toLowerCase().endsWith('.json'));
    
    if (jsonFiles.length > 0) {
      handleFileSelect(jsonFiles);
    } else {
      setError('Vui lòng thả file .json');
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="json-importer">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileInputChange}
        multiple
        style={{ display: 'none' }}
      />

      {/* Buttons */}
      {!hideButtons && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <Upload className="w-4 h-4" />
            Import JSON (Flexible Schema)
          </button>

          <button
            onClick={handleExport}
            disabled={!currentData?.nodes}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: !currentData?.nodes ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: !currentData?.nodes ? 0.6 : 1
            }}
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: '16px',
          border: `2px dashed ${isDragOver ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: '8px',
          backgroundColor: isDragOver ? '#eff6ff' : '#f9fafb',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <FileText className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: isDragOver ? '#3b82f6' : '#6b7280',
          fontWeight: '500'
        }}>
          {isDragOver ? 'Thả file JSON vào đây' : 'Kéo thả file JSON hoặc click để chọn'}
        </p>
        <p style={{ 
          margin: '4px 0 0 0', 
          fontSize: '12px', 
          color: '#9ca3af'
        }}>
          Hỗ trợ: App format, Document format, Flat structure (parent/child hoặc cha/con)
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Enhanced Preview Dialog */}
      {preview && Array.isArray(preview) && preview.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '95%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                📋 Xác nhận Import JSON với Schema linh hoạt
              </h3>
              <button onClick={handleCancel} style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Enhanced Preview */}
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              {preview.map((item, idx) => (
                <div key={item.fileName + idx} style={{ 
                  borderBottom: '1px solid #e5e7eb', 
                  padding: '12px 0',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                    📄 {item.fileName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    <div><strong>Format:</strong> {item.format}</div>
                    <div><strong>Tổng số nodes:</strong> {item.nodeCount}</div>
                    <div><strong>Node root:</strong> {item.hasRoot ? '✅ Có' : '❌ Không'}</div>
                    {item.additionalFieldsCount > 0 && (
                      <div style={{ color: '#059669', fontWeight: '500' }}>
                        <strong>Trường bổ sung:</strong> {item.additionalFieldsCount} trường (sẽ được lưu trữ)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Warning */}
            <div style={{
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#92400e',
              border: '1px solid #f59e0b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <AlertCircle className="w-4 h-4" />
                <strong>Thông tin Import</strong>
              </div>
              <div>
                • Thao tác này sẽ thay thế hoàn toàn dữ liệu hiện tại<br/>
                • Các trường bổ sung sẽ được lưu trữ nhưng không hiển thị<br/>
                • Hỗ trợ cả parent/child và cha/con
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (preview && preview.length > 0) {
                    onImport(preview.map(item => ({
                      fileName: item.fileName,
                      data: item.data
                    })));
                    setPreview(null);
                    setError(null);
                  }
                }}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                <CheckCircle className="w-4 h-4" />
                {isLoading ? 'Đang import...' : 'Xác nhận Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonImporter;