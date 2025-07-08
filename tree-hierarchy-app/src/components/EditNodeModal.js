// File: src/components/EditNodeModal.js (COMPLETELY FIXED VERSION)
import React, { useState, useRef, useEffect } from 'react';
import { X, Save, FileText, Type } from 'lucide-react';

const EditNodeModal = ({ isOpen, nodeId, nodeText, onSave, onCancel }) => {
  const [editText, setEditText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef(null);
  
  // CRITICAL FIX: Complete state reset when modal opens/closes or nodeId changes
  useEffect(() => {
    console.log('🔄 EditNodeModal effect triggered:', { isOpen, nodeId, nodeText });
    
    if (isOpen && nodeId) {
      // FIXED: Always use the current nodeText, handle null/undefined properly
      const textToEdit = nodeText || '';
      console.log('📝 Setting edit text to:', textToEdit);
      
      setEditText(textToEdit);
      setCharCount(textToEdit.length);
      setLineCount(textToEdit ? textToEdit.split('\n').length : 1);
    } else {
      // FIXED: Always reset when modal closes or no nodeId
      console.log('🧹 Resetting modal state');
      setEditText('');
      setCharCount(0);
      setLineCount(1);
    }
  }, [isOpen, nodeId, nodeText]); // CRITICAL: All three dependencies

  // Auto-focus and select all when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.select();
      }, 100);
    }
  }, [isOpen]);
  
  // Handle text change
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setEditText(newText);
    setCharCount(newText.length);
    setLineCount(newText.split('\n').length);
  };
  
  // Handle save
  const handleSave = () => {
    console.log('💾 Saving node:', nodeId, 'with text:', editText);
    // Allow saving empty text
    onSave(nodeId, editText);
    // Don't reset here - let the parent component handle modal closing
  };
  
  // Handle cancel
  const handleCancel = () => {
    console.log('❌ Cancelling edit for node:', nodeId);
    // Reset state immediately on cancel
    setEditText('');
    setCharCount(0);
    setLineCount(1);
    onCancel();
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Escape to cancel
    else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };
  
  // Don't render if not open
  if (!isOpen) return null;
  
  console.log('🎨 Rendering EditNodeModal:', { nodeId, editText, charCount });
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="edit-modal-backdrop"
        onClick={handleCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal */}
        <div 
          className="edit-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '800px',
            height: '80vh',
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1f2937' 
              }}>
                Chỉnh sửa nội dung node
              </h2>
            </div>
            
            <button
              onClick={handleCancel}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Node ID Display */}
          <div style={{
            padding: '12px 24px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '13px',
            color: '#6b7280',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Type className="w-4 h-4" />
            <span>Node ID: <strong>{nodeId}</strong></span>
            <span style={{ marginLeft: '16px' }}>
              Current Text: <strong>{nodeText ? `"${nodeText.substring(0, 30)}${nodeText.length > 30 ? '...' : ''}"` : '(Empty)'}</strong>
            </span>
          </div>
          
          {/* Editor */}
          <div style={{
            flex: 1,
            padding: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Nhập nội dung cho node... (có thể để trống)"
              style={{
                width: '100%',
                height: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                lineHeight: '1.6',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: '#fefefe',
                color: '#1f2937'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          
          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            flexShrink: 0
          }}>
            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: '20px',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              <span>
                <strong>{charCount}</strong> ký tự
              </span>
              <span>
                <strong>{lineCount}</strong> dòng
              </span>
              <span style={{
                fontSize: '12px',
                color: '#9ca3af',
                fontStyle: 'italic'
              }}>
                Ctrl+Enter để lưu • Esc để hủy • Có thể lưu nội dung rỗng
              </span>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
              
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .edit-modal {
            width: 95% !important;
            height: 90vh !important;
            maxHeight: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default EditNodeModal;