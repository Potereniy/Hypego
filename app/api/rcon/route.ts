import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/security';

export const runtime = 'nodejs';

const MANAGER_ROLES = [
  'owner',
  'management',
  'curator',
  'tech_admin',
  'support',
];

const ACTION_LEVEL: Record<string, number> = {
  say: 1,
  ban: 1,
  mute: 1,
  kick: 1,
  pardon: 1,
  unmute: 1,
  player_info: 2,
  privilege_restriction: 3,
  report: 3,
  unreport: 3,
  server_manage: 4,
  console_command: 5,
};

function responseError(error: unknown) {
  const message =
    error instanceof Error ? error.message : 'Ошибка RCON API';
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
      ? error.status
      : 500;

  return NextResponse.json(
    { error: status === 500 ? 'Внутренняя ошибка сервера' : message },
    { status },
  );
}

async function getManager(db: ReturnType<typeof sql>, userId: string) {
  const rows = await db`
    SELECT EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ${userId}::uuid
        AND (
          r.is_project_owner = TRUE
          OR ur.role_id = ANY(${MANAGER_ROLES}::text[])
        )
    ) AS allowed
  `;

  const allowed = rows[0]?.allowed;
  return allowed === true || allowed === 't';
}

export async function GET() {
  try {
    const user = await requireUser();
    const db = sql();
    const managers = await getManager(db, user.id);

    const rows = await db`
      SELECT access_level, granted_at, updated_at
      FROM rcon_access
      WHERE user_id = ${user.id}::uuid
    `;

    if (!managers && rows.length === 0) {
      return NextResponse.json(
        { error: 'Доступ к RCON не выдан' },
        { status: 403 },
      );
    }

    const accessList = managers
      ? await db`
          SELECT a.user_id, u.username, a.access_level,
                 a.granted_at, a.updated_at
          FROM rcon_access a
          JOIN users u ON u.id = a.user_id
          ORDER BY a.access_level DESC, u.username ASC
        `
      : [];

    const history = await db`
      SELECT id, action, target_username, access_level, details, result, connection_status, created_at
      FROM rcon_action_logs
      WHERE actor_id = ${user.id}::uuid
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({
      access: rows[0] ?? null,
      canManageAccess: managers,
      accessList,
      history,
      connection: 'not_configured',
      commandsEnabled: false,
      levels: [
        {
          level: 1,
          title: 'Только /say, /ban, /mute, /kick, /pardon, /unmute',
          actions: ['say', 'ban', 'mute', 'kick', 'pardon', 'unmute'],
        },
        {
          level: 2,
          title: 'Все команды уровня 1 + информация об игроках',
          actions: ['say', 'ban', 'mute', 'kick', 'pardon', 'unmute', 'player_info'],
        },
        {
          level: 3,
          title: 'Уровни 1–2 + временные ограничения',
          actions: ['say', 'ban', 'mute', 'kick', 'pardon', 'unmute', 'player_info', 'privilege_restriction', 'report', 'unreport'],
        },
        {
          level: 4,
          title: 'Уровни 1–3 + расширенное управление сервером',
          actions: ['say', 'ban', 'mute', 'kick', 'pardon', 'unmute', 'player_info', 'privilege_restriction', 'report', 'unreport', 'server_manage'],
        },
        {
          level: 5,
          title: 'Полный доступ ко всем командам и функциям сервера',
          actions: ['all'],
        },
      ],
    });
  } catch (error) {
    return responseError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const db = sql();
    const body = await request.json();
    const action = String(body.action ?? '');

    if (action === 'grant' || action === 'revoke') {
      if (!(await getManager(db, user.id))) {
        return NextResponse.json(
          { error: 'Нет права управлять доступом RCON' },
          { status: 403 },
        );
      }

      const username = String(body.username ?? '').trim();
      if (!username || username.length > 32) {
        return NextResponse.json(
          { error: 'Укажи корректный ник игрока' },
          { status: 400 },
        );
      }

      const target = await db`
        SELECT id, username FROM users
        WHERE LOWER(username) = LOWER(${username})
        LIMIT 1
      `;

      if (!target.length) {
        return NextResponse.json(
          { error: 'Игрок не найден на сайте' },
          { status: 404 },
        );
      }

      const targetId = target[0].id as string;

      if (targetId === user.id) {
        return NextResponse.json(
          { error: 'Изменение собственного доступа через этот маршрут запрещено' },
          { status: 400 },
        );
      }

      if (action === 'grant') {
        const level = Number(body.level);
        if (!Number.isInteger(level) || level < 1 || level > 5) {
          return NextResponse.json(
            { error: 'Уровень должен быть от 1 до 5' },
            { status: 400 },
          );
        }

        await db`
          INSERT INTO rcon_access (user_id, access_level, granted_by)
          VALUES (${targetId}::uuid, ${level}, ${user.id}::uuid)
          ON CONFLICT (user_id) DO UPDATE SET
            access_level = EXCLUDED.access_level,
            granted_by = EXCLUDED.granted_by,
            updated_at = NOW()
        `;

        await db`
          INSERT INTO rcon_action_logs
            (actor_id, target_username, action, access_level, details, result)
          VALUES (
            ${user.id}::uuid, ${target[0].username}, 'access_grant',
            ${level}, ${JSON.stringify({ level })}::jsonb, 'success'
          )
        `;

        return NextResponse.json({ ok: true, message: 'Доступ выдан' });
      }

      await db`
        DELETE FROM rcon_access WHERE user_id = ${targetId}::uuid
      `;

      await db`
        INSERT INTO rcon_action_logs
          (actor_id, target_username, action, access_level, details, result)
        VALUES (
          ${user.id}::uuid, ${target[0].username}, 'access_revoke',
          1, '{}'::jsonb, 'success'
        )
      `;

      return NextResponse.json({ ok: true, message: 'Доступ отозван' });
    }

    const levelRows = await db`
      SELECT access_level FROM rcon_access
      WHERE user_id = ${user.id}::uuid
    `;
    const level = Number(levelRows[0]?.access_level ?? 0);

    if (!level) {
      return NextResponse.json(
        { error: 'Доступ к RCON не выдан' },
        { status: 403 },
      );
    }

    const requiredLevel = ACTION_LEVEL[action];
    if (!requiredLevel || level < requiredLevel || requiredLevel > 5) {
      return NextResponse.json(
        { error: 'Действие недоступно на вашем уровне' },
        { status: 403 },
      );
    }

    const targetUsername = String(body.username ?? '').trim().slice(0, 32);
    const details: Record<string, unknown> = {};

    // Уровень 2: просмотр информации требует конкретного игрока.
    if (action === 'player_info') {
      if (!targetUsername) {
        return NextResponse.json(
          { error: 'Укажи ник игрока для просмотра информации' },
          { status: 400 },
        );
      }
      details.requestedInfo = true;
    }

    // Уровень 3: ограничение нельзя применять без указания игрока.
    // Исполнение останется заблокированным до подключения Minecraft.
    if (['privilege_restriction', 'report', 'unreport'].includes(action)) {
      if (!targetUsername) {
        return NextResponse.json(
          { error: 'Укажи ник игрока для временного ограничения' },
          { status: 400 },
        );
      }

      if (action !== 'unreport') {
        const reason = String(body.reason ?? '').trim().slice(0, 300);
        if (!reason) {
          return NextResponse.json(
            { error: 'Укажи причину временного ограничения' },
            { status: 400 },
          );
        }
        details.reason = reason;
      }

      details.restrictionType = 'temporary';
    }

    // Уровень 4: требуем цель действия.
    if (action === 'server_manage' && !targetUsername) {
      return NextResponse.json(
        { error: 'Укажи цель управления сервером' },
        { status: 400 },
      );
    }

    if (action === 'console_command') {
      if (level < 5) {
        return NextResponse.json(
          { error: 'Полная консоль доступна только уровню 5' },
          { status: 403 },
        );
      }

      const command = String(body.command ?? '').trim();
      if (!command || command.length > 500 || command.startsWith('/')) {
        return NextResponse.json(
          { error: 'Укажи команду консоли длиной от 1 до 500 символов без начального /' },
          { status: 400 },
        );
      }
      details.command = command;
    } else if (action === 'say') {
      const message = String(body.message ?? '').trim();
      if (!message || message.length > 300) {
        return NextResponse.json(
          { error: 'Сообщение должно содержать от 1 до 300 символов' },
          { status: 400 },
        );
      }
      details.message = message;
    } else if (['ban', 'mute', 'kick', 'pardon', 'unmute'].includes(action)) {
      if (!targetUsername) {
        return NextResponse.json(
          { error: 'Укажи ник игрока' },
          { status: 400 },
        );
      }
      details.reason = String(body.reason ?? '').trim().slice(0, 300);
      if (action === 'report' && !details.reason) {
        return NextResponse.json(
          { error: 'Укажи причину временного ограничения' },
          { status: 400 },
        );
      }
      details.restrictionType = 'temporary';
    }

    await db`
      INSERT INTO rcon_action_logs
        (actor_id, target_username, action, access_level, details, result)
      VALUES (
        ${user.id}::uuid,
        ${targetUsername || null},
        ${action},
        ${level},
        ${JSON.stringify(details)}::jsonb,
        'blocked'
      )
    `;

    return NextResponse.json(
      {
        error: 'Minecraft не подключён. Команда не выполнялась.',
        connection: 'not_configured',
        executed: false,
      },
      { status: 503 },
    );
  } catch (error) {
    return responseError(error);
  }
}
