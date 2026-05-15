import React, {useState} from "react";
import api from "../api";

export default function AddProductForm({onAdded}){
  const [name,setName] = useState("");
  const [price,setPrice] = useState(0);
  const [stock,setStock] = useState(0);

  const submit = async e =>{
    e.preventDefault();
    try{
      await api.post('/products',{name,price,stock});
      setName('');setPrice(0);setStock(0);
      onAdded?.();
    }catch(err){
      console.error(err);
      alert('Failed to add product');
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input className="field" placeholder="Product name" value={name} onChange={e=>setName(e.target.value)} />
        <input style={{width:120}} type="number" placeholder="Price" value={price} onChange={e=>setPrice(Number(e.target.value))} />
        <input style={{width:120}} type="number" placeholder="Stock" value={stock} onChange={e=>setStock(Number(e.target.value))} />
        <button className="btn" type="submit">Add Product</button>
      </div>
    </form>
  );
}
