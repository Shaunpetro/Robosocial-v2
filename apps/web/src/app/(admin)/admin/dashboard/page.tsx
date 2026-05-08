// apps/web/src/app/(admin)/admin/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

interface License {
  id: string;
  customerName: string;
  maxSocialAccounts: number;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

const TOAST_DURATION = 4000;

export default function AdminDashboard() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminKey, setAdminKey] = useState("");

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [maxAccounts, setMaxAccounts] = useState(5);
  const [monthsValid, setMonthsValid] = useState(1);
  const [githubPAT, setGithubPAT] = useState("");
  const [licenseKeyGenerated, setLicenseKeyGenerated] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation errors
  const [userErrors, setUserErrors] = useState<{ email?: string; password?: string }>({});

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${adminKey}`,
    "Content-Type": "application/json",
  }), [adminKey]);

  const fetchData = useCallback(async () => {
    try {
      const [licRes, usrRes] = await Promise.all([
        fetch("/api/admin/licenses", { headers: authHeaders() }),
        fetch("/api/admin/users", { headers: authHeaders() }),
      ]);
      if (licRes.ok) setLicenses(await licRes.json());
      if (usrRes.ok) setUsers(await usrRes.json());
    } catch (err) {
      showToast("error", "Failed to fetch data.");
    }
  }, [authHeaders, showToast]);

  useEffect(() => {
    const storedKey = sessionStorage.getItem("admin_key");
    if (storedKey) {
      setAdminKey(storedKey);
      fetchData();
    }
  }, [fetchData]);

  const validateUser = () => {
    const errors: typeof userErrors = {};
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) errors.email = "Valid email required";
    if (!newPassword || newPassword.length < 6) errors.password = "Min 6 characters";
    setUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createUser = async () => {
    if (!validateUser()) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: newEmail, name: newName, password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `User ${data.user.email} created!`);
        setNewEmail("");
        setNewName("");
        setNewPassword("");
        setUserErrors({});
        fetchData();
      } else {
        showToast("error", data.error || "Creation failed");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const createLicense = async () => {
    if (!customerName) { showToast("error", "Customer name required"); return; }
    try {
      const res = await fetch("/api/admin/license", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          customerName,
          maxSocialAccounts: maxAccounts,
          monthsValid,
          githubPAT: githubPAT || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLicenseKeyGenerated(data.licenseKey);
        showToast("success", "License created!");
        fetchData();
      } else {
        showToast("error", data.error || "Creation failed");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const revokeLicense = async (licenseKey: string) => {
    if (!confirm("Revoke this license?")) return;
    try {
      const res = await fetch("/api/admin/license", {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ licenseKey }),
      });
      if (res.ok) {
        showToast("success", "License revoked.");
        fetchData();
      } else {
        showToast("error", "Revoke failed");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const clearLicenseKey = () => setLicenseKeyGenerated("");

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.text}
        </div>
      )}

      {/* License Creation */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create License</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="rounded-md border ... p-2 bg-white dark:bg-gray-700" />
          <input type="number" placeholder="Max Social Accounts" value={maxAccounts} onChange={(e) => setMaxAccounts(Number(e.target.value))} className="... p-2" />
          <input type="number" placeholder="Months Valid" value={monthsValid} onChange={(e) => setMonthsValid(Number(e.target.value))} className="... p-2" />
          <input type="text" placeholder="GitHub PAT (optional)" value={githubPAT} onChange={(e) => setGithubPAT(e.target.value)} className="... p-2" />
        </div>
        <button onClick={createLicense} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md">Create License</button>

        {licenseKeyGenerated && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded-md">
            <p className="font-mono text-sm break-all">{licenseKeyGenerated}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => navigator.clipboard.writeText(licenseKeyGenerated)} className="text-xs bg-gray-200 px-2 py-1 rounded">Copy</button>
              <button onClick={clearLicenseKey} className="text-xs text-red-600">Dismiss</button>
            </div>
          </div>
        )}
      </section>

      {/* User Creation */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create User</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={`w-full p-2 rounded-md border ${userErrors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700`} />
            {userErrors.email && <p className="text-red-500 text-xs mt-1">{userErrors.email}</p>}
          </div>
          <input type="text" placeholder="Name (optional)" value={newName} onChange={(e) => setNewName(e.target.value)} className="p-2 rounded-md border ..." />
          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full p-2 rounded-md border ${userErrors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700`} />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-sm text-gray-500">👁️</button>
            {userErrors.password && <p className="text-red-500 text-xs mt-1">{userErrors.password}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={createUser} className="bg-indigo-600 text-white px-4 py-2 rounded-md">Create User</button>
          <button onClick={() => { setNewEmail(""); setNewName(""); setNewPassword(""); setUserErrors({}); }} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-md">Clear</button>
        </div>
      </section>

      {/* License List */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Licenses</h2>
        <table className="min-w-full text-sm">
          <thead><tr><th className="py-2 text-left">Customer</th><th className="py-2">Max</th><th className="py-2">Status</th><th className="py-2">Expires</th><th className="py-2">Action</th></tr></thead>
          <tbody>{licenses.map((lic) => (
            <tr key={lic.id}>
              <td className="py-2">{lic.customerName}</td><td className="py-2 text-center">{lic.maxSocialAccounts}</td><td className="py-2 text-center">{lic.status}</td><td className="py-2 text-center">{new Date(lic.expiresAt).toLocaleDateString()}</td>
              <td className="py-2 text-center">{lic.status === "ACTIVE" && <button onClick={() => { const key = prompt("License key to revoke:"); if (key) revokeLicense(key); }} className="text-red-600 hover:underline">Revoke</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      {/* User List */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Users</h2>
        <table className="min-w-full text-sm">
          <thead><tr><th className="py-2 text-left">Email</th><th className="py-2">Name</th><th className="py-2">Role</th><th className="py-2">Created</th></tr></thead>
          <tbody>{users.map((usr) => (
            <tr key={usr.id}><td className="py-2">{usr.email}</td><td className="py-2 text-center">{usr.name || "-"}</td><td className="py-2 text-center">{usr.role}</td><td className="py-2 text-center">{new Date(usr.createdAt).toLocaleDateString()}</td></tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  );
}