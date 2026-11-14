"use client";
import Icon from "./Icons";

export default function Modal({ title, onClose, children }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row between mb">
          <h2>{title}</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}