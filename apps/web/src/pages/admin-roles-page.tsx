import { useEffect, useMemo, useState } from 'react';
import { changeRole, listRoles, listUsers, normalizeApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Role, UserProfile } from '../lib/types';

type RoleSelection = Record<number, string>;

function roleNames(user: UserProfile) {
  if (!user.roles?.length) {
    return '-';
  }
  return user.roles.map((role) => role.name).join(', ');
}

function isAdminUser(user: UserProfile) {
  return user.roles?.some((role) => role.name === 'Admin');
}

export function AdminRolesPage() {
  const { token, refreshProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleByUser, setSelectedRoleByUser] = useState<RoleSelection>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const assignableRoles = useMemo(
    () => roles.filter((role) => role.name !== 'Admin'),
    [roles],
  );

  const nonAdminUsers = useMemo(
    () => users.filter((user) => !isAdminUser(user)),
    [users],
  );

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!token) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [userData, roleData] = await Promise.all([
          listUsers(token),
          listRoles(token),
        ]);
        if (ignore) {
          return;
        }

        const availableRoles = roleData.filter((role) => role.name !== 'Admin');
        const defaultRoleId = availableRoles[0]?.id;
        const initialSelection: RoleSelection = {};

        for (const user of userData) {
          if (isAdminUser(user)) {
            continue;
          }
          const existingRole = user.roles.find((role) => role.name !== 'Admin');
          if (existingRole) {
            initialSelection[user.id] = String(existingRole.id);
          } else if (defaultRoleId) {
            initialSelection[user.id] = String(defaultRoleId);
          }
        }

        setUsers(userData);
        setRoles(roleData);
        setSelectedRoleByUser(initialSelection);
      } catch (err) {
        const apiError = normalizeApiError(err);
        if (!ignore) {
          setError(apiError.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      ignore = true;
    };
  }, [token]);

  async function onChangeUserRole(userId: number) {
    if (!token) {
      return;
    }

    const selectedRoleId = selectedRoleByUser[userId];
    if (!selectedRoleId) {
      return;
    }

    setSavingUserId(userId);
    setError(null);
    setSuccessMessage(null);

    try {
      await changeRole(
        {
          userId,
          roleId: Number(selectedRoleId),
        },
        token,
      );

      const refreshedUsers = await listUsers(token);
      setUsers(refreshedUsers);
      await refreshProfile();
      setSuccessMessage(`Role updated for user #${userId}.`);
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError.message);
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <section className="stack">
      <article className="card panel">
        <h2>Role Management (Admin)</h2>
        <p className="muted">
          Update roles for non-admin users. Admin users are intentionally hidden.
        </p>

        {loading && <p className="muted">Loading users and roles...</p>}
        {error && <p className="error-text">{error}</p>}
        {successMessage && <p className="success-text">{successMessage}</p>}

        {!loading && nonAdminUsers.length === 0 && (
          <p className="muted">No non-admin users found.</p>
        )}

        {!loading && nonAdminUsers.length > 0 && assignableRoles.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email</th>
                  <th>Current Roles</th>
                  <th>Target Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {nonAdminUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{roleNames(user)}</td>
                    <td>
                      <select
                        value={selectedRoleByUser[user.id] ?? ''}
                        onChange={(event) =>
                          setSelectedRoleByUser((current) => ({
                            ...current,
                            [user.id]: event.target.value,
                          }))
                        }
                      >
                        {assignableRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="primary-btn small-btn"
                        disabled={savingUserId === user.id}
                        onClick={() => onChangeUserRole(user.id)}
                      >
                        {savingUserId === user.id ? 'Saving...' : 'Change role'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
