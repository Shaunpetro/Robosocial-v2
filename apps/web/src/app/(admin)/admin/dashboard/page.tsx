// apps/web/src/app/(admin)/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function AdminDashboard() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");

  // License creation form
  const [customerName, setCustomerName] = useState("");
  const [maxAccounts, setMaxAccounts] = useState(5);
  const [monthsValid, setMonthsValid] = useState(1);
  const [githubPAT, setGithubPAT] = useState("");

  // User creation form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const storedKey = sessionStorage.getItem("admin_key");
    if (!storedKey) {
      router.push("/admin/login");
      return;
    }
    setAdminKey(storedKey);
    fetchData(storedKey);
  }, []);

  const authHeaders = (key: string) => ({
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  });

  const fetchData = async (key: string) => {
    try {
      const [licRes, usrRes] = await Promise.all([
        fetch("/api/admin/licenses", { headers: authHeaders(key) }),
        fetch("/api/admin/users", { headers: authHeaders(key) }),
      ]);
      if (licRes.ok) setLicenses(await licRes.json());
      if (usrRes.ok) setUsers(await usrRes.json());
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  const createLicense = async () => {
    if (!adminKey) return;
    try {
      const res = await fetch("/api/admin/license", {
        method: "POST",
        headers: authHeaders(adminKey),
        body: JSON.stringify({
          customerName,
          maxSocialAccounts: maxAccounts,
          monthsValid,
          githubPAT: githubPAT || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`License created! Key: ${data.licenseKey}`);
        fetchData(adminKey);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage("Network error");
    }
  };

  const revokeLicense = async (licenseKey: string) => {
    if (!adminKey) return;
    try {
      const res = await fetch("/api/admin/license", {
        method: "DELETE",
        headers: authHeaders(adminKey),
        body: JSON.stringify({ licenseKey }),
      });
      if (res.ok) {
        setMessage("License revoked.");
        fetchData(adminKey);
      }
    } catch (err) {
      setMessage("Revoke failed");
    }
  };

  const createUser = async () => {
    if (!adminKey) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: authHeaders(adminKey),
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`User ${data.user.email} created!`);
        setNewEmail("");
        setNewName("");
        setNewPassword("");
        fetchData(adminKey);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>

        {message && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <p className="text-sm text-gray-800 dark:text-gray-200">{message}</p>
          </div>
        )}

        {/* Create License */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Create License
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              placeholder="Max Social Accounts"
              value={maxAccounts}
              onChange={(e) => setMaxAccounts(Number(e.target.value))}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              placeholder="Months Valid"
              value={monthsValid}
              onChange={(e) => setMonthsValid(Number(e.target.value))}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="GitHub PAT (optional)"
              value={githubPAT}
              onChange={(e) => setGithubPAT(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={createLicense}
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Create License
          </button>
        </section>

        {/* Create User */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Create User
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={createUser}
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Create User
          </button>
        </section>

        {/* License List */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Existing Licenses
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Max</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Expires</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic) => (
                  <tr key={lic.id}>
                    <td className="py-2">{lic.customerName}</td>
                    <td className="py-2">{lic.maxSocialAccounts}</td>
                    <td className="py-2">{lic.status}</td>
                    <td className="py-2">{new Date(lic.expiresAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      {lic.status === "ACTIVE" && (
                        <button
                          onClick={() => revokeLicense(prompt("Enter license key to revoke:") || "")}
                          className="text-red-600 hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* User List */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Users
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="py-2">Email</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((usr) => (
                  <tr key={usr.id}>
                    <td className="py-2">{usr.email}</td>
                    <td className="py-2">{usr.name || "-"}</td>
                    <td className="py-2">{usr.role}</td>
                    <td className="py-2">{new Date(usr.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}