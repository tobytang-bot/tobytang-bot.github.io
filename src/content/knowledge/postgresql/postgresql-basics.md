---
title: PostgreSQL 基础操作手册
description: 在 macOS + Homebrew 上从连接、角色、数据库与 Schema、分层授权，到建表、CRUD、事务、备份恢复和常见错误排查的 PostgreSQL 实操手册。
date: 2026-11-13
topics:
  - postgresql
tags:
  - postgresql
  - psql
  - 权限
  - sql
  - homebrew
status: reference
---

> 适用环境：macOS + Homebrew，PostgreSQL 14–18，端口 `5432`。命令里的版本号（如 `postgresql@18`）请替换为实际安装的版本。
>
> 文中的数据库 `demo_db`、Schema `app`、角色 `app_owner` / `app_user` / `app_readonly` 都是示例名称。生产账号请使用强密码，不要把真实密码写进脚本或版本库。

本手册围绕一套「三角色」示例展开：

| 角色 | 用途 | 权限 |
| --- | --- | --- |
| `app_owner` | 数据库和 Schema 的所有者，负责建表、改表结构 | 拥有 `demo_db` 与 `app` Schema 下的对象 |
| `app_user` | 应用程序连接账号 | 对 `app` 下的表 `SELECT / INSERT / UPDATE / DELETE` |
| `app_readonly` | 报表、排查用的只读账号 | 对 `app` 下的表仅 `SELECT` |

只想照着跑一遍，可以直接跳到[第 11 节：从零实操](#11-从零实操完整流程)。

---

## 1. 基本概念

PostgreSQL 的对象层次：

```text
实例（Cluster）
├── 角色（Role）            ← 实例级，所有数据库共享
└── 数据库（Database）
    └── Schema（命名空间）
        └── 表（Table）、序列、视图……
```

- **Instance / Cluster**：一个 PostgreSQL 服务进程管理的一组数据库，共享同一套角色。
- **Role**：同时承担「用户」和「用户组」两种概念；带 `LOGIN` 属性的角色才能登录。`CREATE USER` 等价于 `CREATE ROLE ... LOGIN`。
- **Database**：彼此独立，普通 SQL 不能跨库引用其他库的表。
- **Schema**：数据库内部的命名空间，例如 `app.users`。默认存在 `public`。
- **授权是分层的**：能连库（Database）≠ 能进 Schema ≠ 能读写表，每一层都要单独授权（见第 5 节）。

### 与 MySQL 的对照

| 操作 | MySQL / MariaDB | PostgreSQL |
| --- | --- | --- |
| 默认端口 | 3306 | 5432 |
| 列出数据库 | `SHOW DATABASES;` | `\l`（psql） |
| 切换数据库 | `USE db;` | `\c db`（psql，会重新建立连接） |
| 列出表 | `SHOW TABLES;` | `\dt`（psql） |
| 显示表结构 | `DESCRIBE users;` | `\d app.users`（psql） |
| 自增列 | `AUTO_INCREMENT` | `GENERATED ... AS IDENTITY` |
| 「数据库」的含义 | Database ≈ Schema | Database 之下还有 Schema 一层 |

---

## 2. 服务管理与连接（macOS）

### 2.1 检查安装与服务状态

```bash
# 已安装的 PostgreSQL formula 与客户端版本
brew list --formula | grep -E '^postgresql(@[0-9]+)?$'
psql --version

# Homebrew 服务状态
brew services list
```

启动 / 停止 / 重启（以 `postgresql@18` 为例）：

```bash
brew services start postgresql@18
brew services stop postgresql@18
brew services restart postgresql@18
```

确认端口在监听、服务可接受连接：

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN
pg_isready -h localhost -p 5432
```

### 2.2 第一次连接

Homebrew 初始化的集群，超级用户角色通常与**当前 macOS 用户同名**，不一定存在 `postgres` 角色：

```bash
psql -U "$(whoami)" -d postgres
# 本地 socket 可用时也可以简写为
psql -d postgres
```

连接指定主机、端口、用户和数据库：

```bash
psql -h localhost -p 5432 -U app_user -d demo_db -W
```

`-W` 只是强制弹出密码提示。实际是否校验密码由服务端 `pg_hba.conf` 决定——设置了密码，不代表每种连接方式都会验证它。

### 2.3 连接后确认环境

```sql
SHOW port;
SELECT current_user, current_database();
SHOW config_file;   -- postgresql.conf 位置
SHOW hba_file;      -- pg_hba.conf 位置
```

---

## 3. psql 常用元命令

反斜杠开头的是 **psql 元命令**，不是 SQL，图形客户端（DBeaver、TablePlus 等）的 SQL 编辑器一般不支持。

| 命令 | 说明 |
| --- | --- |
| `\l` | 列出数据库 |
| `\c demo_db` | 连接到另一个数据库 |
| `\conninfo` | 查看当前连接信息 |
| `\du` | 列出角色及属性 |
| `\dn` | 列出 Schema |
| `\dt app.*` | 列出 `app` Schema 中的表 |
| `\d app.users` | 查看表结构 |
| `\dp app.users` | 查看表权限（ACL） |
| `\ddp` | 查看默认权限（`ALTER DEFAULT PRIVILEGES` 的结果） |
| `\password 角色名` | 交互式设置密码 |
| `\x` | 切换扩展（竖排）显示 |
| `\timing` | 切换 SQL 耗时显示 |
| `\?` | 元命令帮助 |
| `\h CREATE TABLE` | SQL 语法帮助 |
| `\q` | 退出 |

---

## 4. 角色、数据库与 Schema

### 4.1 创建登录角色

用具备 `CREATEROLE`（或超级用户）权限的管理账号连接 `postgres` 数据库：

```sql
CREATE ROLE app_owner    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE app_user     LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE app_readonly LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
```

再在 psql 中交互式设置密码：

```text
\password app_owner
\password app_user
\password app_readonly
```

> 也可以写成 `CREATE USER app_user WITH PASSWORD '...'`，但明文密码可能留在 psql 历史、服务器日志或脚本里。日常推荐 `\password`，它会在客户端加密后再发送。

### 4.2 查看与修改角色

```sql
-- 查看角色属性
SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolconnlimit
FROM pg_roles
WHERE rolname IN ('app_owner', 'app_user', 'app_readonly');

ALTER ROLE app_readonly NOLOGIN;            -- 暂时禁止登录
ALTER ROLE app_readonly LOGIN;              -- 恢复登录
ALTER ROLE app_user CONNECTION LIMIT 10;    -- 限制并发连接数

-- 不要随手给业务账号超级用户
-- ALTER ROLE app_user SUPERUSER;
```

### 4.3 删除角色

角色只要还拥有对象或被授予过权限，`DROP ROLE` 就会失败。需要在**每个相关数据库里**先清理依赖：

```sql
-- 把该角色拥有的对象转给别人（在每个相关数据库执行）
REASSIGN OWNED BY app_readonly TO app_owner;
-- 撤销授予它的权限、删除剩余对象（在每个相关数据库执行）
DROP OWNED BY app_readonly;

-- 最后删除角色
DROP ROLE app_readonly;
```

### 4.4 创建数据库

以管理员连接 `postgres` 数据库：

```sql
CREATE DATABASE demo_db OWNER app_owner ENCODING 'UTF8';
```

- `CREATE DATABASE` **不能在事务块中执行**（不能放在 `BEGIN ... COMMIT` 里）。
- `OWNER` 是数据库的所有者，但不会自动拥有库内其他角色创建的对象。

确认结果：

```sql
SELECT datname, pg_get_userbyid(datdba) AS owner
FROM pg_database
WHERE datname = 'demo_db';
```

### 4.5 创建业务 Schema

改用 `app_owner` 连接新数据库：

```bash
psql -h localhost -p 5432 -U app_owner -d demo_db -W
```

```sql
CREATE SCHEMA app AUTHORIZATION app_owner;
```

查看：`\dn`。

> 建议 SQL 里始终写全 `app.users`，不要依赖 `search_path`。另外，PostgreSQL 15 起普通角色默认**不能**在 `public` Schema 建表；14 及以前则可以，如需收紧可执行 `REVOKE CREATE ON SCHEMA public FROM PUBLIC;`。

---

## 5. 授权与权限管理

### 5.1 权限模型速览

一个账号要读到 `app.users` 的数据，三层权限缺一不可：

| 层级 | 关键权限 | 示例 | 缺失时的报错 |
| --- | --- | --- | --- |
| Database | `CONNECT` | `GRANT CONNECT ON DATABASE demo_db TO app_user;` | `permission denied for database demo_db` |
| Schema | `USAGE`（访问）、`CREATE`（建对象） | `GRANT USAGE ON SCHEMA app TO app_user;` | `permission denied for schema app` |
| Table | `SELECT` / `INSERT` / `UPDATE` / `DELETE` | `GRANT SELECT ON app.users TO app_user;` | `permission denied for table users` |

### 5.2 数据库层

由管理员（或数据库 Owner）执行：

```sql
GRANT CONNECT ON DATABASE demo_db TO app_user, app_readonly;
```

PostgreSQL 默认会把新数据库的 `CONNECT` 授予 `PUBLIC`，所以上面这条并不意味着其他角色原本连不上。若需要严格控制，先检查现有 ACL，确认不会阻断其他服务后再执行：

```sql
-- REVOKE CONNECT ON DATABASE demo_db FROM PUBLIC;
```

### 5.3 Schema 层

连接 `demo_db`，以 `app_owner` 执行：

```sql
GRANT USAGE ON SCHEMA app TO app_user, app_readonly;
```

这里刻意**不授予** `CREATE ON SCHEMA app`，业务账号无法在 `app` 下建表，表结构变更统一由 `app_owner` 负责。

### 5.4 表层：已有的表

`GRANT ... ON ALL TABLES` 只作用于**执行时已存在**的表，所以要在建表之后执行：

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_user;
GRANT SELECT                         ON ALL TABLES IN SCHEMA app TO app_readonly;
```

### 5.5 表层：将来创建的表（默认权限）

以**将来实际建表的角色** `app_owner` 执行：

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
GRANT SELECT ON TABLES TO app_readonly;
```

- 默认权限**只对之后由 `app_owner` 创建的对象生效**，不会追溯已有表；换成其他角色建表，需要为那个角色再配一遍。
- 用 `\ddp` 查看已配置的默认权限。
- 本文的表使用 Identity 主键，业务账号插入时不需要额外的序列权限；若使用 `SERIAL` 或显式 `nextval()`，还需要：

```sql
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO app_user;
```

### 5.6 检查与撤销

```sql
-- psql 中查看对象 ACL：\dp app.*

-- 用函数精确检查某个角色的权限
SELECT has_database_privilege('app_user', 'demo_db', 'CONNECT');
SELECT has_schema_privilege('app_user', 'app', 'USAGE');
SELECT has_table_privilege('app_user', 'app.users', 'SELECT');
SELECT has_table_privilege('app_readonly', 'app.users', 'INSERT');  -- 应为 false

-- 撤销 / 恢复只读账号的读权限
REVOKE SELECT ON ALL TABLES IN SCHEMA app FROM app_readonly;
GRANT  SELECT ON ALL TABLES IN SCHEMA app TO   app_readonly;
```

> `REVOKE` 只撤销这一次直接授予的权限。若角色还通过所属角色的成员关系、`PUBLIC` 或对象所有权获得权限，撤销后仍然能访问。最终请用该账号实际登录验证。

---

## 6. 建表与约束

以 `app_owner` 连接 `demo_db` 后执行。

### 6.1 用户表

```sql
CREATE TABLE app.users (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    full_name  VARCHAR(100) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| 写法 | 含义 |
| --- | --- |
| `BIGINT GENERATED ALWAYS AS IDENTITY` | 64 位自增主键；`ALWAYS` 禁止手动指定 id（`BY DEFAULT` 则允许） |
| `PRIMARY KEY` | 非空且唯一，并自动建唯一索引 |
| `UNIQUE` | 禁止重复值；默认允许多个 NULL（PG 15+ 可用 `NULLS NOT DISTINCT` 改变） |
| `NOT NULL` / `DEFAULT` | 非空 / 默认值 |
| `TIMESTAMPTZ` | 带时区语义的时间戳，内部统一存为 UTC 时间点 |

> `updated_at` 的 `DEFAULT` 只在插入时生效，**更新行时不会自动刷新**，需要由应用程序或触发器维护。

### 6.2 商品表与外键

```sql
CREATE TABLE app.products (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id   BIGINT        NOT NULL REFERENCES app.users(id),
    sku        VARCHAR(64)   NOT NULL UNIQUE,
    name       VARCHAR(200)  NOT NULL,
    price      NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    stock      INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 外键不会自动为引用列建索引，需要手动建
CREATE INDEX idx_products_owner_id ON app.products(owner_id);
```

金额使用 `NUMERIC(12,2)` 精确存储，不要用 `REAL` / `DOUBLE PRECISION` 这类浮点型。

建表后别忘了执行 [5.4 节](#54-表层已有的表) 的授权（如果默认权限已提前配置好，则会自动生效）。

---

## 7. 增删改查（CRUD）

以 `app_user` 连接：

```bash
psql -h localhost -p 5432 -U app_user -d demo_db -W
```

### 7.1 INSERT

```sql
INSERT INTO app.users (email, full_name)
VALUES ('alice@example.com', 'Alice')
RETURNING id, email, created_at;

INSERT INTO app.products (owner_id, sku, name, price, stock)
SELECT id, 'SKU-001', '示例商品', 99.90, 15
FROM app.users
WHERE email = 'alice@example.com'
RETURNING *;
```

`RETURNING` 是 PostgreSQL 的常用扩展，可直接取回插入 / 修改 / 删除后的行。

### 7.2 SELECT

```sql
SELECT * FROM app.users;

SELECT id, name, price
FROM app.products
WHERE price >= 50
ORDER BY price DESC
LIMIT 10 OFFSET 0;

SELECT p.sku, p.name, u.full_name AS owner_name
FROM app.products AS p
JOIN app.users    AS u ON u.id = p.owner_id;
```

### 7.3 UPDATE

```sql
UPDATE app.products
SET price = 89.90, stock = 20
WHERE sku = 'SKU-001'
RETURNING id, sku, price, stock;

UPDATE app.users
SET full_name = 'Alice Chen', updated_at = CURRENT_TIMESTAMP
WHERE email = 'alice@example.com';
```

### 7.4 DELETE

```sql
DELETE FROM app.products WHERE sku = 'SKU-001' RETURNING *;
```

> `UPDATE` / `DELETE` 一定要先确认 `WHERE` 条件，漏写会影响整张表。不确定时先用同样的 `WHERE` 跑一次 `SELECT`，或放进事务里执行。被外键引用的用户无法直接删除，需要先处理关联的商品。

---

## 8. 改表、索引与事务

### 8.1 ALTER TABLE

结构变更以表的所有者 `app_owner` 执行：

```sql
ALTER TABLE app.users ADD COLUMN phone VARCHAR(30);
ALTER TABLE app.users RENAME COLUMN full_name TO display_name;
ALTER TABLE app.users DROP COLUMN phone;
```

> 改名后，前文使用 `full_name` 的 SQL 都要跟着改。建议在单独的练习库里试，或放到最后执行。

### 8.2 索引

```sql
CREATE INDEX idx_products_name ON app.products(name);
DROP INDEX app.idx_products_name;
```

`PRIMARY KEY` 和 `UNIQUE` 约束已自带唯一索引，不必在同一列上重复建。线上大表建索引可用 `CREATE INDEX CONCURRENTLY` 避免长时间锁表（不能在事务块内执行）。

### 8.3 事务

```sql
BEGIN;

UPDATE app.products
SET stock = stock - 1
WHERE sku = 'SKU-001' AND stock > 0;

-- 确认无误执行 COMMIT; 否则执行 ROLLBACK;（二选一）
COMMIT;
```

真实的扣库存逻辑需要检查 `UPDATE` 影响的行数是否为 1，并把订单写入等相关操作放在同一个事务里。

---

## 9. 备份与恢复

### 9.1 导出

用拥有全部对象读取权限的账号（这里是所有者 `app_owner`）导出，普通业务账号可能权限不足：

```bash
pg_dump -h localhost -p 5432 -U app_owner -Fc -f demo_db.dump demo_db
```

`-Fc` 为自定义压缩格式，需要用 `pg_restore` 恢复；只想要纯 SQL 文本可去掉 `-Fc` 改用 `-f demo_db.sql`，再用 `psql -f` 导入。

### 9.2 恢复

先由管理员在 `postgres` 库中创建空的目标库（`app_owner` 是 `NOCREATEDB`，不能自己 `createdb`）：

```sql
CREATE DATABASE demo_restore OWNER app_owner;
```

再在终端恢复：

```bash
pg_restore -h localhost -p 5432 -U app_owner -d demo_restore --no-owner --no-acl demo_db.dump
```

- `--no-owner`：忽略归档中的对象所有者，恢复出的对象归执行恢复的角色所有。
- `--no-acl`：忽略归档中的 `GRANT` / `REVOKE`，恢复后需要按第 5 节重新授权。
- 只恢复可信来源的备份文件；备份文件本身也包含业务数据，需妥善保管。

---

## 10. 常见错误排查

| 错误信息 | 常见原因 | 处理办法 |
| --- | --- | --- |
| `role "postgres" does not exist` | Homebrew 的超级用户以 macOS 用户名命名 | 用 `-U "$(whoami)"` 连接 |
| `connection refused` | 服务未启动或端口不对 | `brew services list`、`pg_isready -p 5432` |
| `password authentication failed` | 密码错误，或 `pg_hba.conf` 认证方式不同 | 核对账号与 `pg_hba.conf`，用 `\password` 重设 |
| `permission denied for database` | 缺少 `CONNECT` | `GRANT CONNECT ON DATABASE ...` |
| `permission denied for schema app` | 缺少 Schema 的 `USAGE`（或建表时缺 `CREATE`） | 按需授予 Schema 权限 |
| `permission denied for table users` | 缺少表级权限 | 用 `\dp app.users` 核对，确认当前角色 |
| `permission denied for sequence ...` | 用了 `SERIAL` / `nextval()` 但未授序列权限 | `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app ...` |
| `relation "users" does not exist` | 未写 Schema 前缀，`search_path` 中找不到 | 写全 `app.users` |
| `must be owner of table users` | 改结构的账号不是表所有者 | 用 `app_owner` 执行 |
| `role "x" cannot be dropped because some objects depend on it` | 角色仍拥有对象或权限 | 见 [4.3 节](#43-删除角色)：`REASSIGN OWNED` + `DROP OWNED` |
| `CREATE DATABASE cannot run inside a transaction block` | 在事务里建库 | 单独执行 `CREATE DATABASE` |
| `database "x" is being accessed by other users` | 删除数据库时仍有连接 | 断开连接后再删；PG 13+ 可用 `DROP DATABASE x WITH (FORCE);` |

排查时先确认「我是谁、在哪个库」：

```sql
SELECT current_user, session_user, current_database();
```

---

## 11. 从零实操：完整流程

按顺序执行即可得到一套可用的三角色环境。

**步骤 A：管理员创建角色和数据库**

```bash
psql -U "$(whoami)" -d postgres
```

```sql
CREATE ROLE app_owner    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE app_user     LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE app_readonly LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
```

```text
\password app_owner
\password app_user
\password app_readonly
```

```sql
CREATE DATABASE demo_db OWNER app_owner ENCODING 'UTF8';
GRANT CONNECT ON DATABASE demo_db TO app_user, app_readonly;
```

**步骤 B：所有者建 Schema、配置默认权限、建表**

```bash
psql -h localhost -p 5432 -U app_owner -d demo_db -W
```

```sql
CREATE SCHEMA app AUTHORIZATION app_owner;
GRANT USAGE ON SCHEMA app TO app_user, app_readonly;

-- 先配置默认权限，之后建的表自动授权
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
GRANT SELECT ON TABLES TO app_readonly;

CREATE TABLE app.users (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    full_name  VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app.products (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id BIGINT        NOT NULL REFERENCES app.users(id),
    sku      VARCHAR(64)   NOT NULL UNIQUE,
    name     VARCHAR(200)  NOT NULL,
    price    NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    stock    INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE INDEX idx_products_owner_id ON app.products(owner_id);
```

**步骤 C：业务账号写入数据**

```bash
psql -h localhost -p 5432 -U app_user -d demo_db -W
```

```sql
INSERT INTO app.users (email, full_name)
VALUES ('alice@example.com', 'Alice')
RETURNING *;

INSERT INTO app.products (owner_id, sku, name, price, stock)
SELECT id, 'SKU-001', '示例商品', 99.90, 15
FROM app.users
WHERE email = 'alice@example.com';

SELECT * FROM app.users;
SELECT * FROM app.products;
```

**步骤 D：只读账号验证限制**

```bash
psql -h localhost -p 5432 -U app_readonly -d demo_db -W
```

```sql
SELECT * FROM app.users;              -- 成功

INSERT INTO app.users (email, full_name)
VALUES ('blocked@example.com', 'Blocked');
-- ERROR: permission denied for table users
```

**检查点**

- [ ] `\du` 能看到三个角色
- [ ] `\l` 有 `demo_db`，`\dn` 有 `app`
- [ ] `\dt app.*` 有 `users`、`products`
- [ ] `app_user` 可以增删改查
- [ ] `app_readonly` 可以 `SELECT`，`INSERT` 报权限不足

---

## 12. 安全提醒

- 遵循最小权限原则：应用程序使用 `app_user` 这类业务账号，**不要用超级用户**连接。
- 表结构变更交给所有者账号，业务账号不授予 `CREATE`。
- 不要随意对外开放 5432 端口；需要远程访问时在 `pg_hba.conf` 中限定来源 IP 并使用 `scram-sha-256` 认证。
- 密码不要写进脚本、SQL 文件或版本库；备份文件同样要妥善保管。

---

## 参考资料

- [Database Roles](https://www.postgresql.org/docs/current/user-manag.html)
- [Privileges](https://www.postgresql.org/docs/current/ddl-priv.html)
- [CREATE ROLE](https://www.postgresql.org/docs/current/sql-createrole.html)
- [CREATE DATABASE](https://www.postgresql.org/docs/current/sql-createdatabase.html)
- [GRANT](https://www.postgresql.org/docs/current/sql-grant.html)
- [ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html)
- [DROP OWNED](https://www.postgresql.org/docs/current/sql-drop-owned.html) / [REASSIGN OWNED](https://www.postgresql.org/docs/current/sql-reassign-owned.html)
- [CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [psql](https://www.postgresql.org/docs/current/app-psql.html)
- [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html) / [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [Homebrew postgresql@18](https://formulae.brew.sh/formula/postgresql@18)
