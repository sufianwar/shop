import React from "react";

export default function ProductList({products}){
  return (
    <div className="products">
      {products.map(p=> (
        <div className="product card" key={p._id}>
          <h4>{p.name}</h4>
          <div style={{color:'var(--muted)'}}>Price: ${p.price ?? 0}</div>
          <div style={{marginTop:8,fontWeight:600}}>Stock: {p.stock ?? 0}</div>
        </div>
      ))}
    </div>
  );
}
