// Superadmin component to manage whitelisted emails
import { useState } from "react";

export default function WhitelistManager() {
  const [newEmail, setNewEmail] = useState("");

  const handleWhitelistEmail = async () => {};

  return (
    <div>
      <h2>Manage Users</h2>
      <div>
        <input
          type="email"
          placeholder="pluk[name]@gmail.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <button onClick={handleWhitelistEmail}>Whitelist Email</button>
      </div>

      <h3>Whitelisted Users</h3>
      <table>{/* should display here w/ role or access controls?? */}</table>
    </div>
  );
}
