# Workout Journal — Implementation Plan (Master Index)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack workout journal app with Rails API backend and React TypeScript SPA frontend.

**Architecture:** Rails 7+ API-only backend with PostgreSQL, React 18+ TypeScript SPA with Vite, communicating via RESTful JSON at `/api/v1/`. Monorepo with `server/` and `client/` directories.

**Tech Stack:** Ruby on Rails, PostgreSQL, React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Axios, Recharts, RSpec, Vitest

---

## Plan Files

This plan is broken into phases. Execute in order — each phase depends on the previous.

| Phase | File | Description |
|-------|------|-------------|
| 1 | [phase-1-rails-scaffolding.md](phase-1-rails-scaffolding.md) | ~~Rails app init, models, migrations, associations, validations~~ **DONE** |
| 2 | [phase-2-rails-api.md](phase-2-rails-api.md) | ~~Controllers, serializers, API endpoints, request specs~~ **DONE** |
| 3 | [phase-3-frontend-scaffolding.md](phase-3-frontend-scaffolding.md) | ~~React app init, routing, shared components, API client, types~~ **DONE** |
| 4a | [phase-4a-dashboard.md](phase-4a-dashboard.md) | ~~Dashboard page — quick stats, recent activity, Start Workout CTA~~ **DONE** |
| 4b | [phase-4b-exercises.md](phase-4b-exercises.md) | ~~Exercise Library + Exercise Detail pages~~ **DONE** |
| 4c | [phase-4c-templates.md](phase-4c-templates.md) | ~~Workout Templates + Template Detail pages~~ **DONE** |
| 4d | [phase-4d-active-workout.md](phase-4d-active-workout.md) | ~~Active Workout session page — core live-logging experience~~ **DONE** |
| 4e | [phase-4e-history.md](phase-4e-history.md) | ~~History list + Session Detail pages~~ **DONE** |
| 4f | [phase-4f-progress.md](phase-4f-progress.md) | Progress charts page with Recharts |
| 5 | [phase-5-seed-integration.md](phase-5-seed-integration.md) | Built-in exercise seed data, end-to-end integration, final polish |

## Execution Notes

- **Phase 1 + 2** are backend-only. Run `cd server && bundle exec rspec` to verify.
- **Phase 3** sets up the frontend shell. Run `cd client && npm run build` to verify.
- **Phase 4a–4f** are individual page builds. Each builds on Phase 3. Run `cd client && npm run build` after each.
- **Phase 5** ties everything together. Both servers running for full E2E.
- Each phase file is self-contained with exact file paths, complete code, and exact commands.
- TDD throughout: write failing test first, then implement.

## Spec Reference

- Design spec: `docs/superpowers/specs/2026-03-28-workout-journal-design.md`
- Active workout mockup: `.superpowers/brainstorm/23900-1774744427/content/active-workout.html`
- Navigation mockup: `.superpowers/brainstorm/23900-1774744427/content/navigation-v2.html`
