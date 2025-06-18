// File: src/utils/constants.js (IMPROVED SPACING)
export const NODE_CONFIG = {
  WIDTH: 150,
  HEIGHT: 40,
  MARGIN_X: 200, // Tăng từ 180 → 200
  MARGIN_Y: 120, // Tăng từ 100 → 120  
  BORDER_RADIUS: 5,
  BUTTON_RADIUS: 8
};

export const COLORS = {
  ROOT: '#fecaca',
  ROOT_BORDER: '#ef4444',
  NORMAL: '#f1f5f9',
  NORMAL_BORDER: '#cbd5e1',
  MOVING_BORDER: '#3b82f6',
  CONNECTION: '#64748b',
  BUTTONS: {
    ADD: '#22c55e',
    EDIT: '#3b82f6',
    MOVE: '#f59e0b',
    DELETE: '#ef4444',
    SAVE: '#22c55e'
  }
};

export const INITIAL_DATA = {
  'root': {
    text: 'Root',
    cha: null,
    con: ['chuong1', 'chuong2']
  },
  'chuong1': {
    text: 'Chương I',
    cha: 'root',
    con: ['dieu1', 'dieu2']
  },
  'chuong2': {
    text: 'Chương II',
    cha: 'root',
    con: ['dieu3', 'dieu4']
  },
  'dieu1': {
    text: 'Điều 1',
    cha: 'chuong1',
    con: ['chunk1', 'chunk2']
  },
  'dieu2': {
    text: 'Điều 2',
    cha: 'chuong1',
    con: ['chunk3']
  },
  'dieu3': {
    text: 'Điều 3',
    cha: 'chuong2',
    con: []
  },
  'dieu4': {
    text: 'Điều 4',
    cha: 'chuong2',
    con: []
  },
  'chunk1': {
    text: 'chunk 1',
    cha: 'dieu1',
    con: []
  },
  'chunk2': {
    text: 'chunk 2',
    cha: 'dieu1',
    con: []
  },
  'chunk3': {
    text: 'chunk 3',
    cha: 'dieu2',
    con: []
  }
};