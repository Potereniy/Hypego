--
-- PostgreSQL database dump
--

\restrict NxQmXwzyBbbRlUG6XPwZWmm4tPEWtPoBg3M315qGj6YOESygANT91pAf4RGxNsJ

-- Dumped from database version 18.6 (653b019)
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone,
    alg text,
    crv text
);


--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    action text NOT NULL,
    target_type text,
    target_id text,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: delivery_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT delivery_jobs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'failed'::text])))
);


--
-- Name: email_auth_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_auth_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    purpose text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT email_auth_tokens_purpose_check CHECK ((purpose = ANY (ARRAY['verify_email'::text, 'password_reset'::text, 'login_code'::text])))
);


--
-- Name: friendships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendships (
    user_id uuid NOT NULL,
    friend_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT friendships_check CHECK ((user_id <> friend_id)),
    CONSTRAINT friendships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    username_target character varying(24) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    amount_cents bigint NOT NULL,
    currency character(3) NOT NULL,
    provider text,
    provider_payment_id text,
    payment_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at timestamp with time zone,
    fulfilled_at timestamp with time zone,
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'fulfilled'::text, 'failed'::text, 'refunded'::text, 'cancelled'::text])))
);


--
-- Name: payment_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    event_id text NOT NULL,
    order_id uuid,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    description text NOT NULL
);


--
-- Name: privileges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.privileges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    server_name text DEFAULT 'Hypego'::text NOT NULL,
    minecraft_username character varying(24) NOT NULL,
    product_name text NOT NULL,
    starts_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    status text DEFAULT 'active'::text NOT NULL,
    source_order uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT privileges_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'revoked'::text, 'pending'::text])))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    category text NOT NULL,
    store text NOT NULL,
    price_cents bigint DEFAULT 0 NOT NULL,
    currency character(3) DEFAULT 'EUR'::bpchar NOT NULL,
    discount_percent integer DEFAULT 0 NOT NULL,
    stock integer,
    minecraft_command text,
    active boolean DEFAULT true NOT NULL,
    requires_staff boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_category_check CHECK ((category = ANY (ARRAY['rank'::text, 'privilege'::text, 'consumable'::text, 'service'::text, 'economy'::text]))),
    CONSTRAINT products_discount_percent_check CHECK (((discount_percent >= 0) AND (discount_percent <= 100))),
    CONSTRAINT products_price_cents_check CHECK ((price_cents >= 0)),
    CONSTRAINT products_store_check CHECK ((store = ANY (ARRAY['main'::text, 'staff'::text])))
);


--
-- Name: punishments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.punishments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    target_username character varying(24) NOT NULL,
    kind text NOT NULL,
    reason text NOT NULL,
    actor_id uuid NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT punishments_kind_check CHECK ((kind = ANY (ARRAY['warn'::text, 'mute'::text, 'ban'::text, 'unban'::text, 'unmute'::text])))
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id text NOT NULL,
    permission_id text NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    title text NOT NULL,
    rank integer NOT NULL,
    is_project_owner boolean DEFAULT false NOT NULL
);


--
-- Name: rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: salary_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    amount bigint NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT salary_transactions_amount_check CHECK ((amount <> 0))
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subject character varying(120) NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'closed'::text])))
);


--
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    user_agent_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone
);


--
-- Name: unban_appeals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unban_appeals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT unban_appeals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id text NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(24) NOT NULL,
    email character varying(254) NOT NULL,
    password_hash text NOT NULL,
    display_name character varying(40),
    avatar_url text,
    banner_url text,
    nickname_color character varying(7) DEFAULT '#a78bfa'::character varying NOT NULL,
    bio character varying(500) DEFAULT ''::character varying NOT NULL,
    steam_id character varying(80),
    birth_date date,
    balance_cents bigint DEFAULT 0 NOT NULL,
    staff_salary bigint DEFAULT 0 NOT NULL,
    is_banned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email_verified_at timestamp with time zone,
    session_version integer DEFAULT 0 NOT NULL,
    CONSTRAINT users_balance_cents_check CHECK ((balance_cents >= 0)),
    CONSTRAINT users_nickname_color_check CHECK (((nickname_color)::text ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT users_staff_salary_check CHECK ((staff_salary >= 0))
);


--
-- Name: wall_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wall_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_user_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body character varying(500) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt", alg, crv) FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
0233f232-ef07-4a94-8af0-51a7332654d8	Hypego	ep-snowy-lake-b4kckiob	2026-10-16 12:47:48.96+00	2026-10-16 12:47:48.96+00	[{"domain": "https://hypego.vercel.app"}, {"domain": "https://hypego-potereniy.vercel.app"}, {"domain": "https://hypego-git-main-potereniy.vercel.app"}, {"domain": "https://hypego-b7emmx0lc-potereniy.vercel.app"}, {"domain": "https://hypego-422dd3a96-potereniy.vercel.app"}, {"domain": "https://hypego-o9gcolefu-potereniy.vercel.app"}, {"domain": "https://hypego-87p582v33-potereniy.vercel.app"}, {"domain": "https://hypego-mklgw7g06-potereniy.vercel.app"}]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"magicLink": {"config": {"expiresIn": 5, "disableSignUp": false}, "enabled": false}, "phoneNumber": {"config": {"otp_expires_in": 300}, "enabled": false}, "organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}, "oauthProvider": {"config": {"mcp": {"resource": "", "dynamicRegistration": true}, "loginPage": "", "resources": [], "consentPage": ""}, "enabled": false}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, actor_id, action, target_type, target_id, details, ip_hash, created_at) FROM stdin;
b53d91a4-bc7e-4d01-9699-1a418aa6210d	13523c2c-476d-41ea-bb09-c394698d7f31	auth.login	user	13523c2c-476d-41ea-bb09-c394698d7f31	{}	\N	2026-10-16 13:07:14.054271+00
6de8d2b6-cc52-45f7-82a3-1ea664b83196	13523c2c-476d-41ea-bb09-c394698d7f31	products.seed	products	\N	{}	\N	2026-10-16 15:36:40.555083+00
92757c8e-3c62-422f-9f61-77a97b1efb4d	13523c2c-476d-41ea-bb09-c394698d7f31	products.seed	products	\N	{}	\N	2026-10-16 15:36:56.407827+00
3597df68-17e9-4ccc-8e38-8cf5b6f4e5df	13523c2c-476d-41ea-bb09-c394698d7f31	products.seed	products	\N	{}	\N	2026-10-16 15:36:57.984998+00
ec27d2e3-72d7-48ac-bab8-b7c9194fa177	13523c2c-476d-41ea-bb09-c394698d7f31	products.seed	products	\N	{}	\N	2026-10-16 15:36:58.429552+00
2053a158-f5ce-4e9f-b127-8f4333698993	13523c2c-476d-41ea-bb09-c394698d7f31	products.seed	products	\N	{}	\N	2026-10-16 15:37:00.016566+00
c9b416a6-8b99-4c25-9bde-2a31414627f8	13523c2c-476d-41ea-bb09-c394698d7f31	products.seed	products	\N	{}	\N	2026-10-16 15:37:10.48668+00
3f1ea4f2-3d19-428b-81df-4068984e8faf	13523c2c-476d-41ea-bb09-c394698d7f31	products.seed	products	\N	{}	\N	2026-10-16 15:37:38.002325+00
de8237df-9cef-440d-91bb-cc3471f1f5df	13523c2c-476d-41ea-bb09-c394698d7f31	products.seed	products	\N	{}	\N	2026-10-16 15:38:32.758095+00
9b863c40-bf8a-45af-850c-e644fd5b3768	13523c2c-476d-41ea-bb09-c394698d7f31	products.seed	products	\N	{}	\N	2026-10-16 16:09:27.401787+00
27d03041-34cb-4a24-ac92-bf084eedd678	13523c2c-476d-41ea-bb09-c394698d7f31	product.update	product	b6796a40-51a2-407b-8a3b-ab8e39a7298e	{"price": 100, "stock": null, "discount": 50}	\N	2026-10-16 16:09:50.266681+00
e53048e5-11ee-4e77-98ff-ed128e7d3ab1	13523c2c-476d-41ea-bb09-c394698d7f31	product.update	product	b6796a40-51a2-407b-8a3b-ab8e39a7298e	{"price": 100, "stock": null, "discount": 50}	\N	2026-10-16 16:09:52.730006+00
0d948361-955b-4b77-a257-577c2965b51c	13523c2c-476d-41ea-bb09-c394698d7f31	auth.verification_resent	user	13523c2c-476d-41ea-bb09-c394698d7f31	{}	\N	2026-10-16 20:48:10.870215+00
33b6d629-e4fa-4a48-b437-9714f015786d	13523c2c-476d-41ea-bb09-c394698d7f31	auth.verification_resent	user	13523c2c-476d-41ea-bb09-c394698d7f31	{}	\N	2026-10-16 21:10:32.405794+00
42c468cf-5849-4bfc-96a6-df7978717afe	13523c2c-476d-41ea-bb09-c394698d7f31	auth.verification_resent	user	13523c2c-476d-41ea-bb09-c394698d7f31	{}	\N	2026-10-16 21:36:37.410774+00
239d611d-49c8-4d82-8e0c-3fde83b98c2b	13523c2c-476d-41ea-bb09-c394698d7f31	auth.verification_resent	user	13523c2c-476d-41ea-bb09-c394698d7f31	{}	\N	2026-10-16 22:48:31.431658+00
66c44602-a96f-41dd-a5c5-12bcc7646c89	13523c2c-476d-41ea-bb09-c394698d7f31	auth.email_verified	user	13523c2c-476d-41ea-bb09-c394698d7f31	{}	\N	2026-10-16 22:48:48.151505+00
\.


--
-- Data for Name: delivery_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_jobs (id, order_id, status, attempts, last_error, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: email_auth_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_auth_tokens (id, user_id, purpose, token_hash, expires_at, attempts, consumed_at, created_at) FROM stdin;
6b3288bd-5a20-49a0-91f4-2b45370772ba	13523c2c-476d-41ea-bb09-c394698d7f31	verify_email	f5301146a463e4cc5c975b422cefa076ce34edca93a58fcf7a24c7cc4d4be4f9	2026-10-16 21:48:10.135522+00	0	2026-10-16 21:10:31.570874+00	2026-10-16 20:48:10.135522+00
abd40b70-1ad7-4226-808c-973c8628cb1d	13523c2c-476d-41ea-bb09-c394698d7f31	verify_email	1554b7af6ec64fd3a690950c963460e7add7e9b2dd3ac4db2244bd309d18ad3e	2026-10-16 22:10:31.679256+00	0	2026-10-16 21:36:36.727956+00	2026-10-16 21:10:31.679256+00
f2c20a4c-b7eb-4104-b11c-366735b7b413	13523c2c-476d-41ea-bb09-c394698d7f31	verify_email	cea5f9e6b1eb06aff4c04843add8798a5c4691ff039852204beb0ac0002d176e	2026-10-16 22:36:36.830716+00	0	2026-10-16 22:48:30.675474+00	2026-10-16 21:36:36.830716+00
4275a428-3dad-4a74-8d09-e00d7e7bd7c8	13523c2c-476d-41ea-bb09-c394698d7f31	verify_email	e16f922a05497d9e690b9a06a541ef815cd5d99dd0b7d3ee8c5e27df7d871b47	2026-10-16 23:48:30.790237+00	0	2026-10-16 22:48:48.051489+00	2026-10-16 22:48:30.790237+00
f7d2d19b-0280-47fa-8138-9845ef852378	13523c2c-476d-41ea-bb09-c394698d7f31	login_code	3d4adf116f108b7aa886284b8ddfd06e8cc762b3ba356dbce16a0391599c99e7	2026-10-16 23:02:36.568836+00	0	2026-10-16 22:52:50.115202+00	2026-10-16 22:52:36.568836+00
789d7a26-d1d0-4633-8873-549ff4660a80	13523c2c-476d-41ea-bb09-c394698d7f31	login_code	726e79c93ef4f1a2fa41898dec5a6d8150c9aedf10d8dbc661b608a03c126c07	2026-10-16 23:02:50.219499+00	0	2026-10-16 22:58:39.249575+00	2026-10-16 22:52:50.219499+00
b30b3290-86bc-4a65-9dfe-a07aeaa2c8aa	13523c2c-476d-41ea-bb09-c394698d7f31	login_code	fc3ce44fbf1cff9c9cf024f01b5662b8f56b318a1c5290f21b442e7498d156b4	2026-10-16 23:08:39.356666+00	0	\N	2026-10-16 22:58:39.356666+00
\.


--
-- Data for Name: friendships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.friendships (user_id, friend_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, user_id, product_id, username_target, status, amount_cents, currency, provider, provider_payment_id, payment_url, created_at, paid_at, fulfilled_at) FROM stdin;
\.


--
-- Data for Name: payment_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_events (id, provider, event_id, order_id, payload, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, description) FROM stdin;
admin.users	Просмотр и управление пользователями
staff.roles.assign_limited	Выдача разрешённых ролей персонала
staff.roles.assign_any	Выдача любых ролей кроме owner
staff.salary.manage	Управление внутренней зарплатой
rules.edit	Редактирование правил
shop.staff	Доступ к магазину персонала
shop.main	Доступ к основному магазину
punishments.manage	Наказания игроков
tickets.manage	Обработка обращений
products.manage	Управление товарами
payments.manage	Просмотр платежей
audit.view	Просмотр журнала действий
site.settings	Настройки проекта
\.


--
-- Data for Name: privileges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.privileges (id, user_id, server_name, minecraft_username, product_name, starts_at, expires_at, status, source_order, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, slug, name, description, category, store, price_cents, currency, discount_percent, stock, minecraft_command, active, requires_staff, created_at) FROM stdin;
842c724d-79ce-49f5-b20b-b09388034bd5	opka-deputy	👑 Заместитель	ОПКА: Заместитель. Осталось 1 место.	rank	main	0	EUR	75	\N	\N	t	f	2026-10-16 15:35:01.926877+00
4040c795-eacb-4ad4-98ab-a55418be6a9e	chief-admin	📈 Гл. Администратор	Главный администратор	rank	main	0	EUR	75	\N	\N	t	f	2026-10-16 15:35:02.165729+00
2a863411-ea5a-4086-933f-ce1fc7bd9af4	administrator	🚀 Администратор	Администратор проекта	rank	main	0	EUR	70	\N	\N	t	f	2026-10-16 15:35:02.490665+00
dcad75bf-02b9-4763-b37f-003dafa2e464	developer	🔥 Разработчик	Привилегия разработчика	privilege	main	0	EUR	75	\N	\N	t	f	2026-10-16 15:35:02.718631+00
a4b2a15a-5f2e-4918-b3de-a8ea26317cb3	chief-console	😎 Гл.Консоль	Главная консоль	privilege	main	0	EUR	70	\N	\N	t	f	2026-10-16 15:35:03.343246+00
4b4aa94b-6c71-419e-9b5d-17801babebb8	console	📱 Консоль	Доступ к консоли	privilege	main	0	EUR	70	\N	\N	t	f	2026-10-16 15:35:04.123084+00
6645cb6a-f78d-4f67-ae4d-f00a8dcb3d56	owner-rank	Владелец	Игровая привилегия «Владелец»; не роль владельца сайта	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:05.540528+00
58edc009-e3bf-4e57-b12f-5078ecb4b3ef	operator	Оператор	Оператор сервера	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:08.695634+00
ca8beada-24e2-47ed-9025-b8513df214e6	anti-griefer	Анти-Грифер	Защита от гриферов	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:10.037743+00
57927b31-f935-4c75-a53e-15f8798e8ca8	support-rank	Поддержка	Игровая привилегия поддержки	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:11.691236+00
397051f1-481b-4fb3-bcc5-b4e416434b84	helper	Хелпер	Помощник сервера	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:13.787426+00
d23bf2be-d208-47f6-8c57-4b4986c5806e	admin-rank	Админ	Игровая привилегия администратора	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:15.291596+00
4830f614-3284-4dae-9c50-930f8a303afa	moderator-rank	Модератор	Игровая привилегия модератора	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:17.510446+00
4c6e87ce-8653-4e00-b5f3-9103ec403db5	creative	Креатив	Режим креатива	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:18.970934+00
50912328-4fb0-47be-b6aa-4741fe996c8c	premium	Премиум	Премиум	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:21.817442+00
36a5990b-9884-4200-8891-a63efb0721c4	vip	Вип	VIP	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:24.460555+00
d5485c5a-983f-4b2e-a6a8-adc081b8e0c7	fly	Флай	Полёт	privilege	main	0	EUR	50	\N	\N	t	f	2026-10-16 15:35:26.059939+00
043eaa0f-41ae-46bb-9df6-7c7d4eb81b85	donate	Донат	Донат-привилегия	privilege	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:27.988897+00
c4eb306d-4e71-460a-8b11-a9eb70ec0dab	beta-tester	❗ БЕТА-ТЕСТЕР [NEW]	Статус бета-тестера	privilege	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:30.401289+00
9b680580-3c65-4f7b-9bf9-d21632fb1128	best-player	⚡ Статус ★ Лучший игрок ★	Статус лучшего игрока	privilege	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:32.905251+00
f6b493d8-ef01-49e9-89cd-4e5052732df3	mvp-plus-plus	🪎 MVP++	MVP++	privilege	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:34.586903+00
6c8242da-a091-4f57-8ac7-f8be4c3fe48b	mvp-plus	🍯 MVP+	MVP+	privilege	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:37.072477+00
a7752519-5b87-427f-bf29-973ae4076b81	mvp	🎗 MVP	MVP	privilege	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:39.628871+00
d2826c1b-b16f-4203-9a9e-bd16dae7c7eb	max-money	Максимальное количество денег	До 18 квинтиллионов игровой валюты	economy	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:42.060887+00
f0c4658b-e238-46f4-bf4f-447c1ce59c1d	wipe-100b	Сохранение валюты после вайпа 100.000.000.000$	Сохранение игровой валюты после вайпа	economy	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:43.394243+00
bda3fd8a-cb8c-467a-912d-fba012e24915	wipe-100m	Сохранение валюты после вайпа 100.000.000$	Сохранение игровой валюты после вайпа	economy	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:45.697768+00
cdfd5cb4-a253-420c-a3ee-bec1f8693069	unlock-all	Разблокировка всего	Разблокировка доступного контента	economy	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:48.151855+00
9cf56047-ce04-486c-9e26-ef4633614e3b	unlock-console	Разблокировка консоли	Разблокировка консоли	economy	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:49.623205+00
1887a34a-da10-4ca5-a2e9-f26f2f2da461	unlock-privilege	Разблокировка привилегии	Разблокировка привилегии	economy	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:51.55352+00
ba3c762e-19b4-45db-ab09-c1382e9bea5d	unban	Разбан по нику	Заявка на снятие бана	service	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:53.791839+00
9e86c916-6e1b-404e-9d52-eec84f966276	unmute	Размут	Заявка на снятие мута	service	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:55.688375+00
9864b0d4-ef4b-438e-afea-369320589cdd	mega-box	Мега-Ящик	Мега-ящик	consumable	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:57.253646+00
01636d5e-8f4a-4a55-9a45-d34022d7bb7e	title-box	Титул-Ящик	Ящик титулов	consumable	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:35:59.445123+00
ecdd1547-1062-407b-a755-48f53546caf4	companion-box	Компаньон-Ящик	Ящик компаньонов	consumable	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:36:01.659377+00
42853576-e138-45b8-bfc6-e8d31f2cd842	pet-box	Питомец-Ящик	Ящик питомцев	consumable	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:36:03.619159+00
501b3c42-5ff8-4f31-835f-46226f8aa023	hologram-box	Голограмм-Ящик	Ящик голограмм	consumable	main	0	EUR	0	\N	\N	t	f	2026-10-16 15:36:05.666601+00
9c767879-012b-4526-93a6-bfeb706eb907	staff-deputy	Заместитель (персонал)	Магазин персонала	rank	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:07.902242+00
08b45e10-cf5e-46ec-849b-eff468950022	staff-chief-admin	Гл. Администратор (персонал)	Магазин персонала	rank	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:12.30742+00
22a56afe-98c0-4844-8ac7-d472c5efe020	staff-admin	Администратор (персонал)	Магазин персонала	rank	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:15.082291+00
e53416b1-bf68-4833-bffa-e285eb4e8f76	staff-console	Консоль (персонал)	Магазин персонала	privilege	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:17.25528+00
d535adf4-82d3-42cc-a0ad-aee791d7a7e5	staff-chief-console	Гл.Консоль (персонал)	Магазин персонала	privilege	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:19.279671+00
94bec0f0-498a-4ac0-a9d9-9aa95289c04d	staff-owner	Владелец (игровая привилегия, персонал)	Не является ролью владельца проекта	privilege	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:21.524036+00
34db44b8-4b1d-411b-86de-586bd655b839	staff-creator	Создатель (персонал)	Магазин персонала	privilege	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:23.926889+00
afcb08b3-b132-4016-9790-b6bb9d92bb87	staff-pet-box	Пет кейс	Магазин персонала	consumable	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:25.634777+00
ff9fe27b-a525-45a2-bed5-58d18fc4dd59	staff-hologram-box	Голограм кейс	Магазин персонала	consumable	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:27.877454+00
bcf054e6-74b3-4f0d-8b09-44fcd0699d62	staff-companion-box	Компаньон кейс	Магазин персонала	consumable	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:30.332152+00
54fdf00b-2438-4b13-8713-3dbf2c2fce8c	staff-title-box	Титул кейс	Магазин персонала	consumable	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:32.226642+00
b72e504f-f905-4d0d-ba3d-44e7643b1fa7	staff-mega-box	Мега ящик	Магазин персонала	consumable	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:34.015472+00
58afbde2-d977-47b5-878e-425c7b1553b8	staff-unmute	Размут (персонал)	Магазин персонала	service	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:36.170401+00
02e825ed-5458-4718-8fb9-0c0d38860771	staff-unban	Разбан (персонал)	Магазин персонала	service	staff	0	EUR	0	\N	\N	t	t	2026-10-16 15:36:38.532156+00
b6796a40-51a2-407b-8a3b-ab8e39a7298e	creator	Создатель	Привилегия создателя	privilege	main	100	EUR	50	\N	\N	t	f	2026-10-16 15:35:07.092659+00
\.


--
-- Data for Name: punishments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.punishments (id, target_username, kind, reason, actor_id, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
owner	admin.users
owner	staff.roles.assign_limited
owner	staff.roles.assign_any
owner	staff.salary.manage
owner	rules.edit
owner	shop.staff
owner	shop.main
owner	punishments.manage
owner	tickets.manage
owner	products.manage
owner	payments.manage
owner	audit.view
owner	site.settings
deputy	admin.users
deputy	staff.roles.assign_any
deputy	staff.salary.manage
deputy	rules.edit
deputy	shop.staff
deputy	shop.main
deputy	punishments.manage
deputy	tickets.manage
deputy	products.manage
deputy	payments.manage
deputy	audit.view
management	admin.users
management	staff.roles.assign_any
management	staff.salary.manage
management	rules.edit
management	shop.staff
management	shop.main
management	punishments.manage
management	tickets.manage
management	products.manage
management	payments.manage
management	audit.view
curator	staff.roles.assign_limited
curator	staff.salary.manage
curator	rules.edit
curator	tickets.manage
curator	shop.main
curator	punishments.manage
tech_admin	admin.users
tech_admin	staff.roles.assign_limited
tech_admin	rules.edit
tech_admin	tickets.manage
tech_admin	shop.main
tech_admin	punishments.manage
support	tickets.manage
support	shop.main
support	shop.staff
moderator	punishments.manage
moderator	tickets.manage
moderator	shop.main
moderator	shop.staff
trainee	tickets.manage
trainee	shop.main
player	shop.main
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, title, rank, is_project_owner) FROM stdin;
owner	Владелец проекта	100	t
deputy	Заместитель (ОПКА)	90	f
management	Руководство	80	f
curator	Куратор	70	f
tech_admin	Тех. админ	60	f
support	Тех. поддержка	50	f
moderator	Модератор	40	f
trainee	Стажёр	30	f
player	Игрок	0	f
chsp	ЧСП	-10	f
\.


--
-- Data for Name: rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rules (id, title, body, sort_order, updated_by, updated_at) FROM stdin;
\.


--
-- Data for Name: salary_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_transactions (id, user_id, actor_id, amount, reason, created_at) FROM stdin;
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tickets (id, user_id, subject, body, status, created_at) FROM stdin;
\.


--
-- Data for Name: trusted_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trusted_devices (id, user_id, token_hash, user_agent_hash, created_at, last_used_at, expires_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: unban_appeals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unban_appeals (id, user_id, reason, status, reviewed_by, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, assigned_by, assigned_at) FROM stdin;
13523c2c-476d-41ea-bb09-c394698d7f31	owner	\N	2026-10-16 13:00:17.395933+00
13523c2c-476d-41ea-bb09-c394698d7f31	player	\N	2026-10-16 13:00:17.657428+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password_hash, display_name, avatar_url, banner_url, nickname_color, bio, steam_id, birth_date, balance_cents, staff_salary, is_banned, created_at, updated_at, email_verified_at, session_version) FROM stdin;
13523c2c-476d-41ea-bb09-c394698d7f31	Kristu4ok	gradusvitc1@gmail.com	$2b$12$CTtobWI4JX4R6V52LVZgZ.SQYZmoKlkVMvFYpsyqWoHtxx8SFQELu	Kristu4ok	\N	\N	#a78bfa		\N	\N	0	0	f	2026-10-16 13:00:16.968936+00	2026-10-16 13:00:16.968936+00	2026-10-16 22:48:47.947843+00	0
\.


--
-- Data for Name: wall_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wall_posts (id, profile_user_id, author_id, body, created_at) FROM stdin;
\.


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: delivery_jobs delivery_jobs_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_jobs
    ADD CONSTRAINT delivery_jobs_order_id_key UNIQUE (order_id);


--
-- Name: delivery_jobs delivery_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_jobs
    ADD CONSTRAINT delivery_jobs_pkey PRIMARY KEY (id);


--
-- Name: email_auth_tokens email_auth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_auth_tokens
    ADD CONSTRAINT email_auth_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_auth_tokens email_auth_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_auth_tokens
    ADD CONSTRAINT email_auth_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (user_id, friend_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_events payment_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_events
    ADD CONSTRAINT payment_events_event_id_key UNIQUE (event_id);


--
-- Name: payment_events payment_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_events
    ADD CONSTRAINT payment_events_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: privileges privileges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privileges
    ADD CONSTRAINT privileges_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: punishments punishments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.punishments
    ADD CONSTRAINT punishments_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_rank_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_rank_key UNIQUE (rank);


--
-- Name: rules rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_pkey PRIMARY KEY (id);


--
-- Name: salary_transactions salary_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_transactions
    ADD CONSTRAINT salary_transactions_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_token_hash_key UNIQUE (token_hash);


--
-- Name: unban_appeals unban_appeals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unban_appeals
    ADD CONSTRAINT unban_appeals_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: wall_posts wall_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wall_posts
    ADD CONSTRAINT wall_posts_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: audit_logs_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_created_idx ON public.audit_logs USING btree (created_at DESC);


--
-- Name: email_auth_tokens_user_purpose_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX email_auth_tokens_user_purpose_idx ON public.email_auth_tokens USING btree (user_id, purpose, created_at DESC);


--
-- Name: orders_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_user_idx ON public.orders USING btree (user_id, created_at DESC);


--
-- Name: privileges_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX privileges_user_idx ON public.privileges USING btree (user_id, status);


--
-- Name: trusted_devices_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trusted_devices_user_idx ON public.trusted_devices USING btree (user_id, expires_at);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: delivery_jobs delivery_jobs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_jobs
    ADD CONSTRAINT delivery_jobs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: email_auth_tokens email_auth_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_auth_tokens
    ADD CONSTRAINT email_auth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendships friendships_friend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: orders orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payment_events payment_events_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_events
    ADD CONSTRAINT payment_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: privileges privileges_source_order_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privileges
    ADD CONSTRAINT privileges_source_order_fkey FOREIGN KEY (source_order) REFERENCES public.orders(id);


--
-- Name: privileges privileges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.privileges
    ADD CONSTRAINT privileges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: punishments punishments_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.punishments
    ADD CONSTRAINT punishments_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: rules rules_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: salary_transactions salary_transactions_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_transactions
    ADD CONSTRAINT salary_transactions_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: salary_transactions salary_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_transactions
    ADD CONSTRAINT salary_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tickets tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: trusted_devices trusted_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: unban_appeals unban_appeals_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unban_appeals
    ADD CONSTRAINT unban_appeals_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: unban_appeals unban_appeals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unban_appeals
    ADD CONSTRAINT unban_appeals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wall_posts wall_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wall_posts
    ADD CONSTRAINT wall_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wall_posts wall_posts_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wall_posts
    ADD CONSTRAINT wall_posts_profile_user_id_fkey FOREIGN KEY (profile_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict NxQmXwzyBbbRlUG6XPwZWmm4tPEWtPoBg3M315qGj6YOESygANT91pAf4RGxNsJ

