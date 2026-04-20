SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict gp8v66aBxoJd5eer6G93n91ZTdXmQOa4mw96lDKRdDGmmxtkgZQL9bTXKQ3ZNta

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '8260a53f-5262-4b44-8819-45e0ec5c95c9', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"admin@pizzanapoli.test","user_id":"06fd78f9-f8d5-4a1a-a705-f79bff41da78","user_phone":""}}', '2026-04-18 12:55:53.678949+00', ''),
	('00000000-0000-0000-0000-000000000000', '7db3e848-cff4-4367-b03f-2d4a319df9b8', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"platform@pedidos.test","user_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","user_phone":""}}', '2026-04-18 12:55:54.685613+00', ''),
	('00000000-0000-0000-0000-000000000000', '2b3dba81-3a53-42d2-a47c-54d7f098824d', '{"action":"login","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-04-18 13:00:04.928737+00', ''),
	('00000000-0000-0000-0000-000000000000', '7cfb53ad-2e79-4165-864d-a783fa71831d', '{"action":"login","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-04-18 13:07:43.690993+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c964951-75ca-44d2-9e99-045a4fa6e008', '{"action":"user_signedup","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2026-04-18 13:50:19.696331+00', ''),
	('00000000-0000-0000-0000-000000000000', '31e9d63f-2b41-4ff9-9d6f-07dc1c93ad48', '{"action":"login","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2026-04-18 13:50:21.51701+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bbb0eec0-ed4b-4598-bae2-919c99e0b95f', '{"action":"logout","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-04-18 13:52:25.568074+00', ''),
	('00000000-0000-0000-0000-000000000000', '3642cdda-3e8a-4082-aaa2-660fb66f7ba6', '{"action":"login","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2026-04-18 13:52:30.717604+00', ''),
	('00000000-0000-0000-0000-000000000000', '94f28618-dfc6-403b-9dc9-da78fa01e1c3', '{"action":"login","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2026-04-18 13:52:31.993892+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f5f3592-9b00-404a-b736-ff2327f706f2', '{"action":"logout","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-04-18 14:06:20.983513+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b2d030cf-3e6c-4bb1-aeed-877d0756d791', '{"action":"login","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-04-18 14:11:00.726463+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d9268a8-0d5d-429b-b2f7-c051a0d93799', '{"action":"login","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2026-04-18 14:39:24.716013+00', ''),
	('00000000-0000-0000-0000-000000000000', '5c4d986d-8fd9-4945-818d-976085f86e60', '{"action":"login","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2026-04-18 14:39:31.19573+00', ''),
	('00000000-0000-0000-0000-000000000000', 'abbc2d56-c61a-4fc8-af24-fe52cecf4a0c', '{"action":"token_refreshed","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"token"}', '2026-04-19 17:25:11.87054+00', ''),
	('00000000-0000-0000-0000-000000000000', '0e804cde-9481-4ec4-94cd-7a53ca93fed8', '{"action":"token_revoked","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"token"}', '2026-04-19 17:25:11.874583+00', ''),
	('00000000-0000-0000-0000-000000000000', '11f19d42-529d-439f-8fcb-10cec7390b56', '{"action":"token_refreshed","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"token"}', '2026-04-19 17:25:12.319821+00', ''),
	('00000000-0000-0000-0000-000000000000', '8372196e-b571-4571-ab81-0a0744604b98', '{"action":"login","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2026-04-19 17:34:47.870618+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd4ac704f-f10c-44fc-8baf-de95c00cd027', '{"action":"login","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2026-04-19 17:34:49.078843+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd55bfdbc-7940-47c5-8547-ac1c922dddad', '{"action":"token_refreshed","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"token"}', '2026-04-19 18:23:41.400544+00', ''),
	('00000000-0000-0000-0000-000000000000', '2c28d2bc-ffb1-4cca-a1db-e96461e2bcc1', '{"action":"token_revoked","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"token"}', '2026-04-19 18:23:41.402527+00', ''),
	('00000000-0000-0000-0000-000000000000', '867cb7d8-3a81-45d9-8b2a-26aee5c2c117', '{"action":"token_refreshed","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-19 18:37:25.155767+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f0696443-a2e3-46a9-9cdd-8a844d2a10a0', '{"action":"token_revoked","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-19 18:37:25.156741+00', ''),
	('00000000-0000-0000-0000-000000000000', '6aaf2a07-0db7-42ec-8feb-b0e1b32ecd44', '{"action":"token_refreshed","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-19 18:37:35.517985+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c6ff4161-419b-419b-b43f-57c74496cf84', '{"action":"token_refreshed","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-19 18:37:43.783726+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dfedb18e-8b50-40d1-8b37-449c8a3ca78f', '{"action":"token_refreshed","actor_id":"43e980e8-9c57-48ff-8dbe-264e84646add","actor_name":"Juan Bonadeo","actor_username":"juancruzbonadeo04@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-19 18:37:51.616763+00', ''),
	('00000000-0000-0000-0000-000000000000', '31570f08-b151-4900-98de-6646f78962f8', '{"action":"token_refreshed","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"token"}', '2026-04-19 19:22:06.767369+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1aa6ebd-f76c-45f0-a1a3-50489095954f', '{"action":"token_revoked","actor_id":"e98df9fd-883a-47f5-a9e2-80f96f14f292","actor_username":"platform@pedidos.test","actor_via_sso":false,"log_type":"token"}', '2026-04-19 19:22:06.768793+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('e8d63475-0ba0-490a-af2e-e649cf158e15', NULL, 'e3ecf2fd-fa8b-4b26-9066-b87df8e7bf33', 's256', 'G5W06DpA0o2jFpSYiTva7qUWzjgTd_2ltmcWMimre4w', 'google', '', '', '2026-04-18 14:59:14.070878+00', '2026-04-18 14:59:14.070878+00', 'oauth', NULL, NULL, 'http://localhost:3000/auth/callback?next=%2Fpizzanapoli%2Fmenu', NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '06fd78f9-f8d5-4a1a-a705-f79bff41da78', 'authenticated', 'authenticated', 'admin@pizzanapoli.test', '$2a$10$wczkuG69inXiPJH9pjPBmuVd7/YBghCILoFP43xY2CsKsBePoHTa6', '2026-04-18 12:55:53.681161+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-04-18 12:55:53.673102+00', '2026-04-18 12:55:53.681682+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '43e980e8-9c57-48ff-8dbe-264e84646add', 'authenticated', 'authenticated', 'juancruzbonadeo04@gmail.com', NULL, '2026-04-18 13:50:19.69763+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-04-19 17:34:49.079886+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "112624013349315784375", "name": "Juan Bonadeo", "email": "juancruzbonadeo04@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJgDSGuQbLxXni1khpsgPpmkUUlP38-aqly9axQT3R4H6mqlHaZRA=s96-c", "full_name": "Juan Bonadeo", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJgDSGuQbLxXni1khpsgPpmkUUlP38-aqly9axQT3R4H6mqlHaZRA=s96-c", "provider_id": "112624013349315784375", "email_verified": true, "phone_verified": false}', NULL, '2026-04-18 13:50:19.684905+00', '2026-04-19 18:37:25.159148+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', 'authenticated', 'authenticated', 'platform@pedidos.test', '$2a$10$ttuWjcAcNfJnuLTvCCy.Qe7uv6TOFxyCwtOf7OVgvVf0mdu0TrNVy', '2026-04-18 12:55:54.687301+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-04-18 14:11:00.727948+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-04-18 12:55:54.682366+00', '2026-04-19 19:22:06.771257+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('06fd78f9-f8d5-4a1a-a705-f79bff41da78', '06fd78f9-f8d5-4a1a-a705-f79bff41da78', '{"sub": "06fd78f9-f8d5-4a1a-a705-f79bff41da78", "email": "admin@pizzanapoli.test", "email_verified": false, "phone_verified": false}', 'email', '2026-04-18 12:55:53.677515+00', '2026-04-18 12:55:53.677553+00', '2026-04-18 12:55:53.677553+00', '8cc22383-0c3a-43e8-8066-7c4786ac21b4'),
	('e98df9fd-883a-47f5-a9e2-80f96f14f292', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{"sub": "e98df9fd-883a-47f5-a9e2-80f96f14f292", "email": "platform@pedidos.test", "email_verified": false, "phone_verified": false}', 'email', '2026-04-18 12:55:54.684288+00', '2026-04-18 12:55:54.684322+00', '2026-04-18 12:55:54.684322+00', 'f69df746-537c-4829-a639-51592408d4ff'),
	('112624013349315784375', '43e980e8-9c57-48ff-8dbe-264e84646add', '{"iss": "https://accounts.google.com", "sub": "112624013349315784375", "name": "Juan Bonadeo", "email": "juancruzbonadeo04@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJgDSGuQbLxXni1khpsgPpmkUUlP38-aqly9axQT3R4H6mqlHaZRA=s96-c", "full_name": "Juan Bonadeo", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJgDSGuQbLxXni1khpsgPpmkUUlP38-aqly9axQT3R4H6mqlHaZRA=s96-c", "provider_id": "112624013349315784375", "email_verified": true, "phone_verified": false}', 'google', '2026-04-18 13:50:19.692932+00', '2026-04-18 13:50:19.692953+00', '2026-04-19 17:34:47.868684+00', '94674974-9076-43db-a4d2-f579b247fa5a');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('d688eec6-ba1d-440d-9351-72dbd4c52e0b', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 13:00:04.931544+00', '2026-04-18 13:00:04.931544+00', NULL, 'aal1', NULL, NULL, 'node', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('ab1c4e8a-165e-472d-acd1-7008b1ea95cb', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 13:07:43.692448+00', '2026-04-18 13:07:43.692448+00', NULL, 'aal1', NULL, NULL, 'node', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('1b86e2b0-c14c-4364-ad6d-4e578b7f7c24', '43e980e8-9c57-48ff-8dbe-264e84646add', '2026-04-18 14:39:31.197472+00', '2026-04-18 14:39:31.197472+00', NULL, 'aal1', NULL, NULL, 'node', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('fae1e080-7460-4d16-9ce1-d07fbe7507ea', '43e980e8-9c57-48ff-8dbe-264e84646add', '2026-04-19 17:34:49.079955+00', '2026-04-19 18:37:51.617791+00', NULL, 'aal1', NULL, '2026-04-19 18:37:51.617745', 'node', '172.18.0.1', NULL, NULL, NULL, NULL, NULL),
	('382756f0-f06f-4b1a-aff1-e5777c1f3595', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:11:00.728196+00', '2026-04-19 19:22:06.773103+00', NULL, 'aal1', NULL, '2026-04-19 19:22:06.773047', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '172.18.0.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('d688eec6-ba1d-440d-9351-72dbd4c52e0b', '2026-04-18 13:00:04.938064+00', '2026-04-18 13:00:04.938064+00', 'password', 'e3a824d2-5f3c-42ec-b8a5-d55da878e8bb'),
	('ab1c4e8a-165e-472d-acd1-7008b1ea95cb', '2026-04-18 13:07:43.696335+00', '2026-04-18 13:07:43.696335+00', 'password', 'b2b814b5-26c5-4a00-a691-365c807072bd'),
	('382756f0-f06f-4b1a-aff1-e5777c1f3595', '2026-04-18 14:11:00.732685+00', '2026-04-18 14:11:00.732685+00', 'password', 'a742621d-b91a-4b64-bfb7-38429bdb97ce'),
	('1b86e2b0-c14c-4364-ad6d-4e578b7f7c24', '2026-04-18 14:39:31.207128+00', '2026-04-18 14:39:31.207128+00', 'oauth', '792a925b-6750-4439-b385-1ba8492bfa41'),
	('fae1e080-7460-4d16-9ce1-d07fbe7507ea', '2026-04-19 17:34:49.082628+00', '2026-04-19 17:34:49.082628+00', 'oauth', 'd9034617-3806-47c0-acc5-25767d36996e');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'lftjokdh3anl', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', false, '2026-04-18 13:00:04.93461+00', '2026-04-18 13:00:04.93461+00', NULL, 'd688eec6-ba1d-440d-9351-72dbd4c52e0b'),
	('00000000-0000-0000-0000-000000000000', 2, 'sgngc2khh3dm', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', false, '2026-04-18 13:07:43.694563+00', '2026-04-18 13:07:43.694563+00', NULL, 'ab1c4e8a-165e-472d-acd1-7008b1ea95cb'),
	('00000000-0000-0000-0000-000000000000', 6, 'bdooiuqo46hn', '43e980e8-9c57-48ff-8dbe-264e84646add', false, '2026-04-18 14:39:31.202303+00', '2026-04-18 14:39:31.202303+00', NULL, '1b86e2b0-c14c-4364-ad6d-4e578b7f7c24'),
	('00000000-0000-0000-0000-000000000000', 5, '4fgub3yzfz5a', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', true, '2026-04-18 14:11:00.73024+00', '2026-04-19 17:25:11.876107+00', NULL, '382756f0-f06f-4b1a-aff1-e5777c1f3595'),
	('00000000-0000-0000-0000-000000000000', 7, 'pbsv3kouwvqu', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', true, '2026-04-19 17:25:11.877704+00', '2026-04-19 18:23:41.402967+00', '4fgub3yzfz5a', '382756f0-f06f-4b1a-aff1-e5777c1f3595'),
	('00000000-0000-0000-0000-000000000000', 8, 'w7psmdk4scja', '43e980e8-9c57-48ff-8dbe-264e84646add', true, '2026-04-19 17:34:49.081405+00', '2026-04-19 18:37:25.157251+00', NULL, 'fae1e080-7460-4d16-9ce1-d07fbe7507ea'),
	('00000000-0000-0000-0000-000000000000', 10, 'ui6iqbvmvei4', '43e980e8-9c57-48ff-8dbe-264e84646add', false, '2026-04-19 18:37:25.158172+00', '2026-04-19 18:37:25.158172+00', 'w7psmdk4scja', 'fae1e080-7460-4d16-9ce1-d07fbe7507ea'),
	('00000000-0000-0000-0000-000000000000', 9, '2ft6l3mkzjdj', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', true, '2026-04-19 18:23:41.404359+00', '2026-04-19 19:22:06.76932+00', 'pbsv3kouwvqu', '382756f0-f06f-4b1a-aff1-e5777c1f3595'),
	('00000000-0000-0000-0000-000000000000', 11, 'arq6755e2det', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', false, '2026-04-19 19:22:06.770128+00', '2026-04-19 19:22:06.770128+00', '2ft6l3mkzjdj', '382756f0-f06f-4b1a-aff1-e5777c1f3595');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."businesses" ("id", "slug", "name", "timezone", "currency", "phone", "email", "address", "lat", "lng", "logo_url", "settings", "plan", "is_active", "created_at", "cover_image_url", "delivery_fee_cents", "min_order_cents", "estimated_delivery_minutes", "mp_access_token", "mp_public_key", "mp_webhook_secret", "mp_accepts_payments") VALUES
	('c2e5af14-ffcd-4349-9126-14f6f3517a35', 'golfjcr', 'Golf JCR', 'America/Argentina/Buenos_Aires', 'ARS', '+54 11 5555-1234', 'hola@pizzanapoli.test', 'Av. Corrientes 1234, CABA', NULL, NULL, 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/logo-c52eecfb-0d8f-4ed2-a4b9-5b56d5b7df0f.jpg', '{"logo_url": "http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/logo-c52eecfb-0d8f-4ed2-a4b9-5b56d5b7df0f.jpg", "primary_color": "#193860", "primary_foreground": "#FFFFFF"}', 'basic', true, '2026-04-18 12:55:39.478638+00', 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/cover-56cd01e3-c71c-4eaf-899f-01886da588a5.jpg', 150000, 0, 25, 'APP_USR-2009620867306587-010209-29b985b108052ffe4e8094c8df960a81-3102975163', 'APP_USR-cf8457dd-5f75-49dc-b157-2e9b5b9ab420', NULL, true);


--
-- Data for Name: business_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."business_hours" ("id", "business_id", "day_of_week", "opens_at", "closes_at") VALUES
	('9f919ef9-03d3-4f51-ac89-107deee747b4', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 0, '11:00:00', '23:00:00'),
	('3e638214-308b-4bf0-b9f3-e0fab0bca85e', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 1, '11:00:00', '23:00:00'),
	('b2e44af2-7817-4804-9a9b-30e0b5b31394', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 2, '11:00:00', '23:00:00'),
	('28a3442b-8f30-4b61-9371-8ccd4854476b', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 3, '11:00:00', '23:00:00'),
	('05c6c8bb-373b-4b45-b457-00b95e40f4f7', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 4, '11:00:00', '23:00:00'),
	('e2e4b712-4af0-49a6-b69d-fa7b7481b5df', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 5, '11:00:00', '23:00:00'),
	('ebca58b2-624c-4096-a621-32789b2e163c', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 6, '11:00:00', '23:00:00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "full_name", "created_at", "is_platform_admin") VALUES
	('06fd78f9-f8d5-4a1a-a705-f79bff41da78', 'admin@pizzanapoli.test', NULL, '2026-04-18 12:55:53.69138+00', false),
	('e98df9fd-883a-47f5-a9e2-80f96f14f292', 'platform@pedidos.test', NULL, '2026-04-18 12:55:54.704121+00', true);


--
-- Data for Name: business_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."business_users" ("business_id", "user_id", "role", "created_at") VALUES
	('c2e5af14-ffcd-4349-9126-14f6f3517a35', '06fd78f9-f8d5-4a1a-a705-f79bff41da78', 'admin', '2026-04-18 12:55:53.707158+00');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "business_id", "name", "slug", "sort_order", "is_active") VALUES
	('bf77c5a3-b470-4e5d-a1d3-d21ed2738e5b', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'Pizzas', 'pizzas', 0, true),
	('ac3adf78-4046-428f-846c-c9c6b967a0f7', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'Empanadas', 'empanadas', 1, true),
	('b6676679-0376-4d55-91fd-e4863a8f2178', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'Bebidas', 'bebidas', 2, true);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customers" ("id", "business_id", "phone", "name", "email", "created_at", "user_id") VALUES
	('2de3c0b2-9d33-4356-9e11-b06bce605690', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', '+5491100000999', 'Repetido', NULL, '2026-04-18 13:47:04.482216+00', NULL),
	('7684c130-6a0e-49eb-8d8e-247dc2539961', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', '+5491100000555', 'Seq', NULL, '2026-04-18 13:47:04.653723+00', NULL),
	('dd79e916-9b02-43b0-b262-d755ef8223e1', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', '+543412510795', 'Juan Bonadeo', 'juancruzbonadeo04@gmail.com', '2026-04-18 14:40:12.685122+00', '43e980e8-9c57-48ff-8dbe-264e84646add');


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customer_addresses" ("id", "customer_id", "label", "street", "number", "apartment", "notes", "lat", "lng", "created_at") VALUES
	('a732e273-ce91-4177-8351-8800de9a080e', 'dd79e916-9b02-43b0-b262-d755ef8223e1', NULL, 'Garc├¡a del Cossio 2198 Bis', NULL, NULL, NULL, NULL, NULL, '2026-04-19 17:35:18.513783+00');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("id", "business_id", "category_id", "name", "slug", "description", "price_cents", "image_url", "is_available", "is_active", "sort_order", "created_at") VALUES
	('323cedfc-fa19-4f9c-8564-4f475501915c', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'bf77c5a3-b470-4e5d-a1d3-d21ed2738e5b', 'Pizza Napolitana', 'napolitana', 'Muzzarella, rodajas de tomate, ajo y aceitunas negras.', 1200000, 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/96946ea3-97a4-42ed-b803-13d14de2bf1c.jpg', true, true, 1, '2026-04-18 12:55:39.478638+00'),
	('d5b3cee6-e4c1-48de-9936-db1168f7f787', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'bf77c5a3-b470-4e5d-a1d3-d21ed2738e5b', 'Pizza Fugazzetta', 'fugazzetta', 'Muzzarella, cebolla caramelizada y queso extra.', 1100000, 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/48339df4-129b-4d2a-acd7-ba65bc04c1c2.webp', true, true, 2, '2026-04-18 12:55:39.478638+00'),
	('3e0021d0-2377-441f-b2fd-585a48e2db5b', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'bf77c5a3-b470-4e5d-a1d3-d21ed2738e5b', 'Pizza Calabresa', 'calabresa', 'Muzzarella, longaniza calabresa picante y morrones.', 1300000, 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/f812dc4c-0c10-460b-948b-7635d628257f.avif', true, true, 3, '2026-04-18 12:55:39.478638+00'),
	('7de34d99-2206-479c-b8b4-43f514a4d8e0', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'ac3adf78-4046-428f-846c-c9c6b967a0f7', 'Empanada de Carne', 'empanada-carne', 'Carne cortada a cuchillo, cebolla y huevo.', 550000, 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/b1cbebc5-02ff-4483-b7ef-e8bc92b6e5f4.avif', true, true, 0, '2026-04-18 12:55:39.478638+00'),
	('41b65e27-b0a6-4926-840f-b6d8042f10d4', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'ac3adf78-4046-428f-846c-c9c6b967a0f7', 'Empanada de Jam├│n y Queso', 'empanada-jyq', 'Cl├ísica, al horno.', 550000, 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/702144de-7cfe-4a25-a3f2-c5130ed10a17.jpg', true, true, 1, '2026-04-18 12:55:39.478638+00'),
	('ef1d3c6a-7da7-48af-bc1c-726e34b067c7', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'b6676679-0376-4d55-91fd-e4863a8f2178', 'Coca-Cola 1.5L', 'coca-1500', 'Botella retornable.', 250000, 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/a17a6166-688c-4b7c-8e21-11ae61bd8fc0.jpg', true, true, 0, '2026-04-18 12:55:39.478638+00'),
	('fb7d26d6-27bb-41f7-90bc-5f37e8bd0f93', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'b6676679-0376-4d55-91fd-e4863a8f2178', 'Agua Mineral 500ml', 'agua-500', 'Sin gas.', 150000, 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/b6209ed7-15a4-4575-a790-21a453e1618d.webp', true, true, 1, '2026-04-18 12:55:39.478638+00'),
	('42d6e217-e36c-48bd-bdc5-653567a802f9', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 'bf77c5a3-b470-4e5d-a1d3-d21ed2738e5b', 'Pizza Muzzarella', 'muzzarella', 'Muzzarella fresca, salsa de tomate y or├®gano.', 999900, 'http://127.0.0.1:54321/storage/v1/object/public/products/c2e5af14-ffcd-4349-9126-14f6f3517a35/e9b15326-1f83-4d72-9d9d-f36daca01183.jpg', true, true, 0, '2026-04-18 12:55:39.478638+00');


--
-- Data for Name: modifier_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."modifier_groups" ("id", "business_id", "product_id", "name", "min_selection", "max_selection", "is_required", "sort_order") VALUES
	('96d92b83-22ac-4e18-9498-405c370efec9', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', '42d6e217-e36c-48bd-bdc5-653567a802f9', 'Tama├▒o', 1, 1, true, 0),
	('3e8f227d-4518-4e67-a46b-3745c1e9a2fe', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', '42d6e217-e36c-48bd-bdc5-653567a802f9', 'Extras', 0, 3, false, 1);


--
-- Data for Name: modifiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."modifiers" ("id", "group_id", "name", "price_delta_cents", "is_available", "sort_order") VALUES
	('076f04bf-1a3d-43d7-949d-249b889c9314', '96d92b83-22ac-4e18-9498-405c370efec9', 'Chica', 0, true, 0),
	('4c3a8ea8-452f-43a7-9207-3d6a11e87746', '96d92b83-22ac-4e18-9498-405c370efec9', 'Mediana', 1500000, true, 1),
	('56e5726e-7e7f-44a0-a069-072506904204', '96d92b83-22ac-4e18-9498-405c370efec9', 'Grande', 3000000, true, 2),
	('12fec653-733b-4403-ae3d-c9daf5f77696', '3e8f227d-4518-4e67-a46b-3745c1e9a2fe', 'Jam├│n', 800000, true, 0),
	('9904a446-a7fd-4da9-8b48-f2b3e1a59946', '3e8f227d-4518-4e67-a46b-3745c1e9a2fe', 'Huevo', 500000, true, 1),
	('71926392-2a18-4ffe-97c3-172efdf867fe', '3e8f227d-4518-4e67-a46b-3745c1e9a2fe', 'Aceitunas', 400000, true, 2);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."orders" ("id", "business_id", "order_number", "customer_id", "customer_name", "customer_phone", "delivery_type", "delivery_address", "delivery_lat", "delivery_lng", "delivery_notes", "status", "subtotal_cents", "delivery_fee_cents", "discount_cents", "total_cents", "payment_method", "payment_status", "cancelled_reason", "created_at", "updated_at", "mp_preference_id", "mp_payment_id") VALUES
	('e44bfb5b-b026-4993-af33-e8903d63b1ce', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 1, '2de3c0b2-9d33-4356-9e11-b06bce605690', 'Repetido', '+5491100000999', 'pickup', NULL, NULL, NULL, NULL, 'pending', 150000, 0, 0, 150000, 'cash_on_delivery', 'pending', NULL, '2026-04-18 13:47:04.506909+00', '2026-04-18 13:47:04.506909+00', NULL, NULL),
	('cdea3a35-3721-4061-a759-47095f42afe4', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 2, '2de3c0b2-9d33-4356-9e11-b06bce605690', 'Repetido', '+5491100000999', 'pickup', NULL, NULL, NULL, NULL, 'pending', 150000, 0, 0, 150000, 'cash_on_delivery', 'pending', NULL, '2026-04-18 13:47:04.598275+00', '2026-04-18 13:47:04.598275+00', NULL, NULL),
	('01ae7b69-a2bd-4ec7-b65a-6d00940acc95', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 3, '7684c130-6a0e-49eb-8d8e-247dc2539961', 'Seq', '+5491100000555', 'pickup', NULL, NULL, NULL, NULL, 'pending', 150000, 0, 0, 150000, 'cash_on_delivery', 'pending', NULL, '2026-04-18 13:47:04.666821+00', '2026-04-18 13:47:04.666821+00', NULL, NULL),
	('d7b2a244-a36f-455b-a33a-47c0fa2044c6', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 4, '7684c130-6a0e-49eb-8d8e-247dc2539961', 'Seq', '+5491100000555', 'pickup', NULL, NULL, NULL, NULL, 'preparing', 150000, 0, 0, 150000, 'cash_on_delivery', 'pending', NULL, '2026-04-18 13:47:04.7415+00', '2026-04-18 14:15:41.924888+00', NULL, NULL),
	('e0d9bafc-4d8a-4655-80aa-712182fead5f', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 5, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'pickup', NULL, NULL, NULL, NULL, 'ready', 1200000, 0, 0, 1200000, 'cash_on_delivery', 'pending', NULL, '2026-04-18 14:40:12.698063+00', '2026-04-18 14:41:09.003557+00', NULL, NULL),
	('542dfd13-d624-4ac9-8404-19f0cb435bc8', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 7, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'delivery', 'Garc├¡a del Cossio 2198 Bis', NULL, NULL, NULL, 'delivered', 1200000, 150000, 0, 1350000, 'cash_on_delivery', 'pending', NULL, '2026-04-19 17:35:18.491019+00', '2026-04-19 17:58:01.622692+00', NULL, NULL),
	('1188f68d-c884-4957-b4e7-5a16357f4464', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 6, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Bonadeo Juan Cruz', '+543412510795', 'delivery', 'Garc├¡a del Cossio 2198 Bis', NULL, NULL, NULL, 'delivered', 1200000, 150000, 0, 1350000, 'cash_on_delivery', 'pending', NULL, '2026-04-19 17:30:42.227471+00', '2026-04-19 17:58:02.066488+00', NULL, NULL),
	('81058971-8c3c-4991-83b7-033c4968b7db', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 15, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'pickup', NULL, NULL, NULL, 'Garc├¡a del Cossio 2198 Bis', 'cancelled', 999900, 0, 0, 999900, 'mp', 'paid', 'Cancelado por el cliente', '2026-04-19 19:18:09.613973+00', '2026-04-19 19:23:20.332547+00', '3102975163-34aa3e12-ed09-493d-ae71-9f5323b25361', '155523557976'),
	('3b097806-f6ca-4d79-bf87-44e4479823e2', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 13, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'pickup', NULL, NULL, NULL, 'Garc├¡a del Cossio 2198 Bis', 'delivered', 999900, 0, 0, 999900, 'mp', 'paid', NULL, '2026-04-19 18:50:25.100586+00', '2026-04-19 18:53:45.345639+00', '3102975163-1c102ced-a703-45cf-890f-d33123937957', '154766426013'),
	('e666d071-feb8-4b98-b9e6-7dad015871bd', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 12, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'pickup', NULL, NULL, NULL, 'Garc├¡a del Cossio 2198 Bis', 'cancelled', 999900, 0, 0, 999900, 'mp', 'failed', 'pobre', '2026-04-19 18:48:27.647304+00', '2026-04-19 19:20:02.417874+00', NULL, NULL),
	('5c378692-8182-4cac-a1cd-aacb9c4c62d7', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 10, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'delivery', 'Garc├¡a del Cossio 2198 Bis', NULL, NULL, NULL, 'cancelled', 999900, 150000, 0, 1149900, 'mp', 'pending', 'sss', '2026-04-19 18:37:51.715134+00', '2026-04-19 19:20:07.67265+00', '3102975163-5dc13758-2d03-43df-aedd-515f02d1fb1d', NULL),
	('ea9ee4a8-105b-4cfd-ab94-e187e1f7e674', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 11, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'pickup', NULL, NULL, NULL, 'Garc├¡a del Cossio 2198 Bis', 'cancelled', 999900, 0, 0, 999900, 'mp', 'pending', 'wedfwf', '2026-04-19 18:43:23.234532+00', '2026-04-19 19:20:10.643144+00', '3102975163-09b2558f-49b7-4854-a560-c36ea22c66dd', NULL),
	('59151e78-5bd6-4204-b82e-c82a6b190989', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 9, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'delivery', 'Garc├¡a del Cossio 2198 Bis', NULL, NULL, NULL, 'cancelled', 3600000, 150000, 0, 3750000, 'mp', 'pending', 'wrfqwrfv', '2026-04-19 18:30:33.252536+00', '2026-04-19 19:20:14.604453+00', '3102975163-4aacd7df-a536-4b84-923c-4b306641b1f3', NULL),
	('d8dd2a92-ed5b-4db9-9ac0-652067043049', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 8, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'delivery', 'Garc├¡a del Cossio 2198 Bis', NULL, NULL, NULL, 'cancelled', 3600000, 150000, 0, 3750000, 'mp', 'failed', 'erfververgv', '2026-04-19 18:29:28.160851+00', '2026-04-19 19:20:22.595344+00', NULL, NULL),
	('0b94e8d4-5add-453b-97e0-d96e3e660adf', 'c2e5af14-ffcd-4349-9126-14f6f3517a35', 14, 'dd79e916-9b02-43b0-b262-d755ef8223e1', 'Juan Bonadeo', '+543412510795', 'pickup', NULL, NULL, NULL, 'Garc├¡a del Cossio 2198 Bis', 'delivered', 999900, 0, 0, 999900, 'mp', 'paid', NULL, '2026-04-19 19:06:17.824403+00', '2026-04-19 19:25:01.396732+00', '3102975163-58ade381-c5b9-443b-b398-58f5104d8948', '154767997373');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."order_items" ("id", "order_id", "product_id", "product_name", "unit_price_cents", "quantity", "notes", "subtotal_cents") VALUES
	('714fcada-8d1a-4cea-a7d1-6564ebb9d91c', 'e44bfb5b-b026-4993-af33-e8903d63b1ce', 'fb7d26d6-27bb-41f7-90bc-5f37e8bd0f93', 'Agua Mineral 500ml', 150000, 1, NULL, 150000),
	('d788064d-1c09-4135-bf39-2d6e83034bb9', 'cdea3a35-3721-4061-a759-47095f42afe4', 'fb7d26d6-27bb-41f7-90bc-5f37e8bd0f93', 'Agua Mineral 500ml', 150000, 1, NULL, 150000),
	('db72a417-2e46-4893-b56b-78dad74212e3', '01ae7b69-a2bd-4ec7-b65a-6d00940acc95', 'fb7d26d6-27bb-41f7-90bc-5f37e8bd0f93', 'Agua Mineral 500ml', 150000, 1, NULL, 150000),
	('2bec7cc5-6bd3-49a4-9df8-ca88094483d1', 'd7b2a244-a36f-455b-a33a-47c0fa2044c6', 'fb7d26d6-27bb-41f7-90bc-5f37e8bd0f93', 'Agua Mineral 500ml', 150000, 1, NULL, 150000),
	('f46f634d-dc9c-4eda-af1f-201034e4971c', 'e0d9bafc-4d8a-4655-80aa-712182fead5f', '323cedfc-fa19-4f9c-8564-4f475501915c', 'Pizza Napolitana', 1200000, 1, NULL, 1200000),
	('cc7d6821-eaf3-480a-8547-42d374298064', '1188f68d-c884-4957-b4e7-5a16357f4464', '323cedfc-fa19-4f9c-8564-4f475501915c', 'Pizza Napolitana', 1200000, 1, NULL, 1200000),
	('f2dd8d2b-c5ff-40a5-b719-9aa98f112512', '542dfd13-d624-4ac9-8404-19f0cb435bc8', '323cedfc-fa19-4f9c-8564-4f475501915c', 'Pizza Napolitana', 1200000, 1, NULL, 1200000),
	('c48526eb-1780-4208-80dd-fa739d4b00ed', 'd8dd2a92-ed5b-4db9-9ac0-652067043049', '323cedfc-fa19-4f9c-8564-4f475501915c', 'Pizza Napolitana', 1200000, 3, NULL, 3600000),
	('e392e54a-9a02-4df1-9ddd-4e4b2cadc2d3', '59151e78-5bd6-4204-b82e-c82a6b190989', '323cedfc-fa19-4f9c-8564-4f475501915c', 'Pizza Napolitana', 1200000, 3, NULL, 3600000),
	('587632e0-3402-4773-a101-693db523ce9b', '5c378692-8182-4cac-a1cd-aacb9c4c62d7', '42d6e217-e36c-48bd-bdc5-653567a802f9', 'Pizza Muzzarella', 999900, 1, NULL, 999900),
	('4ed6ccc8-2847-4f8b-9ee4-95b49af8b772', 'ea9ee4a8-105b-4cfd-ab94-e187e1f7e674', '42d6e217-e36c-48bd-bdc5-653567a802f9', 'Pizza Muzzarella', 999900, 1, NULL, 999900),
	('b685498d-f22a-4ff7-821e-b44fccf4915b', 'e666d071-feb8-4b98-b9e6-7dad015871bd', '42d6e217-e36c-48bd-bdc5-653567a802f9', 'Pizza Muzzarella', 999900, 1, NULL, 999900),
	('3e395ca5-a1a1-4b15-a51d-bf9e587d9f32', '3b097806-f6ca-4d79-bf87-44e4479823e2', '42d6e217-e36c-48bd-bdc5-653567a802f9', 'Pizza Muzzarella', 999900, 1, NULL, 999900),
	('6c6d7a6a-a6fb-4141-baec-011630dd4121', '0b94e8d4-5add-453b-97e0-d96e3e660adf', '42d6e217-e36c-48bd-bdc5-653567a802f9', 'Pizza Muzzarella', 999900, 1, NULL, 999900),
	('af97d75f-2858-45d3-afcd-818394af044d', '81058971-8c3c-4991-83b7-033c4968b7db', '42d6e217-e36c-48bd-bdc5-653567a802f9', 'Pizza Muzzarella', 999900, 1, NULL, 999900);


--
-- Data for Name: order_item_modifiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."order_item_modifiers" ("id", "order_item_id", "modifier_id", "modifier_name", "price_delta_cents") VALUES
	('a6056ffa-9737-4623-8e52-84e548345657', '587632e0-3402-4773-a101-693db523ce9b', '076f04bf-1a3d-43d7-949d-249b889c9314', 'Chica', 0),
	('9e912fbe-fabe-477f-9a4a-d7bfad1e7ff4', '4ed6ccc8-2847-4f8b-9ee4-95b49af8b772', '076f04bf-1a3d-43d7-949d-249b889c9314', 'Chica', 0),
	('07b68bca-c66f-4ba1-9352-e1ed2f0415af', 'b685498d-f22a-4ff7-821e-b44fccf4915b', '076f04bf-1a3d-43d7-949d-249b889c9314', 'Chica', 0),
	('f6d6f5e2-a7f0-478f-81a8-5a3aa5cca308', '3e395ca5-a1a1-4b15-a51d-bf9e587d9f32', '076f04bf-1a3d-43d7-949d-249b889c9314', 'Chica', 0),
	('117ae911-fe0d-4122-bff6-10c7ad1bb9d1', '6c6d7a6a-a6fb-4141-baec-011630dd4121', '076f04bf-1a3d-43d7-949d-249b889c9314', 'Chica', 0),
	('0bb889e2-9fe9-4ece-9e70-b1d2af9b9e43', 'af97d75f-2858-45d3-afcd-818394af044d', '076f04bf-1a3d-43d7-949d-249b889c9314', 'Chica', 0);


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."order_status_history" ("id", "order_id", "status", "changed_by", "notes", "created_at") VALUES
	('0ff82bd4-f0af-49b0-8196-387cc1078236', 'e44bfb5b-b026-4993-af33-e8903d63b1ce', 'pending', NULL, NULL, '2026-04-18 13:47:04.506909+00'),
	('6e47ec6d-051c-4dda-8ea7-9da6688267f0', 'cdea3a35-3721-4061-a759-47095f42afe4', 'pending', NULL, NULL, '2026-04-18 13:47:04.598275+00'),
	('9954e0c4-defb-4108-9f55-5aa825b35717', '01ae7b69-a2bd-4ec7-b65a-6d00940acc95', 'pending', NULL, NULL, '2026-04-18 13:47:04.666821+00'),
	('1304542f-9015-48a3-80d0-9034aaf67798', 'd7b2a244-a36f-455b-a33a-47c0fa2044c6', 'pending', NULL, NULL, '2026-04-18 13:47:04.7415+00'),
	('e9ecf1f7-ec6f-4ba4-aa08-a39b4ffb7ab5', 'd7b2a244-a36f-455b-a33a-47c0fa2044c6', 'confirmed', NULL, NULL, '2026-04-18 14:15:17.202813+00'),
	('abfbe6a3-2d95-4951-9fe9-048e6e120cef', 'd7b2a244-a36f-455b-a33a-47c0fa2044c6', 'preparing', NULL, NULL, '2026-04-18 14:15:41.924888+00'),
	('4400afcd-0050-4ed3-a43e-df7b13b82d3d', 'e0d9bafc-4d8a-4655-80aa-712182fead5f', 'pending', NULL, NULL, '2026-04-18 14:40:12.698063+00'),
	('611643b3-12dd-491a-ab35-74ad956ef624', 'e0d9bafc-4d8a-4655-80aa-712182fead5f', 'confirmed', NULL, NULL, '2026-04-18 14:40:58.163339+00'),
	('adb5204e-5b5a-4503-9033-e5608de8c062', 'e0d9bafc-4d8a-4655-80aa-712182fead5f', 'preparing', NULL, NULL, '2026-04-18 14:40:59.306453+00'),
	('f915306a-b6d5-4da1-94e6-492f05f4c900', 'e0d9bafc-4d8a-4655-80aa-712182fead5f', 'ready', NULL, NULL, '2026-04-18 14:41:09.003557+00'),
	('29a7bf70-b227-4e09-8c9a-903d80a84f44', '1188f68d-c884-4957-b4e7-5a16357f4464', 'pending', NULL, NULL, '2026-04-19 17:30:42.227471+00'),
	('831ca629-21b6-4de8-b5c4-00ca1a2f480e', '542dfd13-d624-4ac9-8404-19f0cb435bc8', 'pending', NULL, NULL, '2026-04-19 17:35:18.491019+00'),
	('7d07a98d-be3f-4dc0-b872-01ea0ce252f9', '542dfd13-d624-4ac9-8404-19f0cb435bc8', 'confirmed', NULL, NULL, '2026-04-19 17:57:54.642307+00'),
	('2e3cc9e1-e6be-4644-90ba-ed1ad9837838', '542dfd13-d624-4ac9-8404-19f0cb435bc8', 'preparing', NULL, NULL, '2026-04-19 17:57:55.351741+00'),
	('50b48440-5f70-48f1-a7f5-57380ffcb9ba', '1188f68d-c884-4957-b4e7-5a16357f4464', 'confirmed', NULL, NULL, '2026-04-19 17:57:56.486512+00'),
	('8667e284-a083-47f6-a0f0-0f5a05d51768', '1188f68d-c884-4957-b4e7-5a16357f4464', 'preparing', NULL, NULL, '2026-04-19 17:57:56.844527+00'),
	('9e87d178-806f-45f1-9672-a6a05082f516', '542dfd13-d624-4ac9-8404-19f0cb435bc8', 'ready', NULL, NULL, '2026-04-19 17:57:58.739808+00'),
	('6fa15246-6936-4ee8-9450-ecd737538042', '1188f68d-c884-4957-b4e7-5a16357f4464', 'ready', NULL, NULL, '2026-04-19 17:57:59.23633+00'),
	('c56d59fe-fa1f-4aee-b10e-c244acf38680', '542dfd13-d624-4ac9-8404-19f0cb435bc8', 'on_the_way', NULL, NULL, '2026-04-19 17:58:00.137773+00'),
	('44272b46-b3fd-4258-b6fe-a5805a899a6b', '1188f68d-c884-4957-b4e7-5a16357f4464', 'on_the_way', NULL, NULL, '2026-04-19 17:58:00.643751+00'),
	('c3d75b1e-fab0-4e81-85b8-b27e2b079079', '542dfd13-d624-4ac9-8404-19f0cb435bc8', 'delivered', NULL, NULL, '2026-04-19 17:58:01.622692+00'),
	('e27393b9-7ef9-4e9b-93f0-352fd56bae86', '1188f68d-c884-4957-b4e7-5a16357f4464', 'delivered', NULL, NULL, '2026-04-19 17:58:02.066488+00'),
	('3f9b75c8-4474-41e4-a205-870d55bf83a6', 'd8dd2a92-ed5b-4db9-9ac0-652067043049', 'pending', NULL, NULL, '2026-04-19 18:29:28.160851+00'),
	('803d1b3e-ddd7-4f21-88e0-33eee03bdc8d', '59151e78-5bd6-4204-b82e-c82a6b190989', 'pending', NULL, NULL, '2026-04-19 18:30:33.252536+00'),
	('d829793e-e2f8-43b3-ab3f-92f16f650b2d', '5c378692-8182-4cac-a1cd-aacb9c4c62d7', 'pending', NULL, NULL, '2026-04-19 18:37:51.715134+00'),
	('07bd2023-9785-4ff2-b733-1d54b2207acb', 'ea9ee4a8-105b-4cfd-ab94-e187e1f7e674', 'pending', NULL, NULL, '2026-04-19 18:43:23.234532+00'),
	('bdc58693-c88f-4033-8556-0252f77b70c4', 'e666d071-feb8-4b98-b9e6-7dad015871bd', 'pending', NULL, NULL, '2026-04-19 18:48:27.647304+00'),
	('4b9bdf02-51ed-4a49-88d4-1b7f69f8e309', '3b097806-f6ca-4d79-bf87-44e4479823e2', 'pending', NULL, NULL, '2026-04-19 18:50:25.100586+00'),
	('a2720799-f598-40c6-87a4-9efaee3ff1d9', '3b097806-f6ca-4d79-bf87-44e4479823e2', 'confirmed', NULL, NULL, '2026-04-19 18:53:07.02261+00'),
	('134b3246-8292-45bb-8b19-d9bc80516ec4', '3b097806-f6ca-4d79-bf87-44e4479823e2', 'preparing', NULL, NULL, '2026-04-19 18:53:34.724701+00'),
	('366b9ae4-71bd-45c8-be10-7a736f5d00c0', '3b097806-f6ca-4d79-bf87-44e4479823e2', 'ready', NULL, NULL, '2026-04-19 18:53:39.586002+00'),
	('2ab2b257-e356-49ef-adb2-771abf06bb40', '3b097806-f6ca-4d79-bf87-44e4479823e2', 'delivered', NULL, NULL, '2026-04-19 18:53:45.345639+00'),
	('a8a43328-d09e-4293-9773-a244396ee31e', '0b94e8d4-5add-453b-97e0-d96e3e660adf', 'pending', NULL, NULL, '2026-04-19 19:06:17.824403+00'),
	('ff9b5fc6-3192-4c78-883b-5eedc1fe1900', '0b94e8d4-5add-453b-97e0-d96e3e660adf', 'confirmed', NULL, NULL, '2026-04-19 19:13:10.922849+00'),
	('e7f76b3c-5bec-4098-87c8-e3e381a55b27', '81058971-8c3c-4991-83b7-033c4968b7db', 'pending', NULL, NULL, '2026-04-19 19:18:09.613973+00'),
	('9325faff-7ead-4e0a-a3b4-90dc706ae9b3', 'e666d071-feb8-4b98-b9e6-7dad015871bd', 'cancelled', NULL, 'pobre', '2026-04-19 19:20:02.417874+00'),
	('d147530e-391e-417a-86fe-96d57fab95e9', '5c378692-8182-4cac-a1cd-aacb9c4c62d7', 'cancelled', NULL, 'sss', '2026-04-19 19:20:07.67265+00'),
	('f96f49fa-fc8d-4c65-834b-169d49d3c159', 'ea9ee4a8-105b-4cfd-ab94-e187e1f7e674', 'cancelled', NULL, 'wedfwf', '2026-04-19 19:20:10.643144+00'),
	('8cdb9e50-bd91-460f-a775-a9771e017868', '59151e78-5bd6-4204-b82e-c82a6b190989', 'cancelled', NULL, 'wrfqwrfv', '2026-04-19 19:20:14.604453+00'),
	('16fd1c5c-a49b-4d21-95d5-8a55aab9f19b', 'd8dd2a92-ed5b-4db9-9ac0-652067043049', 'cancelled', NULL, 'erfververgv', '2026-04-19 19:20:22.595344+00'),
	('0858017e-8552-43ca-90a3-80bce9516306', '81058971-8c3c-4991-83b7-033c4968b7db', 'cancelled', NULL, 'Cancelado por el cliente', '2026-04-19 19:23:20.332547+00'),
	('34e32955-c998-4185-b83e-3b95429f0836', '0b94e8d4-5add-453b-97e0-d96e3e660adf', 'preparing', NULL, NULL, '2026-04-19 19:24:59.2569+00'),
	('88266328-3b20-4552-8878-1cec0f25ab70', '0b94e8d4-5add-453b-97e0-d96e3e660adf', 'ready', NULL, NULL, '2026-04-19 19:25:00.490079+00'),
	('c11731cd-58d7-4a76-87b5-ccfce3f25875', '0b94e8d4-5add-453b-97e0-d96e3e660adf', 'delivered', NULL, NULL, '2026-04-19 19:25:01.396732+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('products', 'products', NULL, '2026-04-18 12:55:39.363438+00', '2026-04-18 12:55:39.363438+00', true, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('5521706d-5db8-47e0-82c3-e67e863cb49b', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/logo-ce585ed9-0d04-4db0-9d03-88a889a238c7.png', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:16:31.295774+00', '2026-04-18 14:16:31.295774+00', '2026-04-18 14:16:31.295774+00', '{"eTag": "\"084a1d4acfcc5af8ade889b503310e1c\"", "size": 2327483, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:16:31.274Z", "contentLength": 2327483, "httpStatusCode": 200}', '4c58842d-e321-4584-9904-8e5d9009f046', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('2c4461b6-d52d-4665-86dd-f5dbbbdcc6aa', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/logo-a4fe9479-d1aa-49c7-b4d1-06e1468b1dde.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:16:41.398578+00', '2026-04-18 14:16:41.398578+00', '2026-04-18 14:16:41.398578+00', '{"eTag": "\"9b4dc870f58aa135e2504d38bffb10ea\"", "size": 15015, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:16:41.394Z", "contentLength": 15015, "httpStatusCode": 200}', '7bd791c1-c780-4907-ac6a-89a4dbe5ff3a', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('70ab0328-fbf0-4753-bb32-b38b60bdff4f', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/cover-5ec2cc68-5926-4409-a2dd-b37a9a6c1dcd.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:23:55.445149+00', '2026-04-18 14:23:55.445149+00', '2026-04-18 14:23:55.445149+00', '{"eTag": "\"2c8ca78177590f895ab4e7f41b6756b0\"", "size": 155646, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:23:55.442Z", "contentLength": 155646, "httpStatusCode": 200}', '8a6e47c8-4c10-4719-b49c-256bf9992e54', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('4ef65128-4f5b-4592-9090-f71ae0213b9c', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/cover-7a203a3e-212f-4f14-8c13-802b1964760e.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:23:59.358022+00', '2026-04-18 14:23:59.358022+00', '2026-04-18 14:23:59.358022+00', '{"eTag": "\"b003b0653635f64308b61349ff3c4832\"", "size": 10652, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:23:59.355Z", "contentLength": 10652, "httpStatusCode": 200}', '0274718b-2bd2-4acf-b39a-5cbb770d20ca', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('c70ae387-2d52-4852-a0bd-f03d61eecdbc', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/cover-2c4959e4-220f-4625-8da0-955e5b9404c1.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:24:03.095173+00', '2026-04-18 14:24:03.095173+00', '2026-04-18 14:24:03.095173+00', '{"eTag": "\"2c8ca78177590f895ab4e7f41b6756b0\"", "size": 155646, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:24:03.087Z", "contentLength": 155646, "httpStatusCode": 200}', '7a729c8c-0db4-4681-9a38-d1f94b9de409', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('3832730d-a325-4928-819d-e92909274f0e', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/logo-c52eecfb-0d8f-4ed2-a4b9-5b56d5b7df0f.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:24:34.498914+00', '2026-04-18 14:24:34.498914+00', '2026-04-18 14:24:34.498914+00', '{"eTag": "\"916ab4761ccf984bf8cd3995f740ffcc\"", "size": 9509, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:24:34.492Z", "contentLength": 9509, "httpStatusCode": 200}', '6bb6d342-5a91-4bd2-8079-a3345b03c3cb', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('bd791ca4-a13e-461f-993e-a5233911e4d6', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/cover-56cd01e3-c71c-4eaf-899f-01886da588a5.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:25:54.299701+00', '2026-04-18 14:25:54.299701+00', '2026-04-18 14:25:54.299701+00', '{"eTag": "\"7db1795d210af48d6d0eff426bad8ff0\"", "size": 109244, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:25:54.293Z", "contentLength": 109244, "httpStatusCode": 200}', '953a2425-ccaa-45bd-b4e5-092d0ff70d62', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('de958885-0c0c-4c4a-bc54-8a8466f4691d', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/e9b15326-1f83-4d72-9d9d-f36daca01183.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:47:40.48165+00', '2026-04-18 14:47:40.48165+00', '2026-04-18 14:47:40.48165+00', '{"eTag": "\"6d29a962810c98d1facb5a01ed9339c6\"", "size": 7508, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:47:40.461Z", "contentLength": 7508, "httpStatusCode": 200}', 'bf1ea7e4-8981-4459-a115-8efb36baf0cc', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('afd9e243-49c4-4342-bd21-4763cc9d0771', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/96946ea3-97a4-42ed-b803-13d14de2bf1c.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:51:58.055076+00', '2026-04-18 14:51:58.055076+00', '2026-04-18 14:51:58.055076+00', '{"eTag": "\"cf5c950e84d99c232ce3381f9e634397\"", "size": 12361, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:51:58.048Z", "contentLength": 12361, "httpStatusCode": 200}', '8fc82d72-b782-4508-871e-4bb044f81c68', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('787e4b57-2088-4537-ba16-a1c8674d0388', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/48339df4-129b-4d2a-acd7-ba65bc04c1c2.webp', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:52:40.689+00', '2026-04-18 14:52:40.689+00', '2026-04-18 14:52:40.689+00', '{"eTag": "\"90ad4eb71a390475416002c231602647\"", "size": 65502, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:52:40.680Z", "contentLength": 65502, "httpStatusCode": 200}', '724d68c7-2f66-435f-8d3a-d8feb3e35ad8', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('0ad6e1d6-03cf-4ade-b22e-478a30f37d65', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/f812dc4c-0c10-460b-948b-7635d628257f.avif', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:53:18.945035+00', '2026-04-18 14:53:18.945035+00', '2026-04-18 14:53:18.945035+00', '{"eTag": "\"5b49db7504fe836bdc09b5c560f4cee3\"", "size": 83243, "mimetype": "image/avif", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:53:18.938Z", "contentLength": 83243, "httpStatusCode": 200}', 'ff8821bc-06c1-4609-87b4-76bdb4d26310', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('fa13b0cc-ccf2-4a3d-b88e-e9e695ec2b48', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/b1cbebc5-02ff-4483-b7ef-e8bc92b6e5f4.avif', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:56:55.246398+00', '2026-04-18 14:56:55.246398+00', '2026-04-18 14:56:55.246398+00', '{"eTag": "\"bc145e6b2076f062298e07b71223c914\"", "size": 61499, "mimetype": "image/avif", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:56:55.240Z", "contentLength": 61499, "httpStatusCode": 200}', '9b0b2ab0-a432-41eb-bd9d-fb469ddee19f', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('655ab231-b505-4fee-bc48-3fb7052047bb', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/702144de-7cfe-4a25-a3f2-c5130ed10a17.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:57:10.226347+00', '2026-04-18 14:57:10.226347+00', '2026-04-18 14:57:10.226347+00', '{"eTag": "\"e7154e379eec1f3597b8cacff6626f9c\"", "size": 104124, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:57:10.217Z", "contentLength": 104124, "httpStatusCode": 200}', '6f1068b8-21c1-4ce3-aba2-47a320505f5d', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('dde08ba5-13c9-44b5-b0ea-a63e2dc5d0a0', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/5ba4360f-3c66-4ff9-9ff2-86ae497ff27d.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:57:33.861277+00', '2026-04-18 14:57:33.861277+00', '2026-04-18 14:57:33.861277+00', '{"eTag": "\"ebae761dfc2d1a0279035b5462d83e68\"", "size": 20722, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:57:33.855Z", "contentLength": 20722, "httpStatusCode": 200}', '55a0364f-f308-4ebe-9005-339ba08560bf', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('40f94b12-c422-431d-80d2-332d349433ff', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/a17a6166-688c-4b7c-8e21-11ae61bd8fc0.jpg', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:57:45.029624+00', '2026-04-18 14:57:45.029624+00', '2026-04-18 14:57:45.029624+00', '{"eTag": "\"ebae761dfc2d1a0279035b5462d83e68\"", "size": 20722, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:57:45.025Z", "contentLength": 20722, "httpStatusCode": 200}', 'ad44d7e4-d3bc-4a4e-99ee-540d6092be77', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}'),
	('bae23b75-1284-4273-b2b3-dcb5c0bceace', 'products', 'c2e5af14-ffcd-4349-9126-14f6f3517a35/b6209ed7-15a4-4575-a790-21a453e1618d.webp', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '2026-04-18 14:57:52.046406+00', '2026-04-18 14:57:52.046406+00', '2026-04-18 14:57:52.046406+00', '{"eTag": "\"d8e7807fa3081f09119419cac94a6f94\"", "size": 22104, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-04-18T14:57:52.041Z", "contentLength": 22104, "httpStatusCode": 200}', '2ecf1715-b172-41ec-9d5a-28b288b9bef8', 'e98df9fd-883a-47f5-a9e2-80f96f14f292', '{}');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 11, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict gp8v66aBxoJd5eer6G93n91ZTdXmQOa4mw96lDKRdDGmmxtkgZQL9bTXKQ3ZNta

RESET ALL;
