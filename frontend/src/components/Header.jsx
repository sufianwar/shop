import React from "react";

export default function Header({onSearch}){
  return (
    <div className="header">
      <div>
        <h2 style={{margin:0}}>Point of Sale</h2>
        <div style={{color:'var(--muted)'}}>Modern retail management</div>
      </div>

      <div className="search">
        <input placeholder="Search products or sales..." onChange={e=>onSearch?.(e.target.value)} />
        <button className="btn secondary">Export</button>
      </div>
    </div>
  );
}
