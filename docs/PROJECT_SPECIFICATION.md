# FreightFlow: Master Project Specification

Welcome to the FreightFlow project documentation. FreightFlow is an enterprise-grade Freight Marketplace and Transportation Management System (TMS) designed to bridge Shippers, Brokers, and Carriers through a unified digital platform.

This master document serves as the single source of truth, cross-referencing all specialized architectural, design, and implementation documents.

## Table of Contents

1. [Product Requirements Document (PRD)](./PRD.md)
   Defines the product vision, core features, and high-level requirements.
2. [System Architecture](./ARCHITECTURE.md)
   High-level overview of the decoupled client-server architecture.
3. [Database Design](./DATABASE_DESIGN.md)
   The comprehensive PostgreSQL database blueprint covering 11 specific domains.
4. [Backend Architecture](./BACKEND_ARCHITECTURE.md)
   FastAPI structure, Domain-Driven Design (DDD), Unit of Work, and Outbox Pattern.
5. [Frontend Architecture](./FRONTEND_ARCHITECTURE.md)
   React/Vite architecture, component strategy, state management, and UX specifications.
6. [RBAC Matrix](./RBAC_MATRIX.md)
   Role-Based Access Control definitions and multi-company permission handling.
7. [Workflow Documentation](./WORKFLOW_DOCUMENTATION.md)
   Step-by-step lifecycles for freight matching, bidding, and shipment execution.
8. [API Specification](./API_SPECIFICATION.md)
   API Gateway structures, RESTful principles, and integration paths.
9. [Security Guidelines](./SECURITY_GUIDELINES.md)
   Data protection, multi-tenancy isolation, and authentication flows.
10. [Development Guide](./DEVELOPMENT_GUIDE.md)
    Instructions for local setup, testing strategies, observability, and deployments.
11. [Implementation Plan](./IMPLEMENTATION_PLAN.md)
    The phased rollout strategy for scaffolding and building the application.
12. [AI Development Rules](./AI_DEVELOPMENT_RULES.md)
    The strict operational rulebook for Antigravity (AI assistant) when modifying this codebase.

---

*This documentation is strictly adhered to during development. Any architectural changes must be reflected across these documents prior to code implementation.*
