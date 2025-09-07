import React, { useState } from "react";
import "./Profile.css";
const API = "http://localhost:8081/api";

const Profile = ({ user, setUser }) => {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: user.name||"", address: user.address||"", phone: user.phone||"" });

  const saveChanges = async () => {
    const res = await fetch(`${API}/users/${user.id}`, {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name: form.name, address: form.address, phone: form.phone })
    });
    const updated = await res.json();
    setUser(updated);
    setEdit(false);
    alert("Profile updated");
  };

  return (
    <div className="profile">
      <h2>My Profile</h2>
      {!edit ? (
        <div className="profile-details">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Address:</strong> {user.address || "Not set"}</p>
          <p><strong>Phone:</strong> {user.phone || "Not set"}</p>
          <button onClick={()=>setEdit(true)}>Edit Profile</button>
        </div>
      ) : (
        <div className="profile-edit">
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full Name" />
          <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Address" />
          <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone Number" />
          <button onClick={saveChanges}>Save</button>
          <button className="cancel" onClick={()=>setEdit(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Profile;
