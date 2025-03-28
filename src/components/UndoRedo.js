import React from 'react';
import './css/UndoRedo.css';

function UndoRedo({ canUndo, canRedo, onUndo, onRedo }) {
  return (
    <div className="undo-redo-controls mb-3">
      <button 
        className="btn btn-sm btn-outline-secondary me-2"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
      >
        <i className="bi bi-arrow-counterclockwise"></i> Undo
      </button>
      <button 
        className="btn btn-sm btn-outline-secondary"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
      >
        <i className="bi bi-arrow-clockwise"></i> Redo
      </button>
    </div>
  );
}

export default UndoRedo;
