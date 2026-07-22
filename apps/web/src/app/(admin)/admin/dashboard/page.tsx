// apps/web/src/app/(admin)/admin/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ── Type definitions (unchanged) ──
interface License {
  id: string;
  customerName: string;
  maxSocialAccounts: number;
  status: string;
  expiresAt: string;
  fromEmail?: string | null;
  keyPreview?: string | null;
  userCount?: number;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  suspended: boolean;
  licenseId: string | null;
  fromEmail?: string | null;
  license?: {
    customerName: string;
    fromEmail?: string | null;
    keyPreview?: string | null;
    status: string;
    expiresAt: string;
  } | null;
  companies?: { id: string; name: string; platforms: { type: string; name: string }[] }[];
  createdAt: string;
}

const TOAST_DURATION = 4000;
const RETRY_DELAYS = [1000, 2000, 4000]; // backoff for cold starts

export default function AdminDashboard() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const keyCache = useRef<Record<string, string>>({});

  // Tab state
  const [activeTab, setActiveTab] = useState<"users" | "licenses">("users");

  // User creation form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedLicenseId, setSelectedLicenseId] = useState("");
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [userErrors, setUserErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  // Licence creation form
  const [licCustomerName, setLicCustomerName] = useState("");
  const [licMaxAccounts, setLicMaxAccounts] = useState(5);
  const [licMonthsValid, setLicMonthsValid] = useState(1);
  const [licFromEmail, setLicFromEmail] = useState("");
  const [licAssignUserId, setLicAssignUserId] = useState("");
  const [licKeyGenerated, setLicKeyGenerated] = useState("");
  const [licIdGenerated, setLicIdGenerated] = useState<string | null>(null);
  const [licCopied, setLicCopied] = useState(false);

  // User profile modal
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLicenseId, setProfileLicenseId] = useState("");
  const [profileFromEmail, setProfileFromEmail] = useState("");
  const [profileSuspended, setProfileSuspended] = useState(false);

  // ── Helpers ──
  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${adminKey}`,
    "Content-Type": "application/json",
  }), [adminKey]);

  // ── Fetch with retry ──
  const fetchWithRetry = async (url: string, headers: Record<string, string>) => {
    let lastError: any;
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        const res = await fetch(url, { headers });
        if (res.ok) return res;
        // If unauthorized, don't retry – key is wrong
        if (res.status === 401) return res;
        // If server error, retry
        throw new Error(`Server error ${res.status}`);
      } catch (err) {
        lastError = err;
        if (attempt < RETRY_DELAYS.length) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
        }
      }
    }
    throw lastError;
  };

  const fetchData = useCallback(async () => {
    if (!adminKey) return;
    setIsLoading(true);
    try {
      const headers = authHeaders();

      // Fetch both endpoints with retry
      const [licRes, usrRes] = await Promise.all([
        fetchWithRetry("/api/admin/licenses", headers),
        fetchWithRetry("/api/admin/users", headers),
      ]);

      const usrData: User[] = usrRes.ok ? await usrRes.json() : [];

      if (licRes.ok) {
        const licData = await licRes.json();
        const counts: Record<string, number> = {};
        usrData.forEach((u) => {
          if (u.licenseId) counts[u.licenseId] = (counts[u.licenseId] || 0) + 1;
        });
        setLicenses(licData.map((lic: License) => ({ ...lic, userCount: counts[lic.id] || 0 })));
      } else {
        // Only show error if it's a 401 (real auth issue), not a server hiccup
        if (licRes.status === 401) showToast("error", "Unauthorized – check admin key.");
      }

      if (usrRes.ok) {
        setUsers(usrData);
      } else if (usrRes.status === 401) {
        showToast("error", "Unauthorized – check admin key.");
      }
    } catch (err) {
      console.error("Fetch failed after retries:", err);
      showToast("error", "Unable to load data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, [adminKey, authHeaders, showToast]);

  useEffect(() => {
    const storedKey = sessionStorage.getItem("admin_key");
    if (storedKey) setAdminKey(storedKey);
  }, []);

  useEffect(() => {
    if (adminKey) fetchData();
  }, [adminKey, fetchData]);

  // ── User creation (unchanged) ──
  const createUser = async () => {
    if (!validateUser()) return;
    try {
      const licenseKey = selectedLicenseId ? keyCache.current[selectedLicenseId] : undefined;
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword || undefined,
          licenseId: selectedLicenseId || null,
          fromEmail: null,
          sendEmail: sendWelcomeEmail,
          licenseKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `User ${data.user.email} created!`);
        setNewEmail(""); setNewName(""); setNewPassword(""); setSelectedLicenseId("");
        setUserErrors({});
        fetchData();
      } else if (res.status === 409) {
        showToast("error", "A user with this email already exists.");
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

  // ── Licence creation (unchanged) ──
  const createLicense = async () => {
    if (!licCustomerName.trim()) { showToast("error", "Customer name required"); return; }
    try {
      const body: any = {
        customerName: licCustomerName.trim(),
        maxSocialAccounts: licMaxAccounts,
        monthsValid: licMonthsValid,
        fromEmail: licFromEmail || null,
      };
      if (licAssignUserId) body.userId = licAssignUserId;
      const res = await fetch("/api/admin/license", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setLicKeyGenerated(data.licenseKey);
        setLicIdGenerated(data.id);
        keyCache.current[data.id] = data.licenseKey;
        setLicCopied(false);
        showToast("success", "License created!");
        fetchData();
      } else {
        showToast("error", data.error || "Creation failed");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  // ── Licence actions (unchanged) ──
  const renewLicense = async (licenseId: string) => {
    const months = prompt("How many months to renew for?", "1");
    if (!months) return;
    try {
      const lic = licenses.find(l => l.id === licenseId);
      const res = await fetch("/api/admin/license", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          customerName: lic?.customerName || "",
          maxSocialAccounts: lic?.maxSocialAccounts || 5,
          monthsValid: parseInt(months),
          fromEmail: lic?.fromEmail || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        keyCache.current[data.id] = data.licenseKey;
        setLicKeyGenerated(data.licenseKey);
        setLicIdGenerated(data.id);
        showToast("success", "License renewed!");
        fetchData();
      } else {
        showToast("error", data.error || "Renew failed");
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

  const sendLicenseKeyManually = async (email: string, licenseId: string) => {
    const key = keyCache.current[licenseId] || prompt("Enter the full license key to send:");
    if (!key) return;
    try {
      const res = await fetch("/api/admin/license/send-key", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ licenseKey: key, email }),
      });
      const data = await res.json();
      if (res.ok) showToast("success", `Key sent to ${email}`);
      else showToast("error", data.error || "Send failed");
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  // ── User profile modal (unchanged) ──
  const openProfile = (user: User) => {
    setProfileUser(user);
    setProfileName(user.name || "");
    setProfileEmail(user.email);
    setProfileLicenseId(user.licenseId || "");
    setProfileFromEmail(user.fromEmail || "");
    setProfileSuspended(user.suspended);
  };
  const closeProfile = () => setProfileUser(null);

  const saveProfile = async () => {
    if (!profileUser) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          id: profileUser.id,
          name: profileName,
          email: profileEmail,
          licenseId: profileLicenseId || null,
          fromEmail: profileFromEmail || null,
          suspended: profileSuspended,
        }),
      });
      if (res.ok) {
        showToast("success", "User updated!");
        closeProfile();
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
      if (res.ok) showToast("success", "Password reset email sent!");
      else {
        const data = await res.json();
        showToast("error", data.error || "Reset failed");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  const assignLicenseFromProfile = async () => {
    if (!profileUser || !profileLicenseId) return;
    await saveProfile();
  };

  const createLicenseForProfile = async (months: number) => {
    if (!profileUser) return;
    try {
      const res = await fetch("/api/admin/license", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          customerName: profileName || profileUser.email,
          maxSocialAccounts: 5,
          monthsValid: months,
          fromEmail: profileFromEmail || null,
          userId: profileUser.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        keyCache.current[data.id] = data.licenseKey;
        showToast("success", "License created and assigned!");
        setProfileLicenseId(data.id);
        fetchData();
      } else {
        showToast("error", data.error || "Creation failed");
      }
    } catch (err) {
      showToast("error", "Network error");
    }
  };

  // ── UI ──
  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.text}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button onClick={() => { setActiveTab("users"); setUserErrors({}); }} className={`px-4 py-2 rounded-t-lg ${activeTab === "users" ? "bg-white dark:bg-gray-800 text-indigo-600 border-t border-x" : "text-gray-500"}`}>Users</button>
        <button onClick={() => setActiveTab("licenses")} className={`px-4 py-2 rounded-t-lg ${activeTab === "licenses" ? "bg-white dark:bg-gray-800 text-indigo-600 border-t border-x" : "text-gray-500"}`}>Licenses</button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading admin data…</p>
          </div>
        </div>
      ) : (
        <>
          {/* USERS TAB */}
          {activeTab === "users" && (
            <>
              {/* Create User section – unchanged, but uses isLoading guard to avoid rendering before data */}
              <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h2 className="text-xl font-semibold mb-4">Create User</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      className={`w-full rounded-md border p-2 ${userErrors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`} />
                    {userErrors.email && <p className="text-red-500 text-xs mt-1">{userErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password (optional)</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full rounded-md border p-2 ${userErrors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-sm">👁️</button>
                    </div>
                    {userErrors.password && <p className="text-red-500 text-xs mt-1">{userErrors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">License</label>
                    <select value={selectedLicenseId} onChange={(e) => setSelectedLicenseId(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700">
                      <option value="">None</option>
                      {licenses.filter(l => l.status === "ACTIVE").map(l => (
                        <option key={l.id} value={l.id}>{l.customerName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={sendWelcomeEmail} onChange={(e) => setSendWelcomeEmail(e.target.checked)} />
                    Send welcome email (includes license key if selected)
                  </label>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={createUser} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Create User</button>
                  <button onClick={() => { setNewEmail(""); setNewName(""); setNewPassword(""); setSelectedLicenseId(""); setUserErrors({}); }}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md">Clear</button>
                </div>
              </section>

              <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
                <h2 className="text-xl font-semibold mb-4">Users</h2>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 text-left">Email</th>
                      <th className="py-2">Name</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">License</th>
                      <th className="py-2">Key Preview</th>
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
                        <td className="py-2 text-center">{usr.suspended ? "Suspended" : "Active"}</td>
                        <td className="py-2 text-center">{usr.license?.customerName || "-"}</td>
                        <td className="py-2 text-center">{usr.license?.keyPreview || "-"}</td>
                        <td className="py-2 text-center">{new Date(usr.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 text-center">
                          <button onClick={() => openProfile(usr)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                          <button onClick={() => resetPassword(usr.id)} className="text-orange-600 hover:underline mr-2">Reset Pwd</button>
                          {usr.licenseId && (
                            <button onClick={() => sendLicenseKeyManually(usr.email, usr.licenseId!)}
                              className="text-green-600 hover:underline">Send Key</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* LICENSES TAB – similar loading guard, unchanged content */}
          {activeTab === "licenses" && (
            <>
              <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                {/* … licence creation form unchanged … */}
              </section>
              <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow overflow-x-auto">
                {/* … licence table unchanged … */}
              </section>
            </>
          )}
        </>
      )}

      {/* USER PROFILE MODAL – unchanged */}
      {/* … rest of the component … */}
    </div>
  );
}