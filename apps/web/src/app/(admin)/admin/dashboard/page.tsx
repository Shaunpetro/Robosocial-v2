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
  licenseId: string | null;
  license?: { customerName: string } | null;
  createdAt: string;
}

const TOAST_DURATION = 4000;

export default function AdminDashboard() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminKey, setAdminKey] = useState("");

  // License form
  const [customerName, setCustomerName] = useState("");
  const [maxAccounts, setMaxAccounts] = useState(5);
  const [monthsValid, setMonthsValid] = useState(1);
  const [licenseKeyGenerated, setLicenseKeyGenerated] = useState("");
  const [copied, setCopied] = useState(false);

  // User creation form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedLicenseId, setSelectedLicenseId] = useState("");
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [userErrors, setUserErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  // Edit user modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLicenseId, setEditLicenseId] = useState("");

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

  const createLicense = async () => {
    if (!customerName) { showToast("error", "Customer name required"); return; }
    try {
      const res = await fetch("/api/admin/license", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ customerName, maxSocialAccounts: maxAccounts, monthsValid }),
      });
      const data = await res.json();
      if (res.ok) {
        setLicenseKeyGenerated(data.licenseKey);
        setCopied(false);
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

  const createUser = async () => {
    if (!validateUser()) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword || undefined,
          licenseId: selectedLicenseId || null,
          sendEmail: sendWelcomeEmail,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `User ${data.user.email} created!`);
        setNewEmail(""); setNewName(""); setNewPassword(""); setSelectedLicenseId("");
        setUserErrors({});
        fetchData();
      } else {
        showToast("error", data.error || "Creation failed");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const validateUser = () => {
    const errors: typeof userErrors = {};
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) errors.email = "Valid email required";
    if (newPassword && newPassword.length < 6) errors.password = "Min 6 characters";
    setUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditEmail(user.email);
    setEditLicenseId(user.licenseId || "");
  };

  const closeEditModal = () => setEditingUser(null);

  const saveUserEdit = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          email: editEmail,
          licenseId: editLicenseId || null,
        }),
      });
      if (res.ok) {
        showToast("success", "User updated!");
        closeEditModal();
        fetchData();
      } else {
        const data = await res.json();
        showToast("error", data.error || "Update failed");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const resetPassword = async (userId: string) => {
    if (!confirm("Reset password and send email?")) return;
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        showToast("success", "Password reset email sent!");
      } else {
        const data = await res.json();
        showToast("error", data.error || "Reset failed");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

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
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Social Accounts</label>
            <input type="number" value={maxAccounts} onChange={(e) => setMaxAccounts(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Months Valid</label>
            <input type="number" value={monthsValid} onChange={(e) => setMonthsValid(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
        <button onClick={createLicense} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Create License</button>
        {licenseKeyGenerated && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded-md">
            <p className="font-mono text-sm break-all">{licenseKeyGenerated}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { navigator.clipboard.writeText(licenseKeyGenerated); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{copied ? "Copied!" : "Copy"}</button>
              <button onClick={() => setLicenseKeyGenerated("")} className="text-xs text-red-600">Dismiss</button>
            </div>
          </div>
        )}
      </section>

      {/* User Creation */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create User</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              className={`w-full rounded-md border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${userErrors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`} />
            {userErrors.email && <p className="text-red-500 text-xs mt-1">{userErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password (optional)</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full rounded-md border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${userErrors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-sm">👁️</button>
            </div>
            {userErrors.password && <p className="text-red-500 text-xs mt-1">{userErrors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">License</label>
            <select value={selectedLicenseId} onChange={(e) => setSelectedLicenseId(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">None</option>
              {licenses.filter(l => l.status === "ACTIVE").map(l => (<option key={l.id} value={l.id}>{l.customerName}</option>))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sendWelcomeEmail} onChange={(e) => setSendWelcomeEmail(e.target.checked)} />
            Send welcome email
          </label>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={createUser} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Create User</button>
          <button onClick={() => { setNewEmail(""); setNewName(""); setNewPassword(""); setSelectedLicenseId(""); setUserErrors({}); }}
            className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md">Clear</button>
        </div>
      </section>

      {/* User List */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Users</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="py-2 text-left">Email</th>
              <th className="py-2">Name</th>
              <th className="py-2">Role</th>
              <th className="py-2">License</th>
              <th className="py-2">Created</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((usr) => (
              <tr key={usr.id}>
                <td className="py-2">{usr.email}</td>
                <td className="py-2 text-center">{usr.name || "-"}</td>
                <td className="py-2 text-center">{usr.role}</td>
                <td className="py-2 text-center">{usr.license?.customerName || "-"}</td>
                <td className="py-2 text-center">{new Date(usr.createdAt).toLocaleDateString()}</td>
                <td className="py-2 text-center">
                  <button onClick={() => openEditModal(usr)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                  <button onClick={() => resetPassword(usr.id)} className="text-orange-600 hover:underline">Reset Pwd</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* License List */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Licenses</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="py-2 text-left">Customer</th>
              <th className="py-2">Max</th>
              <th className="py-2">Status</th>
              <th className="py-2">Expires</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((lic) => (
              <tr key={lic.id}>
                <td className="py-2">{lic.customerName}</td>
                <td className="py-2 text-center">{lic.maxSocialAccounts}</td>
                <td className="py-2 text-center">{lic.status}</td>
                <td className="py-2 text-center">{new Date(lic.expiresAt).toLocaleDateString()}</td>
                <td className="py-2 text-center">
                  {lic.status === "ACTIVE" && (
                    <button onClick={() => { const key = prompt("License key to revoke:"); if (key) revokeLicense(key); }}
                      className="text-red-600 hover:underline">Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow">
            <h2 className="text-lg font-bold mb-4">Edit User</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License</label>
                <select value={editLicenseId} onChange={(e) => setEditLicenseId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">None</option>
                  {licenses.filter(l => l.status === "ACTIVE").map(l => (<option key={l.id} value={l.id}>{l.customerName}</option>))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={closeEditModal} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Cancel</button>
              <button onClick={saveUserEdit} className="px-4 py-2 rounded-md bg-indigo-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}