import crypto from "node:crypto";
import { resolveConnectionString, withClient } from "./_shared.mjs";

function deriveDisplayName(email) {
  const localPart = email.split("@", 1)[0] ?? email;
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  return cleaned || email;
}

function deriveOrganizationSlug(organizationId) {
  const base = organizationId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base && base === organizationId.toLowerCase()) {
    return base;
  }

  const suffix = crypto
    .createHash("sha1")
    .update(organizationId)
    .digest("hex")
    .slice(0, 8);

  return `${base || "org"}-${suffix}`;
}

async function tableExists(client, tableName) {
  const result = await client.query("select to_regclass($1) as table_name", [
    `public.${tableName}`,
  ]);

  return Boolean(result.rows[0]?.table_name);
}

async function assertBetterAuthTables(client) {
  const requiredTables = ["user", "account", "organization", "member", "session"];

  for (const tableName of requiredTables) {
    if (!(await tableExists(client, tableName))) {
      throw new Error(
        `Missing Better Auth table public.${tableName}. Run migrations before reconciling auth data.`,
      );
    }
  }
}

async function loadLegacyUsers(client) {
  const result = await client.query(`
    select
      id,
      lower(email) as email,
      password,
      organization_id,
      created_at
    from public.users
    order by id
  `);

  return result.rows;
}

async function loadLegacySessions(client) {
  const result = await client.query(`
    select
      s.id,
      s.user_id,
      s.token,
      s.expires_at,
      s.created_at,
      u.organization_id
    from public.sessions s
    join public.users u on u.id = s.user_id
    order by s.id
  `);

  return result.rows;
}

function buildOrganizationOwners(legacyUsers) {
  const owners = new Map();

  for (const user of legacyUsers) {
    if (!user.organization_id || owners.has(user.organization_id)) {
      continue;
    }

    owners.set(user.organization_id, user.id);
  }

  return owners;
}

async function ensureOrganization(client, organizationId, createdAt) {
  const slug = deriveOrganizationSlug(organizationId);

  await client.query(
    `
      insert into public.organization (id, name, slug, created_at, metadata)
      values ($1, $2, $3, $4, null)
      on conflict (id) do update
      set name = excluded.name,
          slug = excluded.slug
    `,
    [organizationId, organizationId, slug, createdAt],
  );
}

async function ensureAuthUser(client, legacyUser) {
  const existing = await client.query(
    `select id from public."user" where email = $1 limit 1`,
    [legacyUser.email],
  );

  if (existing.rowCount) {
    return existing.rows[0].id;
  }

  const authUserId = String(legacyUser.id);

  await client.query(
    `
      insert into public."user" (
        id,
        name,
        email,
        email_verified,
        image,
        created_at,
        updated_at
      )
      values ($1, $2, $3, false, null, $4, $5)
      on conflict (id) do update
      set name = excluded.name,
          email = excluded.email,
          updated_at = excluded.updated_at
    `,
    [
      authUserId,
      deriveDisplayName(legacyUser.email),
      legacyUser.email,
      legacyUser.created_at,
      legacyUser.created_at,
    ],
  );

  return authUserId;
}

async function ensureCredentialAccount(client, authUserId, legacyUser) {
  const existing = await client.query(
    `
      select id
      from public.account
      where provider_id = 'credential'
        and user_id = $1
      order by created_at asc
      limit 1
    `,
    [authUserId],
  );

  const accountId = authUserId;
  const rowId = existing.rows[0]?.id ?? `legacy-credential-${authUserId}`;

  if (existing.rowCount) {
    await client.query(
      `
        update public.account
        set account_id = $1,
            password = $2,
            updated_at = $3
        where id = $4
      `,
      [accountId, legacyUser.password, legacyUser.created_at, rowId],
    );

    return;
  }

  await client.query(
    `
      insert into public.account (
        id,
        account_id,
        provider_id,
        user_id,
        password,
        created_at,
        updated_at
      )
      values ($1, $2, 'credential', $3, $4, $5, $6)
    `,
    [
      rowId,
      accountId,
      authUserId,
      legacyUser.password,
      legacyUser.created_at,
      legacyUser.created_at,
    ],
  );
}

async function ensureOrganizationMember(
  client,
  organizationId,
  authUserId,
  role,
  createdAt,
) {
  const existing = await client.query(
    `
      select id
      from public.member
      where organization_id = $1
        and user_id = $2
      limit 1
    `,
    [organizationId, authUserId],
  );

  if (existing.rowCount) {
    await client.query(`update public.member set role = $1 where id = $2`, [
      role,
      existing.rows[0].id,
    ]);
    return;
  }

  await client.query(
    `
      insert into public.member (id, organization_id, user_id, role, created_at)
      values ($1, $2, $3, $4, $5)
    `,
    [
      `legacy-member-${organizationId}-${authUserId}`,
      organizationId,
      authUserId,
      role,
      createdAt,
    ],
  );
}

async function reconcileLegacySessions(client, sessions, authUserIds) {
  for (const legacySession of sessions) {
    const authUserId = authUserIds.get(String(legacySession.user_id));

    if (!authUserId) {
      throw new Error(
        `Missing Better Auth user mapping for legacy user ${legacySession.user_id}`,
      );
    }

    await client.query(
      `
        insert into public.session (
          id,
          expires_at,
          token,
          created_at,
          updated_at,
          ip_address,
          user_agent,
          user_id,
          active_organization_id
        )
        values ($1, $2, $3, $4, $5, null, null, $6, $7)
        on conflict (token) do update
        set expires_at = excluded.expires_at,
            updated_at = excluded.updated_at,
            user_id = excluded.user_id,
            active_organization_id = excluded.active_organization_id
      `,
      [
        `legacy-session-${legacySession.id}`,
        legacySession.expires_at,
        legacySession.token,
        legacySession.created_at,
        legacySession.created_at,
        authUserId,
        legacySession.organization_id,
      ],
    );
  }
}

async function main() {
  const connectionString = resolveConnectionString();

  await withClient(async (client) => {
    await assertBetterAuthTables(client);

    const legacyUsers = await loadLegacyUsers(client);
    const legacySessions = await loadLegacySessions(client);
    const organizationOwners = buildOrganizationOwners(legacyUsers);
    const authUserIds = new Map();

    await client.query("begin");

    try {
      for (const legacyUser of legacyUsers) {
        if (legacyUser.organization_id) {
          await ensureOrganization(
            client,
            legacyUser.organization_id,
            legacyUser.created_at,
          );
        }

        const authUserId = await ensureAuthUser(client, legacyUser);
        authUserIds.set(String(legacyUser.id), authUserId);

        await ensureCredentialAccount(client, authUserId, legacyUser);

        if (legacyUser.organization_id) {
          const role =
            organizationOwners.get(legacyUser.organization_id) === legacyUser.id
              ? "owner"
              : "member";

          await ensureOrganizationMember(
            client,
            legacyUser.organization_id,
            authUserId,
            role,
            legacyUser.created_at,
          );
        }
      }

      await reconcileLegacySessions(client, legacySessions, authUserIds);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }, connectionString);

  console.log("Better Auth tables reconciled from legacy auth data.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
