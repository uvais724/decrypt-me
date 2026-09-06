# Decrypt Me Documentation

Decrypt Me is a React and Vite cryptogram game backed by Supabase Auth and Postgres. Players decode hidden messages, send challenges to accepted connections, play a daily timed puzzle, and progress through single-player levels.

This documentation is organized by project area:

- [Project Overview](./architecture/project-overview.md)
- [Local Development](./operations/local-development.md)
- [Application Architecture](./architecture/application-architecture.md)
- [Architecture And UML Diagrams](./architecture/diagrams.md)
- [Frontend Routes](./frontend/routes.md)
- [Frontend Components](./frontend/components.md)
- [Gameplay Domain](./gameplay/gameplay-domain.md)
- [Algorithm Complexity](./gameplay/algorithm-complexity.md)
- [Supabase Schema](./database/schema-reference.md)
- [Backend Integration](./backend/supabase-integration.md)
- [API Reference](./backend/api-reference.md)
- [User Workflows](./workflows/user-workflows.md)
- [Trade-offs And Reflection](./architecture/tradeoffs-reflection.md)
- [STAR Mapping](./architecture/star-mapping.md)
- [Testing](./operations/testing.md)
- [Deployment](./operations/deployment.md)

The attached SQL schema has been copied into [schema.sql](./database/schema.sql) for reference. Treat that file as database context only; application behavior is documented from the actual codebase.
